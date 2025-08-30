// エラーフィードの統計を表示するスクリプト
// ブラウザのコンソールで実行してください

function checkErrorFeeds() {
    const feeds = JSON.parse(localStorage.getItem('rss-feeds') || '[]');
    
    // エラーの種類別にカウント
    const errorStats = {
        totalFeeds: feeds.length,
        errorTypeCount: 0,
        statusErrorCount: 0,
        statusErrorWithIcon: 0,
        activeFeeds: 0,
        inactiveFeeds: 0
    };
    
    const errorDetails = [];
    
    feeds.forEach(feed => {
        // errorTypeがある場合
        if (feed.errorType && feed.errorType !== '') {
            errorStats.errorTypeCount++;
            errorDetails.push({
                name: feed.name,
                url: feed.url,
                errorType: feed.errorType,
                status: feed.status,
                active: feed.active
            });
        }
        
        // statusが「エラー」の場合
        if (feed.status === 'エラー') {
            errorStats.statusErrorCount++;
            if (!errorDetails.find(e => e.url === feed.url)) {
                errorDetails.push({
                    name: feed.name,
                    url: feed.url,
                    errorType: feed.errorType || 'なし',
                    status: feed.status,
                    active: feed.active
                });
            }
        }
        
        // statusが「❌ エラー」の場合
        if (feed.status === '❌ エラー') {
            errorStats.statusErrorWithIcon++;
            if (!errorDetails.find(e => e.url === feed.url)) {
                errorDetails.push({
                    name: feed.name,
                    url: feed.url,
                    errorType: feed.errorType || 'なし',
                    status: feed.status,
                    active: feed.active
                });
            }
        }
        
        // アクティブ/非アクティブのカウント
        if (feed.active !== false) {
            errorStats.activeFeeds++;
        } else {
            errorStats.inactiveFeeds++;
        }
    });
    
    // 結果を表示
    console.log('=== RSS フィード エラー統計 ===');
    console.log(`総フィード数: ${errorStats.totalFeeds}`);
    console.log(`アクティブ: ${errorStats.activeFeeds}`);
    console.log(`非アクティブ: ${errorStats.inactiveFeeds}`);
    console.log('');
    console.log('=== エラーフィード ===');
    console.log(`errorTypeあり: ${errorStats.errorTypeCount}`);
    console.log(`status="エラー": ${errorStats.statusErrorCount}`);
    console.log(`status="❌ エラー": ${errorStats.statusErrorWithIcon}`);
    console.log(`合計エラーフィード数: ${errorDetails.length}`);
    console.log('');
    
    if (errorDetails.length > 0) {
        console.log('=== エラーフィード詳細 ===');
        console.table(errorDetails);
    }
    
    return {
        stats: errorStats,
        details: errorDetails
    };
}

// 実行
checkErrorFeeds();