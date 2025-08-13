/**
 * Cloudflare Worker - RSS CORS Proxy
 * 
 * このコードをCloudflare Dashboardにコピー＆ペーストしてください
 * URL: https://polished-snow-477a.yutapii.workers.dev
 * 
 * 修正内容：CORSヘッダーを追加してローカルファイルからのアクセスを許可
 */

export default {
  async fetch(request) {
    // OPTIONSリクエスト（プリフライト）への対応
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    // URLパラメータのチェック
    if (!targetUrl) {
      return new Response('URL parameter is required', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain'
        }
      });
    }

    try {
      console.log('Fetching RSS from:', targetUrl);
      
      // RSSフィードを取得
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        redirect: 'follow'
      });

      // レスポンスのチェック
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'text/xml';
      const text = await response.text();
      
      // HTMLが返ってきた場合のチェック
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error('HTML returned instead of RSS for:', targetUrl);
        throw new Error('Invalid RSS feed - HTML content received');
      }
      
      // 空のレスポンスチェック
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response received');
      }
      
      // CORSヘッダー付きでレスポンスを返す
      return new Response(text, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Cache-Control': 'public, max-age=300', // 5分間キャッシュ
          'X-Proxied-URL': targetUrl
        }
      });
      
    } catch (error) {
      console.error('Error fetching RSS:', error);
      
      // エラーレスポンスにもCORSヘッダーを付ける
      return new Response(
        JSON.stringify({
          error: error.message,
          url: targetUrl,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept'
          }
        }
      );
    }
  }
};