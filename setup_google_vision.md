# Google Cloud Vision API セットアップガイド

## 📋 事前準備

### 1. Google Cloud プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択

### 2. Vision APIの有効化
1. [Vision API ページ](https://console.cloud.google.com/apis/library/vision.googleapis.com)を開く
2. 「有効にする」をクリック

### 3. サービスアカウントキーの作成
1. [サービスアカウント](https://console.cloud.google.com/iam-admin/serviceaccounts)ページを開く
2. 「サービスアカウントを作成」をクリック
3. 名前を入力（例：vision-api-service）
4. ロールで「Project > 閲覧者」を選択
5. キーの作成 → JSON形式でダウンロード
6. ダウンロードしたファイルを安全な場所に保存

## 🚀 セットアップ方法

### オプション1: 環境変数を設定（推奨）
```bash
# .bashrc または .zshrc に追加
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/credentials.json"

# すぐに反映
source ~/.bashrc  # または source ~/.zshrc
```

### オプション2: スクリプト実行時に指定
```bash
cd /Users/saitoyutaka/smart-content-factory-v5
./start_ocr_server.sh
# プロンプトが表示されたら、JSONファイルのパスを入力
```

## 🔧 代替案：モックOCRサーバー（APIキーなしで動作）

Google Cloud APIを使わずに、模擬的なOCRサーバーを使用することもできます。

```bash
# モックサーバーを起動
python mock_ocr_server.py
```

## 💰 料金について

Google Cloud Vision APIの料金：
- 最初の1,000リクエスト/月：無料
- 1,001〜5,000,000リクエスト：$1.50/1,000リクエスト
- 詳細：[料金ページ](https://cloud.google.com/vision/pricing)

## ⚠️ セキュリティ注意事項

1. **認証ファイルを公開リポジトリにコミットしない**
2. `.gitignore`に認証ファイルを追加
3. 本番環境では環境変数を使用

## 📝 .gitignore に追加すべき内容
```
# Google Cloud credentials
*.json
credentials/
service-account-key.json
```