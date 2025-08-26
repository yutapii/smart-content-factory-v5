# GoogleアラートRSS URLの構造と取得方法

## URL形式
```
https://www.google.com/alerts/feeds/{USER_ID}/{ALERT_ID}
```

## パラメータ説明

### 1. USER_ID（最初の番号）
- **長さ**: 20桁の数字
- **内容**: あなたのGoogleアカウントに紐づく固定ID
- **特徴**: 同じアカウントのすべてのアラートで共通
- **例**: `12345678901234567890`

### 2. ALERT_ID（2番目の番号）
- **長さ**: 16-20桁の数字
- **内容**: 各アラート固有のID
- **特徴**: アラートごとに異なる
- **例**: `9876543210987654`

## 実際のURL例
```
https://www.google.com/alerts/feeds/12345678901234567890/9876543210987654
https://www.google.com/alerts/feeds/12345678901234567890/1234567890123456
https://www.google.com/alerts/feeds/12345678901234567890/5555666677778888
```
※同じUSER_ID、異なるALERT_ID

## 📝 取得方法

### 方法1: Googleアラートページから
1. https://www.google.co.jp/alerts にアクセス
2. アラート作成時に「配信先」を「RSSフィード」に設定
3. 作成後、オレンジ色のRSSアイコン 🔶 をクリック
4. 新しいタブで開いたURLをコピー

### 方法2: 既存アラートから
1. Googleアラート管理画面を開く
2. 各アラートの右側にあるRSSアイコンをクリック
3. URLをコピー

## ⚠️ 重要な注意点

### セキュリティ
- **USER_ID**と**ALERT_ID**は個人情報
- 他人と共有しない
- 公開リポジトリにコミットしない

### プライバシー
```javascript
// ❌ 悪い例：実際のIDを含める
const myAlertUrl = "https://www.google.com/alerts/feeds/12345678901234567890/9876543210987654";

// ✅ 良い例：環境変数や設定ファイルから読み込む
const myAlertUrl = process.env.GOOGLE_ALERT_RSS_URL;
```

## 🔧 SCF V5での使用例

### LocalStorageに保存
```javascript
// アラート追加時
const alertData = {
    name: "Googleアラート - 生成AI",
    url: "https://www.google.com/alerts/feeds/[USER_ID]/[ALERT_ID]",
    category: "AI最新動向",
    isGoogleAlert: true,
    addedAt: new Date().toISOString()
};

// 保存
const feeds = JSON.parse(localStorage.getItem('rss-feeds') || '[]');
feeds.push(alertData);
localStorage.setItem('rss-feeds', JSON.stringify(feeds));
```

### CORS回避でのアクセス
```javascript
// Cloudflare Worker経由
const proxyUrl = "https://polished-snow-477a.yutapii.workers.dev/";
const alertUrl = "https://www.google.com/alerts/feeds/[USER_ID]/[ALERT_ID]";
const finalUrl = proxyUrl + "?url=" + encodeURIComponent(alertUrl);

fetch(finalUrl)
    .then(response => response.text())
    .then(xml => {
        // RSSフィードをパース
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");
        // 処理...
    });
```

## 📊 複数アラートの管理

### パターン1: 同じUSER_ID
```javascript
const myUserId = "12345678901234567890"; // 固定
const myAlerts = [
    { name: "AI", alertId: "1111111111111111" },
    { name: "ロボット", alertId: "2222222222222222" },
    { name: "自動運転", alertId: "3333333333333333" }
];

// URL生成
myAlerts.forEach(alert => {
    const url = `https://www.google.com/alerts/feeds/${myUserId}/${alert.alertId}`;
    console.log(`${alert.name}: ${url}`);
});
```

### パターン2: 完全なURL管理
```javascript
const googleAlerts = [
    {
        name: "生成AI最新",
        url: "https://www.google.com/alerts/feeds/xxxxx/xxxxx", // 実際のIDに置き換え
        keyword: '"生成AI" OR "Generative AI"',
        frequency: "daily"
    },
    {
        name: "ChatGPT動向",
        url: "https://www.google.com/alerts/feeds/yyyyy/yyyyy", // 実際のIDに置き換え
        keyword: "ChatGPT OR Claude",
        frequency: "as_it_happens"
    }
];
```

## 🎯 トラブルシューティング

### URLが機能しない場合
1. **配信先の確認**: 「RSSフィード」になっているか
2. **ログイン状態**: Googleアカウントにログイン中か
3. **アラートの状態**: 一時停止していないか

### フィードが空の場合
- キーワードが狭すぎる可能性
- 地域・言語設定を確認
- 頻度設定を「その都度」に変更してテスト

## 💡 ベストプラクティス

1. **ID管理**
   - 設定ファイルや環境変数で管理
   - GitHubには上げない

2. **バックアップ**
   - URL一覧をエクスポート機能で保存
   - 定期的にバックアップ

3. **命名規則**
   ```
   Googleアラート - [カテゴリ] - [キーワード概要]
   例: Googleアラート - AI - ChatGPT最新
   ```