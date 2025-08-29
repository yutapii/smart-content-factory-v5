/**
 * 統一トースト通知システム
 * エラー、成功、警告メッセージを統一的に表示
 */

const Toast = {
    // トーストコンテナ
    container: null,
    
    // 初期化
    init() {
        // コンテナ作成
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(this.container);
        
        // スタイル追加
        this.addStyles();
        
        // グローバルエラーハンドラー設定
        this.setupErrorHandler();
    },
    
    // エラー表示
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    },
    
    // 成功表示
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    
    // 警告表示
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    },
    
    // 情報表示
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    },
    
    // トースト表示
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // アイコン設定
        const icons = {
            error: '❌',
            success: '✅',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        // HTML構築
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // アニメーション付きで追加
        toast.style.animation = 'slideIn 0.3s ease';
        this.container.appendChild(toast);
        
        // 自動削除
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        // コンソールにも出力
        console.log(`[${type.toUpperCase()}] ${message}`);
    },
    
    // HTML エスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // グローバルエラーハンドラー
    setupErrorHandler() {
        // 既存のfetch をラップ
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    // OCRサーバー（5001）のエラーは無視
                    const url = args[0];
                    if (typeof url === 'string' && url.includes(':5001')) {
                        console.log('OCRサーバー未起動（任意機能）');
                        return response;
                    }
                    this.error(`通信エラー: ${response.status} ${response.statusText}`);
                }
                return response;
            } catch (error) {
                // OCRサーバー（5001）のエラーは無視
                const url = args[0];
                if (typeof url === 'string' && url.includes(':5001')) {
                    console.log('OCRサーバー未起動（任意機能）');
                    throw error;
                }
                this.error(`ネットワークエラー: ${error.message}`);
                throw error;
            }
        };
        
        // エラーイベント捕獲
        window.addEventListener('error', (event) => {
            this.error(`エラー: ${event.message}`);
        });
        
        // Promise rejection捕獲
        window.addEventListener('unhandledrejection', (event) => {
            this.error(`処理エラー: ${event.reason}`);
        });
    },
    
    // スタイル追加
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .toast {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 20px;
                border-radius: 8px;
                background: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 300px;
                max-width: 500px;
                word-wrap: break-word;
                font-family: system-ui, -apple-system, sans-serif;
            }
            
            .toast-error {
                background: #ffebee;
                border-left: 4px solid #f44336;
            }
            
            .toast-success {
                background: #e8f5e9;
                border-left: 4px solid #4caf50;
            }
            
            .toast-warning {
                background: #fff3e0;
                border-left: 4px solid #ff9800;
            }
            
            .toast-info {
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
            }
            
            .toast-icon {
                font-size: 20px;
            }
            
            .toast-message {
                flex: 1;
                color: #333;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .toast-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .toast-close:hover {
                color: #333;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// 自動初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Toast.init());
} else {
    Toast.init();
}

// グローバル公開（簡易アクセス用）
window.Toast = Toast;
window.showError = (msg) => Toast.error(msg);
window.showSuccess = (msg) => Toast.success(msg);
window.showWarning = (msg) => Toast.warning(msg);
window.showInfo = (msg) => Toast.info(msg);