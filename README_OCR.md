# OCR機能の使い方

## 🚀 クイックスタート

### 1. Google Cloud Vision APIの設定
1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Vision APIを有効化
3. サービスアカウントキーをダウンロード（credentials.json）

### 2. OCRサーバーの起動
```bash
cd /Users/saitoyutaka/smart-content-factory-v5
./start_ocr_server.sh
# 認証ファイルのパスを入力
```

### 3. 使用方法
1. ブラウザで posts/index.html を開く
2. note.comのダッシュボードのスクリーンショットを撮る
3. 「AI一括入力」エリアに画像をドラッグ&ドロップ
4. 「模擬解析して一括入力」ボタンをクリック

## 📋 機能の選択

### 実OCR解析（サーバー起動時）
- 実際の画像からテキストを抽出
- note.comの形式を自動認識
- ビュー数、コメント数、スキ数を取得

### 模擬解析（サーバー未起動時）
- サンプルデータを表示
- 動作確認用

### 手動入力
- CSV形式でデータを直接入力
- 最も確実な方法

## ⚠️ 注意事項
- OCRサーバーはローカル（localhost:5000）で動作
- APIキーは安全に管理してください
- 画像は鮮明なものを使用してください

## 🔧 トラブルシューティング

### サーバーが起動しない
```bash
# 必要なパッケージをインストール
pip install flask flask-cors google-cloud-vision
```

### 認証エラー
```bash
# 環境変数を設定
export GOOGLE_APPLICATION_CREDENTIALS="path/to/credentials.json"
```

### CORS エラー
- OCRサーバーが起動していることを確認
- http://localhost:5000/health にアクセスして確認