// OCRサーバーとの統合機能

const OCR_SERVER_URL = 'http://localhost:5001';

// OCRサーバーの状態をチェック
async function checkOCRServer() {
    try {
        const response = await fetch(`${OCR_SERVER_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 実際のOCR解析を実行
async function performRealOCR(imageData) {
    try {
        const response = await fetch(`${OCR_SERVER_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageData
            })
        });
        
        if (!response.ok) {
            throw new Error('OCR解析に失敗しました');
        }
        
        const result = await response.json();
        return result.articles || [];
        
    } catch (error) {
        console.error('OCRエラー:', error);
        throw error;
    }
}

// note.com形式の解析（改善版）
async function analyzeNoteScreenshot() {
    if (!window.uploadedImage) {
        alert('まず画像をアップロードしてください');
        return;
    }
    
    // OCRサーバーの状態確認
    const serverAvailable = await checkOCRServer();
    
    if (!serverAvailable) {
        // サーバーが利用できない場合は選択肢を提示
        const useSimulation = confirm(
            'OCRサーバーが起動していません。\n\n' +
            'OK: 模擬データを使用\n' +
            'キャンセル: 手動入力モード\n\n' +
            '実際のOCRを使用するには、ターミナルで以下を実行してください：\n' +
            'cd /Users/saitoyutaka/smart-content-factory-v5\n' +
            './start_ocr_server.sh'
        );
        
        if (useSimulation) {
            simulateNoteAnalysis();
        } else {
            showManualInputDialog();
        }
        return;
    }
    
    // 実際のOCR解析を実行
    const screenshotArea = document.getElementById('screenshotArea');
    screenshotArea.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 2em; margin-bottom: 10px;">🔍</div>
            <div style="color: #666;">OCR解析中...</div>
            <div style="margin-top: 10px;">
                <div style="display: inline-block; width: 200px; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
                    <div style="width: 50%; height: 100%; background: #667eea; animation: progress 2s infinite;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
        </style>
    `;
    
    try {
        const articles = await performRealOCR(window.uploadedImage);
        
        if (articles.length === 0) {
            screenshotArea.innerHTML = `
                <div style="background: #ffe0e0; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="color: #d32f2f; font-weight: bold;">解析失敗</div>
                    <div style="color: #666; margin-top: 10px;">
                        記事データを検出できませんでした。<br>
                        画像が鮮明であることを確認してください。
                    </div>
                    <button onclick="resetScreenshotArea()" class="btn btn-primary" style="margin-top: 15px;">
                        やり直す
                    </button>
                </div>
            `;
            return;
        }
        
        // 解析結果を表示
        displayOCRResults(articles);
        
    } catch (error) {
        screenshotArea.innerHTML = `
            <div style="background: #ffe0e0; padding: 15px; border-radius: 8px;">
                <div style="color: #d32f2f; font-weight: bold;">エラー</div>
                <div style="color: #666; margin-top: 10px;">
                    ${error.message}<br>
                    模擬データまたは手動入力をお試しください。
                </div>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="simulateNoteAnalysis()" class="btn btn-primary" style="flex: 1;">
                        模擬データを使用
                    </button>
                    <button onclick="showManualInputDialog()" class="btn btn-primary" style="flex: 1;">
                        手動入力
                    </button>
                </div>
            </div>
        `;
    }
}

// OCR結果を表示
function displayOCRResults(articles) {
    const totalViews = articles.reduce((sum, item) => sum + (item.views || 0), 0);
    const totalComments = articles.reduce((sum, item) => sum + (item.comments || 0), 0);
    const totalLikes = articles.reduce((sum, item) => sum + (item.likes || 0), 0);
    
    const resultHtml = `
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">✅ OCR解析完了（実データ）</h4>
            <div style="font-size: 0.9em; color: #666;">
                ${articles.length}件の記事データを検出しました
            </div>
            <div style="display: flex; gap: 15px; margin-top: 10px;">
                <div style="flex: 1; text-align: center;">
                    <div style="color: #00BFA5; font-size: 1.5em; font-weight: bold;">${totalViews}</div>
                    <div style="font-size: 0.8em; color: #666;">全体ビュー</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="color: #999; font-size: 1.5em; font-weight: bold;">${totalComments}</div>
                    <div style="font-size: 0.8em; color: #666;">コメント</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="color: #ff6b6b; font-size: 1.5em; font-weight: bold;">${totalLikes}</div>
                    <div style="font-size: 0.8em; color: #666;">スキ</div>
                </div>
            </div>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
            ${articles.map((item, index) => `
                <div style="background: white; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #e0e0e0;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 5px; font-size: 0.9em;">
                        ${item.title.length > 40 ? item.title.substring(0, 40) + '...' : item.title}
                    </div>
                    <div style="display: flex; gap: 15px; font-size: 0.85em; color: #666;">
                        <span>📅 ${item.date}</span>
                        <span style="color: #00BFA5;">👁 ${item.views || 0}</span>
                        <span style="color: #999;">💬 ${item.comments || 0}</span>
                        <span style="color: #ff6b6b;">❤️ ${item.likes || 0}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-primary" onclick="importAnalyzedData(${JSON.stringify(articles).replace(/"/g, '&quot;')})" style="margin-top: 15px;">
            この内容でインポート
        </button>
    `;
    
    document.getElementById('screenshotArea').innerHTML = resultHtml;
}