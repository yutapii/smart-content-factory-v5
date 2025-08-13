# 既存Workerのアップデート手順

## polished-snow-477a を更新する方法

既存の `polished-snow-477a` Worker に Claude API プロキシ機能を追加します。

### 手順

1. **Cloudflare ダッシュボードにログイン**
   - https://dash.cloudflare.com

2. **Workers & Pages から polished-snow-477a を選択**

3. **「Quick edit」または「Edit code」をクリック**

4. **worker-combined.js の内容をコピー**
   - 既存のコードを全て選択して削除
   - `worker-combined.js` の内容を貼り付け

5. **「Save and Deploy」をクリック**

### 動作確認

#### RSS機能（既存）
```
https://polished-snow-477a.{your-subdomain}.workers.dev/fetch-rss?url=RSSのURL
```

#### Claude API機能（新規）
```
https://polished-snow-477a.{your-subdomain}.workers.dev/claude
```

### 設定画面での設定

1. 設定画面を開く
2. APIキーセクションへ
3. 「Cloudflare Worker URL」に以下を入力：
   ```
   https://polished-snow-477a.{your-subdomain}.workers.dev
   ```
   ※ 実際のWorker URLを入力してください

4. 保存

これで記事生成機能のAI生成が使えるようになります！

## トラブルシューティング

### エラーが出る場合

1. **Worker URLが正しいか確認**
   - 末尾に `/` がないこと
   - httpsで始まっていること

2. **APIキーが正しいか確認**
   - `sk-ant-api03-` で始まるClaude APIキー

3. **ブラウザのコンソールでエラーを確認**
   - F12キーでコンソールを開く
   - エラーメッセージを確認