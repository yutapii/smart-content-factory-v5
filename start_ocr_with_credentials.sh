#!/bin/bash

# Google Cloud Vision API用OCRサーバー起動スクリプト

echo "🔍 Google Cloud認証ファイルを探しています..."

# よくある認証ファイルの場所をチェック
POSSIBLE_PATHS=(
    "$HOME/Downloads/*.json"
    "$HOME/Desktop/*.json"
    "$HOME/Documents/*.json"
    "$HOME/.config/gcloud/*.json"
    "$HOME/credentials/*.json"
    "./credentials.json"
    "./service-account.json"
    "./google-credentials.json"
)

FOUND_FILES=()

for path in "${POSSIBLE_PATHS[@]}"; do
    for file in $path; do
        if [ -f "$file" ]; then
            FOUND_FILES+=("$file")
        fi
    done
done

if [ ${#FOUND_FILES[@]} -eq 0 ]; then
    echo "❌ 認証ファイルが見つかりません"
    echo ""
    echo "📋 認証ファイルの取得方法："
    echo "1. https://console.cloud.google.com にアクセス"
    echo "2. プロジェクトを選択"
    echo "3. IAMと管理 > サービスアカウント"
    echo "4. サービスアカウントを作成"
    echo "5. キーを作成 > JSONでダウンロード"
    echo ""
    echo "ダウンロードしたファイルのパスを入力してください："
    read -p "Path: " CRED_PATH
else
    echo "✅ 認証ファイル候補が見つかりました："
    echo ""
    for i in "${!FOUND_FILES[@]}"; do
        echo "[$((i+1))] ${FOUND_FILES[$i]}"
    done
    echo ""
    echo "使用するファイルの番号を選択してください (1-${#FOUND_FILES[@]}):"
    read -p "選択: " choice
    
    if [ "$choice" -ge 1 ] && [ "$choice" -le "${#FOUND_FILES[@]}" ]; then
        CRED_PATH="${FOUND_FILES[$((choice-1))]}"
    else
        echo "無効な選択です"
        exit 1
    fi
fi

if [ ! -f "$CRED_PATH" ]; then
    echo "❌ ファイルが見つかりません: $CRED_PATH"
    exit 1
fi

echo "✅ 認証ファイルを使用: $CRED_PATH"
export GOOGLE_APPLICATION_CREDENTIALS="$CRED_PATH"

echo ""
echo "📦 必要なパッケージを確認中..."
pip list | grep google-cloud-vision > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "google-cloud-visionをインストール中..."
    pip install google-cloud-vision flask flask-cors
fi

echo ""
echo "🚀 Google Cloud Vision API OCRサーバーを起動します..."
python ocr_server.py