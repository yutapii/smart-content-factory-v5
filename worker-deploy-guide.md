# Cloudflare Worker デプロイガイド

## 手順

### 1. Cloudflareアカウントの作成
1. https://dash.cloudflare.com にアクセス
2. アカウントを作成（無料）

### 2. Workerの作成
1. ダッシュボードから「Workers & Pages」を選択
2. 「Create Application」をクリック
3. 「Create Worker」を選択
4. 名前を入力（例：`claude-api-proxy`）
5. 「Deploy」をクリック

### 3. コードのデプロイ
1. 「Edit code」をクリック
2. `claude-worker.js`の内容をすべてコピー
3. エディタに貼り付け
4. 「Save and Deploy」をクリック

### 4. URLの取得
1. デプロイ完了後、Worker URLが表示されます
   例：`https://claude-api-proxy.your-subdomain.workers.dev`
2. このURLをコピー

### 5. SCF V5に設定
1. 設定画面（/settings/index.html）を開く
2. 「APIキー」セクションへ
3. 「Cloudflare Worker URL」にWorker URLを入力
4. 保存

## 完了！
これでAI生成機能が使えるようになります。