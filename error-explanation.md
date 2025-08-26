# 「Failed to fetch」エラーの原因と解決の流れ

## 🚨 エラーが起きている場所

```javascript
// article/index.html の896行目
const response = await fetch(apiUrl, {  // ← ここでエラー！
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
});
```

## ❌ なぜエラーになるのか

### 現在の状況（エラーが出る）
```
あなたのブラウザ → ❌ → api.anthropic.com
                  ↑
            CORSでブロック！
```

**ブラウザのセキュリティ機能（CORS）**により、以下の通信がブロックされます：
- `localhost` や `file://` から
- `api.anthropic.com` への直接アクセス

これは**ブラウザが悪意のあるサイトからAPIを勝手に呼ばれないよう守っている**ためです。

## ✅ 解決方法

### 修正後の通信経路
```
あなたのブラウザ → ✅ → Cloudflare Worker → ✅ → api.anthropic.com
                     （中継サーバー）
```

## 🤔 なぜCloudflareを経由すると動くのか

### 1. ブラウザ → Cloudflare Worker
- **同じインターネット上のサービス同士**の通信
- CloudflareがCORSを許可する設定（`Access-Control-Allow-Origin: *`）
- ✅ ブラウザが許可

### 2. Cloudflare Worker → Anthropic API  
- **サーバー同士**の通信
- CORSの制限がない（ブラウザのルールは適用されない）
- ✅ 正常に通信可能

## 📝 コード修正の内容

### 修正前（エラーが出る）
```javascript
// 直接Anthropic APIを呼ぼうとする
const apiUrl = 'https://api.anthropic.com/v1/messages';
const response = await fetch(apiUrl, {
    headers: {
        'x-api-key': apiKey,  // 直接APIキーを送信
    }
});
```

### 修正後（動作する）
```javascript
// Cloudflare Worker経由で呼ぶ
const workerUrl = localStorage.getItem('cloudflare-worker-url');
const response = await fetch(workerUrl, {  // Workerに送信
    body: JSON.stringify({
        apiKey: apiKey,  // WorkerがAPIキーを使ってAnthropicを呼ぶ
        ...requestBody
    })
});
```

## 🚀 なぜ「デプロイ」が必要なのか

### デプロイしないと...
- `claude-worker.js`は**ただのテキストファイル**
- あなたのPCにあるだけ
- インターネットからアクセスできない

### デプロイすると...
- Cloudflareのサーバーで**実際に動くプログラム**になる
- URLが付与される（例：`https://your-worker.workers.dev`）
- ブラウザからアクセス可能になる

## 📊 まとめ

1. **エラーの原因**: ブラウザのCORS制限
2. **解決策**: Cloudflare Worker経由で通信
3. **必要な作業**: Worker（中継プログラム）をCloudflareにデプロイ
4. **結果**: AI生成機能が正常に動作

---

## 💡 簡単な例え

### 現在（エラー）
```
日本（ブラウザ）→ ❌ →アメリカ（Anthropic）
        ↑
    パスポートがない！
```

### 解決後
```
日本（ブラウザ）→ ✅ →大使館（Cloudflare）→ ✅ →アメリカ（Anthropic）
                    ↑
                代理で手続き
```

デプロイ = 大使館（Cloudflare Worker）を設置すること