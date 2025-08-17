#!/usr/bin/env python3
"""
OCRサーバー - note.comのスクリーンショットを解析
"""
import os
import json
import base64
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from google.cloud import vision
import re
from datetime import datetime

app = Flask(__name__)
# CORS設定を明示的に指定
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS"])

# Google Cloud Vision APIクライアントの初期化
# 環境変数GOOGLE_APPLICATION_CREDENTIALSに認証情報のパスを設定する必要があります
client = vision.ImageAnnotatorClient()

@app.route('/analyze', methods=['POST'])
def analyze_image():
    """画像をOCR解析してnote.comのデータを抽出"""
    try:
        # Base64エンコードされた画像データを受け取る
        data = request.json
        image_data = data.get('image', '')
        
        # Base64デコード
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # Google Vision APIで解析
        image = vision.Image(content=image_bytes)
        response = client.text_detection(image=image)
        texts = response.text_annotations
        
        if not texts:
            return jsonify({'error': 'テキストが検出されませんでした'}), 400
        
        # 全テキストを取得
        full_text = texts[0].description
        
        # note.comのデータパターンを抽出
        articles = parse_note_data(full_text)
        
        return jsonify({
            'success': True,
            'articles': articles,
            'raw_text': full_text[:500]  # デバッグ用
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def parse_note_data(text):
    """note.comのダッシュボードテキストから記事データを抽出"""
    articles = []
    lines = text.split('\n')
    
    current_article = {}
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # タイトルパターン（日本語を含む長い文字列）
        if len(line) > 10 and not line.isdigit():
            # 数字のみの行はスキップ
            if not re.match(r'^\d+$', line):
                # 新しい記事の開始
                if current_article.get('title'):
                    articles.append(current_article)
                current_article = {'title': line, 'views': 0, 'comments': 0, 'likes': 0}
        
        # ビュー数、コメント数、スキ数のパターン
        # 数字の後に次の行を見て判定
        if re.match(r'^\d+$', line):
            number = int(line)
            # 次の行を確認
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if 'ビュー' in next_line or '全体ビュー' in next_line:
                    if current_article:
                        current_article['views'] = number
                elif 'コメント' in next_line:
                    if current_article:
                        current_article['comments'] = number
                elif 'スキ' in next_line or 'いいね' in next_line:
                    if current_article:
                        current_article['likes'] = number
    
    # 最後の記事を追加
    if current_article.get('title'):
        articles.append(current_article)
    
    # 日付を追加（現在の日付）
    for article in articles:
        article['date'] = datetime.now().strftime('%Y-%m-%d')
    
    return articles

@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    """ヘルスチェック"""
    response = make_response(jsonify({
        'status': 'ok',
        'type': 'real',  # 実OCRサーバーであることを明示
        'message': 'Google Cloud Vision API 稼働中'
    }))
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

if __name__ == '__main__':
    # APIキーの確認
    if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
        print("警告: GOOGLE_APPLICATION_CREDENTIALSが設定されていません")
        print("export GOOGLE_APPLICATION_CREDENTIALS='path/to/your/credentials.json'")
    
    print("OCRサーバーを起動しています...")
    print("http://localhost:5001")
    app.run(port=5001, debug=True)