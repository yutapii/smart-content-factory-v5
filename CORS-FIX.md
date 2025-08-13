# 🚨 RSS取得エラーの解決方法

## 問題の原因

1. **Cloudflare WorkerのCORSエラー**
   - Worker自体がCORSヘッダーを返していない
   - `origin 'null'`（ローカルファイル）からのアクセスがブロックされている

2. **RSS2JSONのレート制限**
   - 429エラー（Too Many Requests）
   - 無料版の制限に達している

## 解決方法

### 方法1: ローカルサーバーを使用（推奨）

```bash
# Python3がインストールされている場合
cd /Users/saitoyutaka/smart-content-factory-v5
python3 start-server.py

# または簡易サーバー
python3 -m http.server 8080
```

その後、ブラウザで以下にアクセス：
- http://localhost:8080/rss-sources/
- http://localhost:8080/rss-reader/

### 方法2: Cloudflare Workerを修正

Cloudflare WorkerのコードにCORSヘッダーを追加：

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response('URL parameter is required', { status: 400 });
    }
    
    try {
      const response = await fetch(targetUrl);
      const text = await response.text();
      
      // CORSヘッダーを追加
      return new Response(text, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/xml',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
```

### 方法3: 代替プロキシサービス

RSS2JSONの代替として以下のサービスを試す：

1. **Feedrapp API**
   ```javascript
   const apiUrl = `https://feedrapp.info?q=${encodeURIComponent(url)}&num=10`;
   ```

2. **自前のプロキシサーバー構築**
   - Node.js + Express
   - Python + Flask
   - Deno Deploy

## 一時的な対処

1. **RSS2JSONの使用を制限**
   - 1時間あたりのリクエスト数を減らす
   - キャッシュを活用

2. **フィード数を減らす**
   - 重要なフィードのみを有効化
   - 更新頻度を下げる

## 推奨される恒久対策

1. **Cloudflare Workerの修正**（最優先）
2. **独自プロキシサーバーの構築**
3. **有料プランの検討**（RSS2JSON Pro等）

---

*注意: `file://`プロトコルからのCORS制限は、ブラウザのセキュリティ機能です。*
*ローカルサーバーを使用することで、この制限を回避できます。*