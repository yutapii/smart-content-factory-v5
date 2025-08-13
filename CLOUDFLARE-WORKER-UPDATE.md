# 📝 Cloudflare Worker 修正手順

## 🎯 目的
CORSエラーを解決して、ローカルファイルからRSSフィードを取得できるようにする

## 📋 手順

### 1. Cloudflare Dashboardにログイン
1. https://dash.cloudflare.com/ にアクセス
2. メールアドレスとパスワードでログイン

### 2. Workerを選択
1. 左側メニューから「Workers & Pages」をクリック
2. `polished-snow-477a` をクリック（あなたのWorker名）

### 3. コードを編集
1. 「Quick edit」または「Edit code」ボタンをクリック
2. 現在のコードを全て削除
3. `cloudflare-worker-fix.js`の内容を全てコピー＆ペースト

### 4. デプロイ
1. 右上の「Save and Deploy」ボタンをクリック
2. 「Deploy」を確認

### 5. テスト
1. 以下のURLをブラウザで開いてテスト：
   ```
   https://polished-snow-477a.yutapii.workers.dev?url=https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
   ```
2. XMLが表示されればOK

## ✅ 修正内容

### 追加されたCORSヘッダー
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',           // 全てのオリジンを許可
  'Access-Control-Allow-Methods': 'GET, OPTIONS', // 許可するメソッド
  'Access-Control-Allow-Headers': 'Content-Type, Accept', // 許可するヘッダー
  'Cache-Control': 'public, max-age=300'        // 5分間キャッシュ
}
```

### 追加された機能
- ✅ OPTIONSリクエスト（プリフライト）対応
- ✅ エラーハンドリング改善
- ✅ User-Agent設定
- ✅ キャッシュ制御
- ✅ デバッグ用ログ

## 🔍 確認方法

### ブラウザのコンソールで確認
1. SCF V5のRSS Sources画面を開く
2. F12でコンソールを開く
3. 「更新」ボタンをクリック
4. エラーが消えて記事が表示されることを確認

### 期待される結果
- ❌ 修正前：`CORS policy: No 'Access-Control-Allow-Origin' header`
- ✅ 修正後：記事が正常に表示される

## ⚠️ トラブルシューティング

### もし動作しない場合
1. **キャッシュをクリア**
   - ブラウザのキャッシュをクリア
   - Cloudflare Workerのキャッシュもパージ

2. **Worker URLを確認**
   - 正しいURL: `https://polished-snow-477a.yutapii.workers.dev`
   - 末尾にスラッシュを付けない

3. **ログを確認**
   - Cloudflare Dashboard > Workers > Logs
   - エラーメッセージを確認

## 📊 修正後の利点

- ✅ **無料**でRSSプロキシが使える（10万リクエスト/日）
- ✅ CORSエラーが解決
- ✅ RSS2JSONの有料プラン不要
- ✅ 高速なレスポンス（Cloudflareのエッジネットワーク）
- ✅ 5分間のキャッシュで効率化

## 🚀 次のステップ

1. Workerのコードを更新 ⬅️ **今ここ**
2. SCF V5で動作確認
3. 全てのRSSフィードが取得できることを確認
4. 必要に応じてキャッシュ時間を調整

---

*この修正により、年間14,000円のRSS2JSON有料プランは不要になります！*