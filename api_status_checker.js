/**
 * API Status Checker
 * 各種APIの状態を確認
 */

async function checkAPIStatus(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const apis = {
        claude: {
            name: 'Claude API',
            check: async () => {
                // 正しいキー名で取得
                const key = localStorage.getItem('anthropic-api-key');
                return key && key.length > 20;
            }
        },
        openai: {
            name: 'OpenAI API',
            check: async () => {
                const key = localStorage.getItem('openai-api-key');
                return key && key.length > 20;
            }
        },
        worker: {
            name: 'Cloudflare Worker',
            check: async () => {
                // 正しいキー名で取得
                const url = localStorage.getItem('cloudflare-worker-url');
                return url && (url.includes('workers.dev') || url.includes('cloudflare'));
            }
        }
    };
    
    let html = '<div style="padding: 10px; background: #f8f9fa; border-radius: 8px; margin: 10px 0;">';
    html += '<h4 style="margin: 0 0 10px 0;">API ステータス</h4>';
    
    for (const [key, api] of Object.entries(apis)) {
        try {
            const isActive = await api.check();
            const status = isActive ? '✅' : '❌';
            const color = isActive ? '#4CAF50' : '#f44336';
            html += `<div style="padding: 5px; color: ${color};">${status} ${api.name}</div>`;
        } catch (e) {
            html += `<div style="padding: 5px; color: #ff9800;">⚠️ ${api.name} (確認エラー)</div>`;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    return true;
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAPIStatus };
}