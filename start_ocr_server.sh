#!/bin/bash

# OCRサーバー起動スクリプト

echo "📦 必要なパッケージをインストール中..."
pip install flask flask-cors google-cloud-vision

echo ""
echo "🔑 Google Cloud認証設定を確認中..."
echo "認証ファイルのパスを入力してください："
read -p "Path to credentials.json: " CRED_PATH

if [ -f "$CRED_PATH" ]; then
    export GOOGLE_APPLICATION_CREDENTIALS="$CRED_PATH"
    echo "✅ 認証設定完了"
else
    echo "❌ ファイルが見つかりません: $CRED_PATH"
    exit 1
fi

echo ""
echo "🚀 OCRサーバーを起動します..."
python ocr_server.py