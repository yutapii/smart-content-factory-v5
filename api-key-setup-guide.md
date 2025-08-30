# API Key 設定ガイド（セキュア版）

## 📋 設定方法

### 1. API Keyを一箇所で管理
`/40_settings/api-config.js` ファイルを開いて、以下の箇所にAPI Keyを設定：

```javascript
// RSS2JSON API Key (無料プラン: 10,000リクエスト/日)
RSS2JSON_API_KEY: 'ここにあなたのAPI Keyを入力',
```

### 2. 設定後の動作
- ページ読み込み時に自動でLocalStorageに保存
- 05_rss-readerが自動的にこのキーを使用
- HTMLファイルにはキーを書かない

## 🔒 セキュリティのベストプラクティス

### やるべきこと ✅
- API Keyは `api-config.js` のみに記載
- `.gitignore` に `api-config.js` を追加
- バックアップは暗号化して保存

### やってはいけないこと ❌
- HTMLファイルに直接記載
- GitHubにコミット
- 複数箇所に分散記載

## 📝 .gitignore 設定例
```
# API設定ファイル
40_settings/api-config.js
api-config.js

# バックアップ
*.backup
*.key
```

## 🚀 設定確認方法

1. **ブラウザで確認**
   - 05_rss-reader/index.html を開く
   - F12でコンソールを開く
   - 以下を実行：
   ```javascript
   localStorage.getItem('rss2json-api-key')
   ```

2. **正しく設定されていれば**
   - あなたのAPI Keyが表示される
   - 05_rss-readerで自動的に使用される

## 💡 トラブルシューティング

### API Keyが反映されない場合
1. ブラウザを完全リロード（Cmd+Shift+R）
2. LocalStorageをクリア後、再読み込み
3. api-config.jsの構文エラーをチェック

---
*API Keyは機密情報です。適切に管理してください。*