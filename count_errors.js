// ブラウザのコンソールで実行してください
// 05_rss-readerページを開いた状態で実行

(function() {
    const feeds = JSON.parse(localStorage.getItem('rss-feeds') || '[]');
    
    const errorStats = {
        totalFeeds: feeds.length,
        errorTypeCount: 0,
        statusErrorCount: 0,
        statusErrorWithIcon: 0,
        totalErrors: 0,
        activeErrors: 0,
        inactiveErrors: 0
    };
    
    const errorDetails = [];
    const uniqueErrors = new Set();
    
    feeds.forEach(feed => {
        let hasError = false;
        
        // errorTypeがある場合
        if (feed.errorType && feed.errorType !== '') {
            errorStats.errorTypeCount++;
            hasError = true;
        }
        
        // statusが「エラー」の場合
        if (feed.status === 'エラー') {
            errorStats.statusErrorCount++;
            hasError = true;
        }
        
        // statusが「❌ エラー」の場合
        if (feed.status === '❌ エラー') {
            errorStats.statusErrorWithIcon++;
            hasError = true;
        }
        
        // エラーがある場合は詳細を記録
        if (hasError && !uniqueErrors.has(feed.url)) {
            uniqueErrors.add(feed.url);
            errorStats.totalErrors++;
            
            if (feed.active !== false) {
                errorStats.activeErrors++;
            } else {
                errorStats.inactiveErrors++;
            }
            
            errorDetails.push({
                name: feed.name,
                url: feed.url,
                errorType: feed.errorType || 'なし',
                status: feed.status,
                active: feed.active !== false ? 'アクティブ' : '非アクティブ'
            });
        }
    });
    
    // 結果を表示
    console.log('%c=== RSS フィード エラー統計 ===', 'color: #ff6b6b; font-size: 16px; font-weight: bold');
    console.log(`%c総フィード数: ${errorStats.totalFeeds}`, 'color: #333; font-size: 14px');
    console.log('');
    
    console.log('%c📊 エラー種別の内訳', 'color: #4caf50; font-size: 14px; font-weight: bold');
    console.log(`  errorTypeフィールドあり: ${errorStats.errorTypeCount}件`);
    console.log(`  status="エラー": ${errorStats.statusErrorCount}件`);
    console.log(`  status="❌ エラー": ${errorStats.statusErrorWithIcon}件`);
    console.log('');
    
    console.log('%c🔴 エラー合計', 'color: #f44336; font-size: 14px; font-weight: bold');
    console.log(`  重複を除いたエラーフィード数: ${errorStats.totalErrors}件`);
    console.log(`    - アクティブなエラー: ${errorStats.activeErrors}件`);
    console.log(`    - 非アクティブなエラー: ${errorStats.inactiveErrors}件`);
    console.log('');
    
    console.log('%c✅ 正常フィード数: ' + (errorStats.totalFeeds - errorStats.totalErrors) + '件', 
                'color: #4caf50; font-size: 14px; font-weight: bold');
    console.log('');
    
    if (errorDetails.length > 0) {
        console.log('%c=== エラーフィード詳細 ===', 'color: #ff6b6b; font-size: 14px; font-weight: bold');
        console.table(errorDetails);
        
        // カテゴリ別エラー集計
        const errorsByCategory = {};
        feeds.forEach(feed => {
            if ((feed.errorType && feed.errorType !== '') || 
                feed.status === 'エラー' || 
                feed.status === '❌ エラー') {
                const category = feed.category || '未分類';
                errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
            }
        });
        
        console.log('%c=== カテゴリ別エラー数 ===', 'color: #ff9800; font-size: 14px; font-weight: bold');
        console.table(errorsByCategory);
    }
    
    // サマリー
    console.log('%c' + '='.repeat(50), 'color: #666');
    console.log('%c📈 サマリー', 'color: #2196f3; font-size: 16px; font-weight: bold');
    console.log(`%cエラー率: ${((errorStats.totalErrors / errorStats.totalFeeds) * 100).toFixed(1)}%`, 
                'color: #ff6b6b; font-size: 14px; font-weight: bold');
    console.log(`%c正常率: ${(((errorStats.totalFeeds - errorStats.totalErrors) / errorStats.totalFeeds) * 100).toFixed(1)}%`, 
                'color: #4caf50; font-size: 14px; font-weight: bold');
    
    return {
        stats: errorStats,
        details: errorDetails,
        errorRate: ((errorStats.totalErrors / errorStats.totalFeeds) * 100).toFixed(1) + '%'
    };
})();