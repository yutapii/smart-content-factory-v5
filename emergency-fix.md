# 🚨 緊急修正手順書

## 即座に実行すべき修正

### 📍 修正ファイル
`/05_rss-reader/index.html`

### 🔧 修正箇所
**行番号: 1338-1377** の `testFeed` 関数を以下に置き換え：

```javascript
async function testFeed(url, feedId = null) {
    // 🔥 緊急修正: API Keyを直接埋め込み
    const RSS2JSON_API_KEY = 'YOUR_API_KEY_HERE'; // APIキーを設定してください
    
    console.log(`\n🔍 RSS取得開始: ${url}`);
    await Logger.info(`Testing feed: ${url}`, { context: 'testFeed', feedId });
    
    // 🎯 RSS2JSONを最優先で実行
    try {
        const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&api_key=${RSS2JSON_API_KEY}&count=10`;
        
        console.log('🌐 RSS2JSON API 呼び出し中...');
        const response = await fetch(rss2jsonUrl, {
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'ok' && data.items && data.items.length > 0) {
                console.log(`✅ RSS2JSON成功: ${data.items.length}件取得`);
                
                // フィード情報を更新
                if (feedId) {
                    const feeds = JSON.parse(localStorage.getItem('rss-feeds') || '[]');
                    const feed = feeds.find(f => f.id === feedId);
                    if (feed) {
                        feed.status = '✅ OK';
                        feed.lastChecked = new Date().toISOString();
                        feed.errorType = null;
                        feed.articleCount = data.items.length;
                        feed.message = `✅ ${data.items.length}件の記事を取得（RSS2JSON）`;
                        localStorage.setItem('rss-feeds', JSON.stringify(feeds));
                    }
                }
                
                return {
                    success: true,
                    message: `✅ ${data.items.length}件の記事を取得（RSS2JSON）`,
                    errorCode: null,
                    itemCount: data.items.length,
                    source: 'RSS2JSON'
                };
            }
        }
        
        throw new Error(`RSS2JSON API response error: ${response.status}`);
        
    } catch (error) {
        console.log(`❌ RSS2JSON失敗: ${error.message}`);
        // ここから既存のCloudflare Worker処理を続ける
    }
    
    // === 以下、既存のコードを続ける ===
    // 既知の問題があるドメインを特別処理
    const problematicDomains = [
        'bmbf.de', 'bsi.bund.de', 'economie.gouv.fr', 
        'ssi.gouv.fr', 'inria.fr', 'enisa.europa.eu',
        'digital.canada.ca', 'nrc.canada.ca'
    ];
    
    // 以下、既存のコード...
}
```

## 📋 修正後の確認手順

1. **ブラウザをリロード** (Cmd+Shift+R)
2. **F12でコンソールを開く**
3. **「自動テスト」を実行**
4. **コンソールログを確認**
   - 「🌐 RSS2JSON API 呼び出し中...」
   - 「✅ RSS2JSON成功: X件取得」

## 🎯 期待される結果

| 指標 | 修正前 | 修正後（予測） |
|------|--------|--------------|
| 成功フィード | 26件 | **50-60件** |
| エラー率 | 71.4% | **30-40%** |
| 総記事数 | 245件 | **1000件以上** |
| RSS2JSON使用 | 0件 | **40-50件** |

## ⚠️ 注意事項

- この修正はAPI Keyをハードコードしています
- 緊急対応として効果確認後、適切な実装に移行予定
- GitHubにコミットしないよう注意（API Key露出防止）

---

**即座に実行して効果を確認してください！**