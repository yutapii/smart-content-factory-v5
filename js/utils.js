/**
 * Utils - パフォーマンス最適化ユーティリティ
 * SCF V5 共通ヘルパー関数
 */

const Utils = {
    /**
     * 並列処理ヘルパー
     * 複数の非同期処理を並列実行
     */
    async loadParallel(promises) {
        try {
            return await Promise.all(promises);
        } catch (error) {
            console.error('並列処理エラー:', error);
            // 部分的な成功を許可
            return await Promise.allSettled(promises);
        }
    },
    
    /**
     * バッチDOM更新
     * requestAnimationFrameで最適なタイミングで更新
     */
    batchUpdate(container, html) {
        if (!container) return;
        
        requestAnimationFrame(() => {
            container.innerHTML = html;
        });
    },
    
    /**
     * DocumentFragmentを使った効率的なDOM追加
     */
    batchAppend(container, elements) {
        if (!container || !elements || elements.length === 0) return;
        
        const fragment = document.createDocumentFragment();
        elements.forEach(element => {
            if (typeof element === 'string') {
                const div = document.createElement('div');
                div.innerHTML = element;
                fragment.appendChild(div.firstChild);
            } else {
                fragment.appendChild(element);
            }
        });
        
        requestAnimationFrame(() => {
            container.appendChild(fragment);
        });
    },
    
    /**
     * デバウンス処理
     * 連続した呼び出しを制限
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * スロットル処理
     * 一定時間内の実行回数を制限
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * 効率的なDOM要素の表示/非表示
     */
    toggleDisplay(element, show) {
        if (!element) return;
        
        requestAnimationFrame(() => {
            element.style.display = show ? '' : 'none';
        });
    },
    
    /**
     * 複数要素の一括更新
     */
    updateElements(updates) {
        requestAnimationFrame(() => {
            updates.forEach(({ element, property, value }) => {
                if (element) {
                    if (property === 'text') {
                        element.textContent = value;
                    } else if (property === 'html') {
                        element.innerHTML = value;
                    } else {
                        element[property] = value;
                    }
                }
            });
        });
    },
    
    /**
     * 遅延ロード用のIntersection Observer
     */
    lazyLoad(selector, callback) {
        const elements = document.querySelectorAll(selector);
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });
        
        elements.forEach(element => observer.observe(element));
        return observer;
    },
    
    /**
     * パフォーマンス測定
     */
    measurePerformance(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        
        console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    },
    
    /**
     * メモリ効率的な大量データ処理
     */
    async processBatch(items, batchSize = 10, processor) {
        const results = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(item => processor(item))
            );
            results.push(...batchResults);
            
            // UIをブロックしないように少し待機
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        return results;
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

// モジュールとしてもエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}