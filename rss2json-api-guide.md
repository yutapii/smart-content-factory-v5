# RSS2JSON API 完全ガイド

## 📋 概要
RSS2JSON は、RSS/AtomフィードをJSON形式に変換し、CORS制限を回避できる無料/有料のAPIサービスです。

## 🌐 公式サイト
- **URL**: https://rss2json.com
- **API Documentation**: https://rss2json.com/docs

## 💰 料金プラン

| プラン | 月額 | リクエスト数/日 | 更新頻度 | 商用利用 | サポート |
|--------|------|----------------|----------|----------|----------|
| **Free** | $0 | 10,000 | 1時間 | ❌ | ❌ |
| **Basic** | $3.49 | 25,000 | 15分 | ✅ | メール |
| **Fresher** | $6.49 | 50,000 | 5分 | ✅ | メール |
| **Ace** | $14.49 | 150,000 | リアルタイム | ✅ | 優先 |
| **Premium** | $24.49 | 500,000 | リアルタイム | ✅ | 優先 |

### 無料プランの制限
- **10,000リクエスト/日** = 約416リクエスト/時間
- **キャッシュ**: 1時間（同じフィードは1時間キャッシュされる）
- **API Key不要**: 無料版はキーなしで使用可能
- **商用利用不可**: 個人利用のみ

## 🔧 基本的な使い方

### 1. シンプルな使用（無料・キー不要）
```javascript
// 基本的なリクエスト
const rssUrl = 'https://techcrunch.com/feed/';
const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    console.log(data);
    /*
    {
      status: "ok",
      feed: {
        url: "https://techcrunch.com/feed/",
        title: "TechCrunch",
        link: "https://techcrunch.com",
        author: "",
        description: "Startup and Technology News",
        image: "https://techcrunch.com/..."
      },
      items: [
        {
          title: "記事タイトル",
          pubDate: "2025-08-30 12:00:00",
          link: "https://techcrunch.com/...",
          guid: "unique-id",
          author: "Author Name",
          thumbnail: "https://...",
          description: "記事の説明...",
          content: "記事の本文...",
          enclosure: {},
          categories: ["AI", "Startups"]
        }
      ]
    }
    */
  });
```

### 2. パラメータ付きリクエスト
```javascript
// 詳細なパラメータ設定
const params = new URLSearchParams({
  rss_url: 'https://techcrunch.com/feed/',
  api_key: 'your-api-key', // 有料プランの場合
  count: 20,              // 取得する記事数（デフォルト: 10）
  order_by: 'pubDate',    // ソート順（pubDate or title）
  order_dir: 'desc'       // 並び順（asc or desc）
});

const apiUrl = `https://api.rss2json.com/v1/api.json?${params}`;
```

## 📝 レスポンス形式

### 成功時のレスポンス
```json
{
  "status": "ok",
  "feed": {
    "url": "元のRSS URL",
    "title": "フィードタイトル",
    "link": "サイトURL",
    "author": "著者",
    "description": "説明",
    "image": "画像URL"
  },
  "items": [
    {
      "title": "記事タイトル",
      "pubDate": "YYYY-MM-DD HH:mm:ss",
      "link": "記事URL",
      "guid": "一意のID",
      "author": "著者名",
      "thumbnail": "サムネイル画像URL",
      "description": "記事の要約",
      "content": "記事の本文（HTMLを含む）",
      "enclosure": {
        "link": "メディアURL",
        "type": "mime-type"
      },
      "categories": ["カテゴリ1", "カテゴリ2"]
    }
  ]
}
```

### エラー時のレスポンス
```json
{
  "status": "error",
  "message": "エラーメッセージ"
}
```

## 🚀 実装例

### 05_rss-readerでの実装例
```javascript
async function fetchRSSWithRSS2JSON(feedUrl) {
  const API_ENDPOINT = 'https://api.rss2json.com/v1/api.json';
  
  try {
    // RSS2JSONでフェッチ
    const response = await fetch(`${API_ENDPOINT}?rss_url=${encodeURIComponent(feedUrl)}&count=50`);
    const data = await response.json();
    
    if (data.status === 'ok') {
      // 成功
      return {
        success: true,
        feed: data.feed,
        articles: data.items,
        articleCount: data.items.length,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // RSS2JSONのエラー
      throw new Error(data.message || 'RSS2JSON error');
    }
    
  } catch (error) {
    console.error('RSS2JSON fetch failed:', error);
    
    // フォールバック: Cloudflare Worker
    try {
      const fallbackUrl = `https://polished-snow-477a.yutapii.workers.dev/?url=${encodeURIComponent(feedUrl)}`;
      const response = await fetch(fallbackUrl);
      const xmlText = await response.text();
      
      // XMLを手動でパース
      return parseXMLManually(xmlText);
      
    } catch (fallbackError) {
      return {
        success: false,
        error: 'Both RSS2JSON and Cloudflare Worker failed',
        details: error.message
      };
    }
  }
}

// エラーハンドリング付き
async function testFeedWithRSS2JSON(feedUrl) {
  const startTime = performance.now();
  
  try {
    const result = await fetchRSSWithRSS2JSON(feedUrl);
    const endTime = performance.now();
    
    if (result.success) {
      console.log(`✅ 成功: ${result.articleCount}件の記事を取得 (${(endTime - startTime).toFixed(0)}ms)`);
      return result;
    }
    
  } catch (error) {
    console.error(`❌ エラー: ${error.message}`);
    return null;
  }
}
```

## 🎯 メリット・デメリット

### メリット
✅ **CORS完全対応** - どのドメインからでもアクセス可能
✅ **JSON形式** - パース不要で扱いやすい
✅ **キャッシュ機能** - サーバー側でキャッシュ
✅ **安定性** - 長年運営されている信頼性
✅ **簡単** - API Keyなしですぐ使える
✅ **画像取得** - サムネイル画像も自動抽出

### デメリット
❌ **レート制限** - 無料版は10,000/日まで
❌ **キャッシュ遅延** - 無料版は1時間キャッシュ
❌ **商用利用制限** - 無料版は個人利用のみ
❌ **外部依存** - サービス停止リスク

## 📊 現在のエラーフィードでの成功率予測

| カテゴリ | 予測成功率 | 理由 |
|----------|-----------|------|
| テクノロジー系 | 90%+ | 一般的なRSS形式 |
| AI研究機関 | 85%+ | 標準的なフィード |
| 中国AI企業 | 30% | 地域制限/ブロック |
| G7官公庁 | 40% | IP制限/認証必要 |
| EU機関 | 50% | GDPR関連の制限 |

## 💡 推奨実装戦略

### 1. 優先順位付きプロキシチェーン
```javascript
const proxyChain = [
  {
    name: 'RSS2JSON',
    url: 'https://api.rss2json.com/v1/api.json?rss_url=',
    parser: 'json',
    priority: 1
  },
  {
    name: 'Cloudflare Worker',
    url: 'https://polished-snow-477a.yutapii.workers.dev/?url=',
    parser: 'xml',
    priority: 2
  },
  {
    name: 'AllOrigins',
    url: 'https://api.allorigins.win/raw?url=',
    parser: 'xml',
    priority: 3
  }
];
```

### 2. フィード別最適プロキシ記録
```javascript
// LocalStorageに成功したプロキシを記録
const feedProxyMap = {
  'techcrunch.com': 'RSS2JSON',
  'gigazine.net': 'RSS2JSON',
  'gov.uk': 'Cloudflare Worker',
  // ...
};

localStorage.setItem('feed-proxy-map', JSON.stringify(feedProxyMap));
```

### 3. 使用量モニタリング
```javascript
// 日別使用量を記録
function trackRSS2JSONUsage() {
  const today = new Date().toISOString().split('T')[0];
  const usage = JSON.parse(localStorage.getItem('rss2json-usage') || '{}');
  
  if (!usage[today]) {
    usage[today] = 0;
  }
  
  usage[today]++;
  
  // 無料枠の警告
  if (usage[today] > 9000) {
    console.warn('⚠️ RSS2JSON: 無料枠の90%を使用しました');
  }
  
  localStorage.setItem('rss2json-usage', JSON.stringify(usage));
}
```

## 🔧 設定推奨

### 無料プランでの最適化
1. **キャッシュ活用** - 1時間以内の再取得を避ける
2. **バッチ処理** - 複数フィードを一度に処理
3. **エラーフィード除外** - 失敗が確定したフィードは除外
4. **時間帯分散** - ピーク時を避けて分散実行

### 91フィード運用での試算
- **1日3回更新**: 91 × 3 = 273リクエスト/日 ✅
- **1日10回更新**: 91 × 10 = 910リクエスト/日 ✅
- **1時間ごと更新**: 91 × 24 = 2,184リクエスト/日 ✅
- **15分ごと更新**: 91 × 96 = 8,736リクエスト/日 ✅

**結論**: 無料プランでも15分ごとの更新が可能

## 📝 実装チェックリスト

- [ ] RSS2JSONを第一選択に変更
- [ ] エラーハンドリング実装
- [ ] フォールバック処理追加
- [ ] 使用量モニタリング実装
- [ ] キャッシュ機能実装
- [ ] 成功プロキシの記録機能
- [ ] レート制限の警告表示

---

*最終更新: 2025-08-30*
*RSS2JSON API ガイド - Smart Content Factory V5*