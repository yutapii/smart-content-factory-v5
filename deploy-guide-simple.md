# 🚀 超簡単！Cloudflare Workerデプロイ手順

## デプロイ = プログラムをネット上で動かすこと

### 📋 必要なもの
- メールアドレス（無料アカウント作成用）
- `claude-worker.js`ファイル（既に作成済み）

---

## 🎯 3ステップでデプロイ完了

### ステップ1：Cloudflareアカウント作成（3分）
1. https://dash.cloudflare.com を開く
2. 「Sign Up」をクリック
3. メールアドレスとパスワードを入力
4. 届いたメールの確認リンクをクリック

### ステップ2：Workerを作成（2分）
1. ログイン後、左メニューの「Workers & Pages」をクリック
2. 青い「Create Application」ボタンをクリック
3. 「Create Worker」を選択
4. 名前を入力（例：`claude-proxy`）
   - この名前がURLの一部になります
5. 「Deploy」ボタンをクリック

### ステップ3：コードをコピペ（1分）
1. 「Edit code」ボタンをクリック
2. 表示されたエディタの中身を全て削除（Ctrl+A → Delete）
3. `claude-worker.js`の中身を全てコピー
4. エディタに貼り付け（Ctrl+V）
5. 右上の「Save and Deploy」ボタンをクリック

---

## ✅ 完了！URLをコピー

デプロイ完了後、以下のようなURLが表示されます：
```
https://claude-proxy.あなたのID.workers.dev
```

このURLをコピーして、SCF V5の設定画面に貼り付けます。

---

## 🔧 SCF V5での設定

1. SCF V5の設定画面を開く
2. 「API設定」セクションへ
3. 「Cloudflare Worker URL」欄に先ほどのURLを貼り付け
4. 「保存」をクリック

---

## 💡 よくある質問

### Q: お金はかかる？
**A: 無料です**（月10万リクエストまで）

### Q: 安全？
**A: はい**。APIキーは暗号化され、あなた専用のWorkerで処理されます。

### Q: うまくいかない時は？
**A: `test-claude-worker.html`を開いてテストしてください**

### Q: デプロイって何回もできる？
**A: はい**。コードを修正したら、同じ手順で何度でも更新できます。

---

## 🎉 これでAI記事生成が使えます！

記事生成ページでAIボタンを押すと、Cloudflare Worker経由で安全にClaudeが使えるようになりました。