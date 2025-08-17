// APIキー設定状況チェッカー
// ダッシュボードでAPIキーの設定状況を監視し、未設定時にアラートを表示

const API_CONFIG = {
    google_vision: {
        name: 'Google Cloud Vision API',
        checkMethod: 'env',
        envVar: 'GOOGLE_APPLICATION_CREDENTIALS',
        configFile: null,
        required: true,
        documentation: 'https://cloud.google.com/vision/docs/setup'
    },
    openai: {
        name: 'OpenAI API',
        checkMethod: 'localStorage',
        storageKey: 'openai_api_key',
        required: false,
        documentation: 'https://platform.openai.com/api-keys'
    },
    line: {
        name: 'LINE Messaging API',
        checkMethod: 'config',
        configFile: '/config/line_api.json',
        required: false,
        documentation: 'https://developers.line.biz/ja/docs/messaging-api/'
    }
};

class APIStatusChecker {
    constructor() {
        this.missingAPIs = [];
        this.configuredAPIs = [];
    }

    // APIキーの設定状況をチェック
    async checkAllAPIs() {
        this.missingAPIs = [];
        this.configuredAPIs = [];

        for (const [key, config] of Object.entries(API_CONFIG)) {
            const isConfigured = await this.checkAPI(config);
            if (isConfigured) {
                this.configuredAPIs.push(config);
            } else if (config.required) {
                this.missingAPIs.push(config);
            }
        }

        return {
            missing: this.missingAPIs,
            configured: this.configuredAPIs,
            hasRequiredAPIs: this.missingAPIs.length === 0
        };
    }

    // 個別のAPIチェック
    async checkAPI(config) {
        switch (config.checkMethod) {
            case 'localStorage':
                return this.checkLocalStorage(config.storageKey);
            case 'config':
                return await this.checkConfigFile(config.configFile);
            case 'env':
                return await this.checkServerStatus();
            default:
                return false;
        }
    }

    // LocalStorageチェック
    checkLocalStorage(key) {
        const value = localStorage.getItem(key);
        return value && value.trim().length > 0;
    }

    // 設定ファイルチェック
    async checkConfigFile(path) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                const data = await response.json();
                return data && Object.keys(data).length > 0;
            }
        } catch (error) {
            // ファイルが存在しない場合
        }
        return false;
    }

    // OCRサーバーステータスチェック
    async checkServerStatus() {
        try {
            const response = await fetch('http://localhost:5001/health');
            if (response.ok) {
                const data = await response.json();
                // 実OCRサーバーが稼働中の場合はtrueを返す
                return data.status === 'ok' && data.type !== 'mock';
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // ダッシュボードにアラートを表示
    displayAlert(targetElement) {
        if (this.missingAPIs.length === 0) {
            return;
        }

        const alertHTML = `
            <div id="api-alert" style="
                background: linear-gradient(135deg, #ff6b6b, #ff8e53);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                animation: slideDown 0.5s ease-out;
            ">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="font-size: 24px;">⚠️</div>
                        <div>
                            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                                APIキーが設定されていません
                            </div>
                            <div style="font-size: 14px; opacity: 0.95;">
                                ${this.missingAPIs.map(api => api.name).join(', ')} の設定が必要です
                            </div>
                        </div>
                    </div>
                    <button onclick="showAPISetupGuide()" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                       onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        設定方法を確認
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes slideDown {
                    from {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

        // 既存のアラートを削除
        const existingAlert = document.getElementById('api-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // 新しいアラートを挿入
        if (targetElement) {
            targetElement.insertAdjacentHTML('afterbegin', alertHTML);
        }
    }

    // 設定ガイドモーダルを表示
    showSetupGuide() {
        const guideHTML = `
            <div id="api-setup-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            ">
                <div style="
                    background: white;
                    border-radius: 10px;
                    padding: 30px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease-out;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #333;">🔑 APIキー設定ガイド</h2>
                        <button onclick="closeAPISetupGuide()" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: #999;
                        ">×</button>
                    </div>
                    
                    ${this.missingAPIs.map(api => `
                        <div style="
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin-bottom: 15px;
                            border-left: 4px solid #ff6b6b;
                        ">
                            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">
                                ${api.name}
                            </h3>
                            <p style="color: #666; margin: 10px 0;">
                                このAPIは必須です。以下の手順で設定してください：
                            </p>
                            <ol style="color: #666; margin: 10px 0; padding-left: 20px;">
                                <li>APIキーを取得</li>
                                <li>認証ファイルをダウンロード</li>
                                <li>OCRサーバー起動時にパスを指定</li>
                            </ol>
                            <a href="${api.documentation}" target="_blank" style="
                                display: inline-block;
                                background: #667eea;
                                color: white;
                                padding: 8px 16px;
                                border-radius: 5px;
                                text-decoration: none;
                                font-size: 14px;
                                margin-top: 10px;
                            ">
                                📖 公式ドキュメント
                            </a>
                        </div>
                    `).join('')}
                    
                    <div style="
                        background: #fff3cd;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 20px;
                        border-left: 4px solid #ffc107;
                    ">
                        <strong style="color: #856404;">💡 ヒント:</strong>
                        <p style="color: #856404; margin: 5px 0 0 0;">
                            OCRサーバーを起動するには：<br>
                            <code style="background: rgba(0,0,0,0.1); padding: 2px 5px; border-radius: 3px;">
                                cd /Users/saitoyutaka/smart-content-factory-v5 && ./start_ocr_server.sh
                            </code>
                        </p>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', guideHTML);
    }
}

// グローバル関数
window.showAPISetupGuide = function() {
    const checker = new APIStatusChecker();
    checker.showSetupGuide();
};

window.closeAPISetupGuide = function() {
    const modal = document.getElementById('api-setup-modal');
    if (modal) {
        modal.remove();
    }
};

// 自動チェック機能
window.checkAPIStatus = async function(targetElementId) {
    const checker = new APIStatusChecker();
    const status = await checker.checkAllAPIs();
    
    const targetElement = document.getElementById(targetElementId);
    if (targetElement && status.missing.length > 0) {
        checker.displayAlert(targetElement);
    }
    
    return status;
};

// ページ読み込み時に自動実行
document.addEventListener('DOMContentLoaded', function() {
    // 5秒後にチェック（ページ読み込み完了を待つ）
    setTimeout(() => {
        // コンテナ要素を探す
        const container = document.querySelector('.container') || document.body;
        checkAPIStatus(container.id || 'main-content');
    }, 5000);
    
    // 定期的にチェック（5分ごと）
    setInterval(() => {
        const container = document.querySelector('.container') || document.body;
        checkAPIStatus(container.id || 'main-content');
    }, 300000);
});