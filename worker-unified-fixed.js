/**
 * 修正版 統合Cloudflare Worker - RSS & Claude API Proxy
 * エラーハンドリング強化版
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Claude API用のエンドポイント
    if (url.pathname === '/claude') {
      return handleClaudeAPI(request);
    }
    
    // RSS用
    return handleRSSProxy(request);
  }
};

// Claude API処理
async function handleClaudeAPI(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    const body = await request.json();
    
    // APIキーをWorker環境変数から取得（セキュア）
    const apiKey = body.apiKey || 'YOUR_API_KEY_HERE';
    delete body.apiKey;

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await apiResponse.text();
    
    return new Response(data, {
      status: apiResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// RSS処理（エラーハンドリング強化）
async function handleRSSProxy(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  
  if (!targetUrl) {
    return new Response(JSON.stringify({
      error: 'URL parameter is required',
      example: '/?url=https://example.com/feed.xml'
    }), { 
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // URL検証
    const parsedUrl = new URL(targetUrl);
    
    // 特定のドメインは別処理（TechCrunch Japan対策）
    if (parsedUrl.hostname === 'jp.techcrunch.com') {
      // RSS2JSON API経由で取得
      const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(rss2jsonUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`RSS2JSON API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // RSS形式に変換
      const rssXml = convertJsonToRss(data);
      
      return new Response(rssXml, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/rss+xml',
          'Cache-Control': 'public, max-age=300'
        }
      });
    }
    
    // 通常のRSS取得
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      redirect: 'follow',
      // タイムアウト対策
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    
    // 簡易的なRSS/XML検証
    if (!text.includes('<rss') && !text.includes('<feed') && !text.includes('<?xml')) {
      throw new Error('Invalid RSS/XML format');
    }
    
    return new Response(text, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/rss+xml',
        'Cache-Control': 'public, max-age=300',
        'X-Proxied-URL': targetUrl
      }
    });
    
  } catch (error) {
    console.error('RSS Proxy Error:', error.message);
    
    // 詳細なエラー情報を返す
    return new Response(JSON.stringify({
      error: 'Failed to fetch RSS feed',
      message: error.message,
      url: targetUrl,
      timestamp: new Date().toISOString(),
      suggestion: 'Try using a different RSS feed URL or check if the feed is accessible'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

// JSON to RSS変換ヘルパー
function convertJsonToRss(data) {
  if (!data || !data.items) {
    throw new Error('Invalid RSS2JSON response');
  }
  
  const items = data.items.map(item => `
    <item>
      <title><![CDATA[${item.title || ''}]]></title>
      <link>${item.link || ''}</link>
      <description><![CDATA[${item.description || item.content || ''}]]></description>
      <pubDate>${item.pubDate || new Date().toUTCString()}</pubDate>
      <guid>${item.guid || item.link || ''}</guid>
    </item>
  `).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${data.feed?.title || 'RSS Feed'}</title>
    <link>${data.feed?.link || ''}</link>
    <description>${data.feed?.description || ''}</description>
    ${items}
  </channel>
</rss>`;
}