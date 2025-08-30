# APIキーの設定方法

## 🚀 簡単セットアップ（推奨）

### 1. api-config.jsファイルを編集

`40_settings/api-config.js`ファイルを開いて、あなたのAPIキーを記入してください：

```javascript
const API_CONFIG = {
    // OpenAI API Key
    OPENAI_API_KEY: 'sk-xxxxxxxxxxxxxxxx',  // ここにあなたのキーを入力
    
    // Anthropic API Key  
    ANTHROPIC_API_KEY: 'sk-ant-xxxxxxxxxx',  // ここにあなたのキーを入力
    
    // Google API Key
    GOOGLE_API_KEY: 'AIzaxxxxxxxxxx',  // ここにあなたのキーを入力
    
    // Cloudflare Workers URL (変更不要)
    WORKER_URL: 'https://polished-snow-477a.yutapii.workers.dev/',
};
```

### 2. ブラウザで開く

index.htmlを開くだけで、APIキーが自動的に読み込まれます。

## ✅ メリット

- **一度設定すれば永続的に保存**
- **ファイル修正してもAPIキーは消えない**
- **全ページで自動的に利用可能**
- **Gitには含まれない（.gitignoreで除外済み）**

## ⚠️ 注意事項

- `40_settings/api-config.js`ファイルは**絶対にGitにコミットしない**でください
- 共有PCでは使用しないでください
- APIキーは定期的に再発行することを推奨します

## 🔧 トラブルシューティング

### APIキーが読み込まれない場合

1. ブラウザの開発者ツール（F12）でコンソールを確認
2. 「✅ APIキーを自動読み込みしました」が表示されているか確認
3. 表示されていない場合は、40_settings/api-config.jsの記述を確認

### 従来の方法（手動設定）

40_settings/index.htmlから手動で設定することも可能です。