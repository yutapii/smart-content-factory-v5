# 🎯 解決策：既存のWorkerを活用

## 現状
- **RSS Worker** (`polished-snow-477a.yutapii.workers.dev`) → ✅ 既にデプロイ済み
- **Claude Worker** → ❌ 未デプロイ

## 2つの選択肢

### 選択肢1：既存のWorkerを更新（推奨）
**既にデプロイされている`polished-snow-477a`にClaude機能を追加**

#### メリット
- 新しいデプロイ不要
- 1つのWorkerで両方の機能が使える
- すぐに使える

#### 手順
1. Cloudflareダッシュボードにログイン
2. `polished-snow-477a`のWorkerを開く
3. 「Quick edit」をクリック
4. 下記の統合コードをコピペ
5. 「Save and Deploy」

### 選択肢2：新しいWorkerを作成
**Claude専用の新しいWorkerをデプロイ**

#### メリット
- 機能が分離されて管理しやすい
- それぞれ独立して更新可能

#### デメリット
- 新規デプロイが必要
- 2つのWorker URLを管理

---

## 📝 統合Worker コード（選択肢1用）

以下のコードで、1つのWorkerでRSSとClaude APIの両方に対応できます：

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Claude API用のエンドポイント
    if (url.pathname === '/claude') {
      return handleClaudeAPI(request);
    }
    
    // RSS用（既存の処理）
    return handleRSSProxy(request);
  }
};

// Claude API処理
async function handleClaudeAPI(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const apiKey = body.apiKey;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    delete body.apiKey;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// RSS処理（既存のコード）
async function handleRSSProxy(request) {
  // 既存のRSSプロキシコード（省略）
  // cloudflare-worker-fix.jsの内容をそのまま使用
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      }
    });
  }

  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  
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
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      }
    });

    const text = await response.text();
    
    return new Response(text, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/xml',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
```

---

## 🔧 SCF V5側の設定

### article/index.htmlの修正
```javascript
// Worker URLに/claudeパスを追加
const workerUrl = localStorage.getItem('cloudflare-worker-url');
const claudeEndpoint = workerUrl + '/claude';  // ← /claudeを追加

const response = await fetch(claudeEndpoint, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
});
```

---

## ✅ これで完了！

1. 既存のWorker（`polished-snow-477a`）を更新
2. `/claude`パスでClaude APIが使える
3. 新しいデプロイ不要