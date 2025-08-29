/**
 * 共通ユーティリティ関数
 * 重複コードを統一化
 */

const Common = {
    // LocalStorage操作
    Storage: {
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                showError(`保存エラー: ${e.message}`);
                return false;
            }
        },
        
        load(key, defaultValue = null) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (e) {
                showError(`読み込みエラー: ${e.message}`);
                return defaultValue;
            }
        },
        
        remove(key) {
            localStorage.removeItem(key);
        },
        
        clear() {
            if (confirm('全データを削除しますか？')) {
                localStorage.clear();
                showSuccess('データを削除しました');
            }
        }
    },
    
    // Fetch処理
    Fetch: {
        async get(url, options = {}) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    ...options
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                showError(`通信エラー: ${error.message}`);
                throw error;
            }
        },
        
        async post(url, data, options = {}) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    body: JSON.stringify(data),
                    ...options
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                showError(`送信エラー: ${error.message}`);
                throw error;
            }
        },
        
        async withRetry(url, retries = 3, delay = 1000) {
            for (let i = 0; i < retries; i++) {
                try {
                    return await this.get(url);
                } catch (error) {
                    if (i === retries - 1) throw error;
                    showWarning(`リトライ ${i + 1}/${retries}`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
    },
    
    // DOM操作
    DOM: {
        show(selector) {
            const el = typeof selector === 'string' ? 
                      document.querySelector(selector) : selector;
            if (el) el.style.display = 'block';
        },
        
        hide(selector) {
            const el = typeof selector === 'string' ? 
                      document.querySelector(selector) : selector;
            if (el) el.style.display = 'none';
        },
        
        toggle(selector) {
            const el = typeof selector === 'string' ? 
                      document.querySelector(selector) : selector;
            if (el) {
                el.style.display = el.style.display === 'none' ? 'block' : 'none';
            }
        },
        
        loading(show = true) {
            const loader = document.getElementById('loading');
            if (loader) {
                loader.style.display = show ? 'flex' : 'none';
            }
        },
        
        disable(selector, disabled = true) {
            const el = typeof selector === 'string' ? 
                      document.querySelector(selector) : selector;
            if (el) el.disabled = disabled;
        }
    },
    
    // 日付フォーマット
    Format: {
        date(date, format = 'YYYY-MM-DD') {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes);
        },
        
        number(num, decimals = 0) {
            return Number(num).toLocaleString('ja-JP', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        },
        
        fileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
    },
    
    // バリデーション
    Validate: {
        isURL(str) {
            try {
                new URL(str);
                return true;
            } catch {
                return false;
            }
        },
        
        isEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        
        isEmpty(value) {
            return value === null || value === undefined || 
                   value === '' || (Array.isArray(value) && value.length === 0);
        }
    },
    
    // ショートカットキー
    Shortcuts: {
        init() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+S: 保存
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    if (window.AutoSave) {
                        AutoSave.manualSave();
                    }
                }
                
                // Ctrl+Enter: 実行
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    const submitBtn = document.querySelector('.btn-primary, [type="submit"]');
                    if (submitBtn) submitBtn.click();
                }
                
                // Escape: モーダル閉じる
                if (e.key === 'Escape') {
                    const modal = document.querySelector('.modal:not([hidden])');
                    if (modal) Common.DOM.hide(modal);
                }
            });
            
            console.log('ショートカットキー有効: Ctrl+S(保存), Ctrl+Enter(実行), Esc(閉じる)');
        }
    }
};

// 初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Common.Shortcuts.init();
    });
} else {
    Common.Shortcuts.init();
}

// グローバル公開
window.Common = Common;