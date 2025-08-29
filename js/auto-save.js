/**
 * 自動保存機能
 * データ損失を防ぐための自動バックアップシステム
 */

const AutoSave = {
    // 保存間隔（30秒）
    INTERVAL: 30000,
    
    // 保存するデータのキー一覧（APIキーは除外）
    KEYS: [
        'rss-feeds',
        'article-draft',
        'post-data',
        // 'settings', // 設定は個別管理のため除外
        'current-work'
    ],
    
    // APIキー関連は個別管理（自動保存から除外）
    EXCLUDED_KEYS: [
        'openai-api-key',
        'anthropic-api-key',
        'google-api-key',
        'cloudflare-worker-url',
        'settings-api',
        'settings'
    ],
    
    // 初期化
    init() {
        // ページロード時に復元チェック
        this.checkRestore();
        
        // 自動保存開始
        this.startAutoSave();
        
        // ページ離脱時に保存
        window.addEventListener('beforeunload', () => this.saveAll());
        
        console.log('✅ 自動保存機能が有効になりました');
    },
    
    // 自動保存開始
    startAutoSave() {
        setInterval(() => {
            this.saveAll();
            this.showSaveIndicator();
        }, this.INTERVAL);
    },
    
    // 全データ保存
    saveAll() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: {}
        };
        
        // 各キーのデータを収集（除外リストをチェック）
        this.KEYS.forEach(key => {
            // 除外キーはスキップ
            if (this.EXCLUDED_KEYS.includes(key)) {
                return;
            }
            const value = localStorage.getItem(key);
            if (value) {
                backup.data[key] = value;
            }
        });
        
        // フォーム入力値も保存
        this.saveFormData(backup);
        
        // バックアップとして保存
        localStorage.setItem('auto-backup', JSON.stringify(backup));
        localStorage.setItem('last-save-time', new Date().toISOString());
    },
    
    // フォームデータ保存
    saveFormData(backup) {
        const forms = document.querySelectorAll('form, .input-container');
        const formData = {};
        
        forms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input, textarea, select');
            const data = {};
            
            inputs.forEach(input => {
                if (input.id || input.name) {
                    data[input.id || input.name] = input.value;
                }
            });
            
            if (Object.keys(data).length > 0) {
                formData[`form-${index}`] = data;
            }
        });
        
        if (Object.keys(formData).length > 0) {
            backup.data['form-data'] = JSON.stringify(formData);
        }
    },
    
    // 復元チェック
    checkRestore() {
        // 復元済みフラグをチェック
        if (sessionStorage.getItem('restore-checked')) {
            return; // 既にチェック済みならスキップ
        }
        
        const backup = localStorage.getItem('auto-backup');
        const lastSave = localStorage.getItem('last-save-time');
        
        if (!backup) {
            sessionStorage.setItem('restore-checked', 'true');
            return;
        }
        
        const data = JSON.parse(backup);
        const timeDiff = Date.now() - new Date(data.timestamp).getTime();
        
        // 5分以内のバックアップなら通知バナーで表示（ポップアップなし）
        if (timeDiff < 300000) {
            sessionStorage.setItem('restore-checked', 'true'); // チェック済みフラグ
            this.showRestoreBanner(data, lastSave);
        } else {
            sessionStorage.setItem('restore-checked', 'true');
        }
    },
    
    // 復元バナー表示（ポップアップの代わり）
    showRestoreBanner(data, lastSave) {
        const banner = document.createElement('div');
        banner.id = 'restore-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 100000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideDown 0.5s ease;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        `;
        
        banner.innerHTML = `
            <span style="font-size: 16px;">
                📂 前回の作業データがあります（${new Date(lastSave).toLocaleString('ja-JP')}）
            </span>
            <button onclick="AutoSave.acceptRestore()" style="
                background: white;
                color: #4CAF50;
                border: none;
                padding: 8px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            ">復元する</button>
            <button onclick="AutoSave.dismissBanner()" style="
                background: transparent;
                color: white;
                border: 1px solid white;
                padding: 8px 20px;
                border-radius: 5px;
                cursor: pointer;
            ">閉じる</button>
        `;
        
        document.body.appendChild(banner);
        
        // データを一時保存
        this.pendingRestore = data;
        
        // 10秒後に自動で消える
        setTimeout(() => {
            if (document.getElementById('restore-banner')) {
                this.dismissBanner();
            }
        }, 10000);
    },
    
    // 復元を承認
    acceptRestore() {
        if (this.pendingRestore) {
            this.restore(this.pendingRestore);
            this.dismissBanner();
            this.showSaveIndicator('✅ データを復元しました');
        }
    },
    
    // バナーを閉じる
    dismissBanner() {
        const banner = document.getElementById('restore-banner');
        if (banner) {
            banner.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => banner.remove(), 300);
        }
    },
    
    // データ復元
    restore(backup) {
        // 各データを復元（APIキーは除外）
        Object.keys(backup.data).forEach(key => {
            // APIキーと設定は復元しない
            if (this.EXCLUDED_KEYS.includes(key)) {
                console.log(`スキップ: ${key} (APIキー/設定は復元対象外)`);
                return;
            }
            if (key !== 'form-data') {
                localStorage.setItem(key, backup.data[key]);
            }
        });
        
        // フォームデータ復元
        if (backup.data['form-data']) {
            setTimeout(() => this.restoreFormData(JSON.parse(backup.data['form-data'])), 1000);
        }
        
        // alertの代わりにコンソールログ
        console.log('✅ データを復元しました');
        // リロードしない（無限ループ防止）
    },
    
    // フォームデータ復元
    restoreFormData(formData) {
        Object.keys(formData).forEach(formKey => {
            const data = formData[formKey];
            Object.keys(data).forEach(inputKey => {
                const input = document.getElementById(inputKey) || 
                             document.querySelector(`[name="${inputKey}"]`);
                if (input) {
                    input.value = data[inputKey];
                }
            });
        });
    },
    
    // 保存インジケーター表示
    showSaveIndicator(message = '✅ 自動保存しました') {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        indicator.textContent = message;
        
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 2000);
    },
    
    // 手動保存
    manualSave() {
        this.saveAll();
        this.showSaveIndicator();
    }
};

// CSS追加
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        50% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
    
    @keyframes slideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 自動初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AutoSave.init());
} else {
    AutoSave.init();
}

// グローバル公開
window.AutoSave = AutoSave;