#!/usr/bin/env python3
"""
モックOCRサーバー - Google Cloud Vision APIなしで動作
実際のOCR処理の代わりに、パターンマッチングでデモデータを返す
"""
import json
import base64
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# モックデータのテンプレート
MOCK_ARTICLES = [
    {
        "title": "【2025年版】CPUコア数の選び方 - 4コアで十分？16コア必要？",
        "views": 22,
        "comments": 0,
        "likes": 0
    },
    {
        "title": "冷たいGPT-5sを理想の恋人&嫁友に変える禁断テクニック大公開！",
        "views": 21,
        "comments": 0,
        "likes": 2
    },
    {
        "title": "OpenAI初のオープンソースモデル「GPT-OSS-20b」徹底解説",
        "views": 17,
        "comments": 0,
        "likes": 1
    },
    {
        "title": "Claude Code徹底解説 - ターミナルに住むAIが変える開発現場",
        "views": 13,
        "comments": 0,
        "likes": 2
    },
    {
        "title": "禁酒34日目で分かったこと",
        "views": 9,
        "comments": 0,
        "likes": 0
    },
    {
        "title": "サッカーファンが最強GPU情報源だった話",
        "views": 8,
        "comments": 0,
        "likes": 0
    },
    {
        "title": "AIメガネがないと出世できない時代",
        "views": 8,
        "comments": 0,
        "likes": 0
    }
]

@app.route('/analyze', methods=['POST'])
def analyze_image():
    """画像を受け取り、モックデータを返す"""
    try:
        data = request.json
        image_data = data.get('image', '')
        
        if not image_data:
            return jsonify({'error': '画像データがありません'}), 400
        
        # ランダムに記事数を決定（3-7記事）
        num_articles = random.randint(3, min(7, len(MOCK_ARTICLES)))
        
        # ランダムに記事を選択
        selected_articles = random.sample(MOCK_ARTICLES, num_articles)
        
        # 日付を追加（過去30日のランダムな日付）
        today = datetime.now()
        for article in selected_articles:
            days_ago = random.randint(0, 30)
            article_date = today - timedelta(days=days_ago)
            article['date'] = article_date.strftime('%Y-%m-%d')
            
            # ランダムに数値を少し変動させる（よりリアルに）
            article['views'] = max(0, article['views'] + random.randint(-5, 10))
            article['likes'] = max(0, article['likes'] + random.randint(-1, 2))
            article['comments'] = max(0, article['comments'] + random.randint(0, 1))
        
        # 日付でソート
        selected_articles.sort(key=lambda x: x['date'], reverse=True)
        
        return jsonify({
            'success': True,
            'articles': selected_articles,
            'is_mock': True,  # モックデータであることを明示
            'message': 'モックOCRサーバーからのデモデータです'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェック"""
    return jsonify({
        'status': 'ok',
        'type': 'mock',
        'message': 'モックOCRサーバーが稼働中です（Google Vision API不要）'
    })

@app.route('/', methods=['GET'])
def index():
    """サーバー情報"""
    return jsonify({
        'name': 'Mock OCR Server',
        'version': '1.0.0',
        'description': 'Google Cloud Vision APIなしで動作するデモ用OCRサーバー',
        'endpoints': {
            '/': 'サーバー情報',
            '/health': 'ヘルスチェック',
            '/analyze': 'モック画像解析（POST）'
        },
        'note': 'このサーバーは実際のOCR処理は行いません。デモ用のモックデータを返します。'
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🎭 モックOCRサーバーを起動しています...")
    print("=" * 60)
    print("📌 このサーバーはGoogle Cloud Vision APIを使用しません")
    print("📌 デモ用のモックデータを返します")
    print("📌 実際のOCR処理は行われません")
    print("-" * 60)
    print("🌐 サーバーURL: http://localhost:5000")
    print("🔍 ヘルスチェック: http://localhost:5000/health")
    print("-" * 60)
    print("停止するには Ctrl+C を押してください")
    print("=" * 60)
    
    app.run(port=5000, debug=True)