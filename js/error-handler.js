/**
 * Error Handler - 統一エラーハンドリングシステム
 * SCF V5 エラー管理モジュール
 */

class ErrorHandler {
    static initialized = false;
    static retryQueue = new Map();
    static maxRetries = 3;
    
    /**
     * エラーハンドラーの初期化
     */
    static init() {
        if (this.initialized) return;
        
        // グローバルエラーハンドラー
        window.addEventListener('error', (event) => {
            this.handle(event.error, 'global-error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Promise rejection ハンドラー
        window.addEventListener('unhandledrejection', (event) => {
            this.handle(event.reason, 'promise-rejection', {
                promise: event.promise
            });
            event.preventDefault();
        });
        
        this.initialized = true;
        Logger.info('ErrorHandler initialized');
    }
    
    /**
     * エラーを処理
     */
    static async handle(error, context = '', metadata = {}) {
        // エラー分類
        const errorInfo = this.classify(error);
        
        // ログ記録
        await Logger.error({
            type: errorInfo.type,
            severity: errorInfo.severity,
            message: error?.message || String(error),
            stack: error?.stack,
            context: context,
            metadata: metadata,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        
        // ユーザー通知
        this.notifyUser(errorInfo, error);
        
        // 回復試行
        const recovery = await this.attemptRecovery(errorInfo, context, metadata);
        
        // 統計更新
        ErrorStats.record(errorInfo.type, context);
        
        return recovery;
    }
    
    /**
     * エラーを分類
     */
    static classify(error) {
        const errorStr = String(error?.message || error);
        
        // ネットワークエラー
        if (errorStr.includes('Failed to fetch') || 
            errorStr.includes('NetworkError') ||
            errorStr.includes('ERR_NETWORK') ||
            errorStr.includes('ERR_INTERNET_DISCONNECTED')) {
            return { type: 'network', severity: 'medium', recoverable: true };
        }
        
        // CORS エラー
        if (errorStr.includes('CORS') || 
            errorStr.includes('Cross-Origin') ||
            errorStr.includes('blocked by CORS policy')) {
            return { type: 'cors', severity: 'high', recoverable: true };
        }
        
        // RSS/フィード関連エラー
        if (errorStr.includes('RSS') || 
            errorStr.includes('feed') ||
            errorStr.includes('XML') ||
            errorStr.includes('有効なRSSフィード')) {
            return { type: 'feed', severity: 'low', recoverable: false };
        }
        
        // IndexedDB/ストレージエラー
        if (errorStr.includes('QuotaExceededError') ||
            errorStr.includes('IndexedDB') ||
            errorStr.includes('storage')) {
            return { type: 'storage', severity: 'high', recoverable: true };
        }
        
        // 認証エラー
        if (errorStr.includes('401') || 
            errorStr.includes('403') ||
            errorStr.includes('Unauthorized') ||
            errorStr.includes('Forbidden')) {
            return { type: 'auth', severity: 'high', recoverable: false };
        }
        
        // タイムアウト
        if (errorStr.includes('timeout') || 
            errorStr.includes('Timeout') ||
            errorStr.includes('AbortError')) {
            return { type: 'timeout', severity: 'medium', recoverable: true };
        }
        
        // その他
        return { type: 'unknown', severity: 'low', recoverable: false };
    }
    
    /**
     * ユーザーへの通知
     */
    static notifyUser(errorInfo, error) {
        const messages = {
            network: 'ネットワーク接続を確認してください',
            cors: 'アクセス制限により取得できません',
            feed: 'フィードの形式が正しくありません',
            storage: 'ストレージ容量が不足しています',
            auth: '認証が必要です',
            timeout: '接続がタイムアウトしました',
            unknown: 'エラーが発生しました'
        };
        
        const message = messages[errorInfo.type] || messages.unknown;
        const details = error?.message || '';
        
        // showToast関数が利用可能な場合
        if (typeof showToast === 'function') {
            const toastType = errorInfo.severity === 'high' ? 'error' : 
                             errorInfo.severity === 'medium' ? 'warning' : 'info';
            showToast(`${message}${details ? ': ' + details : ''}`, toastType);
        } else {
            console.error(`[${errorInfo.type}] ${message}:`, details);
        }
    }
    
    /**
     * エラー回復を試行
     */
    static async attemptRecovery(errorInfo, context, metadata) {
        if (!errorInfo.recoverable) {
            return { success: false, retry: false };
        }
        
        const strategies = {
            network: async () => await this.recoverNetwork(context, metadata),
            cors: async () => await this.recoverCORS(context, metadata),
            storage: async () => await this.recoverStorage(context, metadata),
            timeout: async () => await this.recoverTimeout(context, metadata)
        };
        
        const strategy = strategies[errorInfo.type];
        if (strategy) {
            return await strategy();
        }
        
        return { success: false, retry: false };
    }
    
    /**
     * ネットワークエラーの回復
     */
    static async recoverNetwork(context, metadata) {
        const retryKey = `${context}-${JSON.stringify(metadata)}`;
        const retryCount = this.retryQueue.get(retryKey) || 0;
        
        if (retryCount >= this.maxRetries) {
            this.retryQueue.delete(retryKey);
            return { success: false, retry: false, exhausted: true };
        }
        
        // オンライン状態を確認
        if (!navigator.onLine) {
            // オンラインになるまで待機
            await new Promise(resolve => {
                const handler = () => {
                    window.removeEventListener('online', handler);
                    resolve();
                };
                window.addEventListener('online', handler);
                
                // タイムアウト設定（30秒）
                setTimeout(() => {
                    window.removeEventListener('online', handler);
                    resolve();
                }, 30000);
            });
        }
        
        // 指数バックオフで再試行
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        this.retryQueue.set(retryKey, retryCount + 1);
        
        return { 
            success: false, 
            retry: true, 
            delay: delay,
            attempt: retryCount + 1
        };
    }
    
    /**
     * CORSエラーの回復
     */
    static async recoverCORS(context, metadata) {
        // プロキシサービスを使用
        const proxies = [
            'https://polished-snow-477a.yutapii.workers.dev',
            'https://api.allorigins.win/raw',
            'https://cors-anywhere.herokuapp.com'
        ];
        
        const currentProxyIndex = metadata.proxyIndex || 0;
        if (currentProxyIndex < proxies.length) {
            return {
                success: false,
                retry: true,
                useProxy: proxies[currentProxyIndex],
                proxyIndex: currentProxyIndex + 1
            };
        }
        
        return { success: false, retry: false };
    }
    
    /**
     * ストレージエラーの回復
     */
    static async recoverStorage(context, metadata) {
        try {
            // 古いデータを削除
            const cleared = await this.clearOldData();
            
            if (cleared) {
                return { success: true, retry: true };
            }
            
            // ストレージ使用量を確認
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usage = (estimate.usage / estimate.quota) * 100;
                
                if (usage > 90) {
                    // 使用量が90%を超えている場合、より積極的にクリア
                    await this.aggressiveClear();
                    return { success: true, retry: true };
                }
            }
        } catch (error) {
            Logger.error({
                message: 'Storage recovery failed',
                error: error.message
            });
        }
        
        return { success: false, retry: false };
    }
    
    /**
     * タイムアウトエラーの回復
     */
    static async recoverTimeout(context, metadata) {
        // タイムアウト時間を延長して再試行
        const currentTimeout = metadata.timeout || 5000;
        const newTimeout = Math.min(currentTimeout * 2, 60000); // 最大60秒
        
        return {
            success: false,
            retry: true,
            timeout: newTimeout
        };
    }
    
    /**
     * 古いデータをクリア
     */
    static async clearOldData() {
        try {
            if (typeof db !== 'undefined' && db) {
                const transaction = db.transaction(['articles'], 'readwrite');
                const store = transaction.objectStore('articles');
                
                // 60日以上前の記事を削除
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - 60);
                
                const index = store.index('pubDate');
                const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
                const request = index.openCursor(range);
                
                return new Promise((resolve) => {
                    let deleted = 0;
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            cursor.delete();
                            deleted++;
                            cursor.continue();
                        } else {
                            Logger.info(`Cleared ${deleted} old articles`);
                            resolve(deleted > 0);
                        }
                    };
                });
            }
        } catch (error) {
            Logger.error({
                message: 'Failed to clear old data',
                error: error.message
            });
        }
        return false;
    }
    
    /**
     * 積極的なデータクリア
     */
    static async aggressiveClear() {
        try {
            // localStorage の不要データを削除
            const keysToKeep = ['scf_v5_config', 'rss-feeds'];
            Object.keys(localStorage).forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            
            // sessionStorage をクリア
            sessionStorage.clear();
            
            // キャッシュをクリア
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            Logger.info('Aggressive clear completed');
            return true;
        } catch (error) {
            Logger.error({
                message: 'Aggressive clear failed',
                error: error.message
            });
            return false;
        }
    }
}

/**
 * エラー統計
 */
class ErrorStats {
    static stats = new Map();
    
    static record(type, context) {
        const key = `${type}:${context}`;
        const current = this.stats.get(key) || { count: 0, lastOccurred: null };
        
        this.stats.set(key, {
            count: current.count + 1,
            lastOccurred: new Date(),
            firstOccurred: current.firstOccurred || new Date()
        });
        
        // 統計を定期的に保存
        this.save();
    }
    
    static getTopErrors(limit = 10) {
        return Array.from(this.stats.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([key, value]) => {
                const [type, context] = key.split(':');
                return { type, context, ...value };
            });
    }
    
    static save() {
        try {
            const data = Array.from(this.stats.entries()).map(([key, value]) => ({
                key,
                ...value,
                lastOccurred: value.lastOccurred?.toISOString(),
                firstOccurred: value.firstOccurred?.toISOString()
            }));
            
            localStorage.setItem('scf_v5_error_stats', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save error stats:', error);
        }
    }
    
    static load() {
        try {
            const data = localStorage.getItem('scf_v5_error_stats');
            if (data) {
                const parsed = JSON.parse(data);
                this.stats = new Map(parsed.map(item => [
                    item.key,
                    {
                        count: item.count,
                        lastOccurred: item.lastOccurred ? new Date(item.lastOccurred) : null,
                        firstOccurred: item.firstOccurred ? new Date(item.firstOccurred) : null
                    }
                ]));
            }
        } catch (error) {
            console.error('Failed to load error stats:', error);
        }
    }
}

// 初期化
if (typeof window !== 'undefined') {
    ErrorHandler.init();
    ErrorStats.load();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, ErrorStats };
} else {
    window.ErrorHandler = ErrorHandler;
    window.ErrorStats = ErrorStats;
}