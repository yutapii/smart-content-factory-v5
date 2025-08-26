# Googleアラート RSS設定できない問題の解決方法

## ⚠️ 問題：配信先が「メールアドレス」から変更できない

### 原因
2023年以降、GoogleアラートのUIが変更され、**新規作成時にRSSフィード選択が表示されない**ケースが増えています。

## ✅ 解決方法

### 方法1：直接URL編集（最も確実）
```
1. 通常通りアラートを作成（メール配信で）
2. 作成後、以下のURLパターンでアクセス：

https://www.google.com/alerts/feeds/[あなたのUSER_ID]/[生成されたALERT_ID]
```

**ただし、USER_IDとALERT_IDが必要です。**

### 方法2：既存のRSSフィードURLから推測
もし過去に1つでもRSSフィードを作成したことがある場合：
1. そのRSS URLからUSER_IDを取得
2. 新しいアラートを作成（メール配信）
3. ブラウザの開発者ツール（F12）でALERT_IDを探す

### 方法3：代替サービスを使用

#### Google Alerts APIの代替
```javascript
// Feedlyを使用
const feedlyUrl = "https://feedly.com/i/subscription/feed%2F" + 
                  encodeURIComponent(googleAlertUrl);

// Inoreaderを使用  
const inoreaderUrl = "https://www.inoreader.com/search/feeds/" + 
                     encodeURIComponent(keyword);
```

### 方法4：カスタム検索APIを使用
```javascript
// Google Custom Search API
const API_KEY = "YOUR_API_KEY";
const CX = "YOUR_SEARCH_ENGINE_ID";
const query = "生成AI";

const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${query}&dateRestrict=d1`;
```

## 🔧 SCF V5での代替実装

### 1. Google検索結果のスクレイピング（非推奨）
```javascript
// 注意：利用規約に違反する可能性があります
async function getGoogleNews(keyword) {
    const url = `https://news.google.com/search?q=${encodeURIComponent(keyword)}&hl=ja&gl=JP&ceid=JP:ja`;
    // Cloudflare Worker経由で取得
    const response = await fetch(workerUrl + "?url=" + encodeURIComponent(url));
    // パース処理...
}
```

### 2. 代替ニュースAPIの使用（推奨）
```javascript
// NewsAPI.org
const NEWS_API_KEY = "YOUR_NEWS_API_KEY";
const newsUrl = `https://newsapi.org/v2/everything?q=${keyword}&language=ja&apiKey=${NEWS_API_KEY}`;

// Bing News Search API
const BING_API_KEY = "YOUR_BING_API_KEY";
const bingUrl = `https://api.bing.microsoft.com/v7.0/news/search?q=${keyword}&mkt=ja-JP`;
```

### 3. 既存のRSSフィードを活用
```javascript
const alternativeFeeds = {
    "AI": [
        "https://news.google.com/rss/search?q=生成AI&hl=ja&gl=JP&ceid=JP:ja",
        "https://b.hatena.ne.jp/search/tag?q=AI&mode=rss",
        "https://qiita.com/tags/ai/feed"
    ],
    "ロボット": [
        "https://news.google.com/rss/search?q=ロボット&hl=ja&gl=JP&ceid=JP:ja",
        "https://robotstart.info/feed"
    ],
    "自動運転": [
        "https://news.google.com/rss/search?q=自動運転&hl=ja&gl=JP&ceid=JP:ja",
        "https://jidounten-lab.com/feed"
    ]
};
```

## 📊 比較表

| 方法 | メリット | デメリット | 費用 |
|------|---------|-----------|------|
| Googleアラート（メール） | 公式・安定 | RSS不可 | 無料 |
| Google News RSS | RSS対応 | カスタマイズ不可 | 無料 |
| NewsAPI | 高機能 | API制限あり | 一部有料 |
| Feedly | UI優秀 | 無料版制限 | 一部有料 |
| カスタム実装 | 完全制御 | 開発必要 | サーバー代 |

## 🎯 推奨解決策

### SCF V5での最適解
1. **Google News RSSを使用**（即座に利用可能）
   ```
   https://news.google.com/rss/search?q=[キーワード]&hl=ja&gl=JP&ceid=JP:ja
   ```

2. **既存のCloudflare Workerで取得**
   ```javascript
   const googleNewsRss = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ja&gl=JP&ceid=JP:ja`;
   const proxyUrl = "https://polished-snow-477a.yutapii.workers.dev/?url=" + encodeURIComponent(googleNewsRss);
   ```

3. **RSSリーダーに追加**
   - 名前：`Google News - ${keyword}`
   - URL：上記のProxy URL
   - カテゴリ：ニュース

## 💡 暫定対応

GoogleアラートのRSS機能が復活するまで：
1. Google News RSSを代替として使用
2. 複数のニュースソースを組み合わせる
3. 定期的にGoogleアラートの仕様を確認

## 📝 設定例

```javascript
// SCF V5 に追加するフィード
const googleNewsFeeds = [
    {
        name: "Google News - 生成AI",
        url: "https://news.google.com/rss/search?q=生成AI+OR+ChatGPT+OR+Claude&hl=ja&gl=JP&ceid=JP:ja",
        category: "AI最新動向"
    },
    {
        name: "Google News - ヒューマノイドロボット",
        url: "https://news.google.com/rss/search?q=ヒューマノイドロボット+OR+人型ロボット&hl=ja&gl=JP&ceid=JP:ja",
        category: "ロボット技術"
    },
    {
        name: "Google News - 自動運転",
        url: "https://news.google.com/rss/search?q=自動運転+レベル4+OR+レベル5&hl=ja&gl=JP&ceid=JP:ja",
        category: "自動運転"
    }
];
```

これらのURLは既存のCloudflare Worker（`polished-snow-477a.yutapii.workers.dev`）で問題なく取得できます。