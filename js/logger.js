/**
 * Logger - ログ記録・管理システム
 * SCF V5 ロギングモジュール
 */

class Logger {
    static logs = [];
    static maxMemoryLogs = 1000;
    static maxPersistentLogs = 10000;
    static db = null;
    static initialized = false;
    static logLevel = 'info'; // debug, info, warn, error
    
    /**
     * ロガーの初期化
     */
    static async init() {
        if (this.initialized) return;
        
        try {
            // IndexedDB初期化
            await this.initDB();
            
            // 既存ログの読み込み
            await this.loadRecentLogs();
            
            // ログレベル設定の読み込み
            this.logLevel = localStorage.getItem('scf_v5_log_level') || 'info';
            
            this.initialized = true;
            this.info('Logger initialized');
        } catch (error) {
            console.error('Logger initialization failed:', error);
        }
    }
    
    /**
     * IndexedDB初期化
     */
    static async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SCFV5_Logs', 1);
            
            request.onerror = () => {
                console.error('Failed to open log database');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('logs')) {
                    const store = db.createObjectStore('logs', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('level', 'level', { unique: false });
                    store.createIndex('context', 'context', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }
    
    /**
     * ログエントリの作成
     */
    static createEntry(level, message, data = {}) {
        return {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            ...data,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
    }
    
    /**
     * ログの記録
     */
    static async log(level, message, data = {}) {
        // ログレベルチェック
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        
        if (messageLevelIndex < currentLevelIndex) {
            return; // ログレベルが低い場合はスキップ
        }
        
        const entry = this.createEntry(level, message, data);
        
        // メモリに保存
        this.logs.push(entry);
        if (this.logs.length > this.maxMemoryLogs) {
            this.logs.shift();
        }
        
        // コンソール出力
        this.outputToConsole(level, message, data);
        
        // IndexedDBに永続化
        await this.persist(entry);
        
        // 重要なエラーの場合、追加処理
        if (level === 'error' && data.critical) {
            await this.handleCriticalError(entry);
        }
        
        return entry;
    }
    
    /**
     * 各レベルのログメソッド
     */
    static async debug(message, data = {}) {
        return this.log('debug', message, data);
    }
    
    static async info(message, data = {}) {
        return this.log('info', message, data);
    }
    
    static async warn(message, data = {}) {
        return this.log('warn', message, data);
    }
    
    static async error(message, data = {}) {
        return this.log('error', message, data);
    }
    
    /**
     * コンソール出力
     */
    static outputToConsole(level, message, data) {
        const styles = {
            debug: 'color: #888',
            info: 'color: #2196F3',
            warn: 'color: #FF9800',
            error: 'color: #F44336'
        };
        
        const prefix = `[${new Date().toLocaleTimeString()}] [${level.toUpperCase()}]`;
        
        if (Object.keys(data).length > 0) {
            console.groupCollapsed(`%c${prefix} ${message}`, styles[level]);
            console.log(data);
            console.groupEnd();
        } else {
            console.log(`%c${prefix} ${message}`, styles[level]);
        }
    }
    
    /**
     * IndexedDBへの永続化
     */
    static async persist(entry) {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['logs'], 'readwrite');
            const store = transaction.objectStore('logs');
            
            await new Promise((resolve, reject) => {
                const request = store.add(entry);
                request.onsuccess = resolve;
                request.onerror = reject;
            });
            
            // 古いログの削除
            await this.cleanOldLogs();
        } catch (error) {
            console.error('Failed to persist log:', error);
        }
    }
    
    /**
     * 古いログの削除
     */
    static async cleanOldLogs() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['logs'], 'readwrite');
            const store = transaction.objectStore('logs');
            
            const countRequest = store.count();
            countRequest.onsuccess = async () => {
                const count = countRequest.result;
                
                if (count > this.maxPersistentLogs) {
                    const deleteCount = count - this.maxPersistentLogs;
                    const getAllRequest = store.getAll();
                    
                    getAllRequest.onsuccess = () => {
                        const logs = getAllRequest.result;
                        // 古い順にソート
                        logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                        
                        // 古いログを削除
                        for (let i = 0; i < deleteCount; i++) {
                            store.delete(logs[i].id);
                        }
                    };
                }
            };
        } catch (error) {
            console.error('Failed to clean old logs:', error);
        }
    }
    
    /**
     * 最近のログを読み込み
     */
    static async loadRecentLogs() {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['logs'], 'readonly');
            const store = transaction.objectStore('logs');
            const index = store.index('timestamp');
            
            const logs = await new Promise((resolve, reject) => {
                const request = index.openCursor(null, 'prev');
                const results = [];
                let count = 0;
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && count < this.maxMemoryLogs) {
                        results.push(cursor.value);
                        count++;
                        cursor.continue();
                    } else {
                        resolve(results.reverse());
                    }
                };
                
                request.onerror = reject;
            });
            
            this.logs = logs;
        } catch (error) {
            console.error('Failed to load recent logs:', error);
        }
    }
    
    /**
     * ログの検索
     */
    static async search(criteria = {}) {
        if (!this.db) return [];
        
        try {
            const transaction = this.db.transaction(['logs'], 'readonly');
            const store = transaction.objectStore('logs');
            
            let request;
            if (criteria.level) {
                request = store.index('level').getAll(criteria.level);
            } else if (criteria.context) {
                request = store.index('context').getAll(criteria.context);
            } else if (criteria.type) {
                request = store.index('type').getAll(criteria.type);
            } else {
                request = store.getAll();
            }
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    let results = request.result;
                    
                    // 追加フィルタリング
                    if (criteria.startDate) {
                        results = results.filter(log => 
                            new Date(log.timestamp) >= new Date(criteria.startDate)
                        );
                    }
                    
                    if (criteria.endDate) {
                        results = results.filter(log => 
                            new Date(log.timestamp) <= new Date(criteria.endDate)
                        );
                    }
                    
                    if (criteria.message) {
                        results = results.filter(log => 
                            log.message.toLowerCase().includes(criteria.message.toLowerCase())
                        );
                    }
                    
                    resolve(results);
                };
                
                request.onerror = reject;
            });
        } catch (error) {
            console.error('Log search failed:', error);
            return [];
        }
    }
    
    /**
     * ログの取得
     */
    static getRecentLogs(count = 100) {
        return this.logs.slice(-count);
    }
    
    static getLogsByLevel(level, count = 100) {
        return this.logs
            .filter(log => log.level === level)
            .slice(-count);
    }
    
    /**
     * ログの集計
     */
    static getStatistics() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byHour: {},
            topErrors: [],
            recentActivity: []
        };
        
        // レベル別集計
        this.logs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            
            // 時間別集計
            const hour = new Date(log.timestamp).getHours();
            stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        });
        
        // エラーの頻度
        const errorCounts = {};
        this.logs
            .filter(log => log.level === 'error')
            .forEach(log => {
                const key = log.type || log.message;
                errorCounts[key] = (errorCounts[key] || 0) + 1;
            });
        
        stats.topErrors = Object.entries(errorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([message, count]) => ({ message, count }));
        
        // 最近のアクティビティ
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        stats.recentActivity = this.logs.filter(log => 
            new Date(log.timestamp) > fiveMinutesAgo
        ).length;
        
        return stats;
    }
    
    /**
     * ログのエクスポート
     */
    static async export(format = 'json') {
        const logs = await this.search({});
        
        if (format === 'json') {
            return JSON.stringify(logs, null, 2);
        } else if (format === 'csv') {
            const headers = ['timestamp', 'level', 'message', 'context', 'type', 'url'];
            const rows = logs.map(log => 
                headers.map(h => `"${(log[h] || '').toString().replace(/"/g, '""')}"`).join(',')
            );
            return [headers.join(','), ...rows].join('\n');
        } else if (format === 'txt') {
            return logs.map(log => 
                `[${log.timestamp}] [${log.level}] ${log.message} ${log.context ? `(${log.context})` : ''}`
            ).join('\n');
        }
        
        return logs;
    }
    
    /**
     * ログのクリア
     */
    static async clear() {
        this.logs = [];
        
        if (this.db) {
            try {
                const transaction = this.db.transaction(['logs'], 'readwrite');
                const store = transaction.objectStore('logs');
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = resolve;
                    request.onerror = reject;
                });
            } catch (error) {
                console.error('Failed to clear logs:', error);
            }
        }
    }
    
    /**
     * 重要エラーの処理
     */
    static async handleCriticalError(entry) {
        // ローカルストレージに重要エラーを保存
        try {
            const criticalErrors = JSON.parse(
                localStorage.getItem('scf_v5_critical_errors') || '[]'
            );
            
            criticalErrors.push({
                timestamp: entry.timestamp,
                message: entry.message,
                context: entry.context,
                stack: entry.stack
            });
            
            // 最新10件のみ保持
            if (criticalErrors.length > 10) {
                criticalErrors.shift();
            }
            
            localStorage.setItem('scf_v5_critical_errors', JSON.stringify(criticalErrors));
            
            // 開発環境では通知
            if (this.logLevel === 'debug') {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Critical Error', {
                        body: entry.message,
                        icon: '❌'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to handle critical error:', error);
        }
    }
    
    /**
     * ログレベルの設定
     */
    static setLogLevel(level) {
        const validLevels = ['debug', 'info', 'warn', 'error'];
        if (validLevels.includes(level)) {
            this.logLevel = level;
            localStorage.setItem('scf_v5_log_level', level);
            this.info(`Log level changed to: ${level}`);
        }
    }
}

// 初期化
if (typeof window !== 'undefined') {
    Logger.init().catch(console.error);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
} else {
    window.Logger = Logger;
}