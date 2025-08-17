# 🧹 SCF V5 不要ファイル削除推奨リスト

## 📊 分析結果サマリー
- 総ファイル数: 約80ファイル
- 削除推奨: 31ファイル
- 統合推奨: 8ファイル
- 保持推奨: 残り全て

## 🗑️ 削除推奨ファイル

### 1. バックアップファイル（重複）
```bash
# 削除コマンド
rm /Users/saitoyutaka/smart-content-factory-v5/rss-reader/index-backup.html
rm /Users/saitoyutaka/smart-content-factory-v5/rss-sources/index_backup.html
```
**理由**: 現行版が存在し、バックアップは不要

### 2. テスト・デバッグファイル
```bash
# 削除コマンド
rm /Users/saitoyutaka/smart-content-factory-v5/test-rss-feeds.html
rm /Users/saitoyutaka/smart-content-factory-v5/test_ocr.html
rm /Users/saitoyutaka/smart-content-factory-v5/test_status.html
rm /Users/saitoyutaka/smart-content-factory-v5/debug-panel.html
rm /Users/saitoyutaka/smart-content-factory-v5/error-monitor.html
rm /Users/saitoyutaka/smart-content-factory-v5/mock_ocr_server.py
rm /Users/saitoyutaka/smart-content-factory-v5/api_status_checker.js
```
**理由**: 開発時のテスト用で本番では不要

### 3. 重複バージョンファイル（-v2フォルダ）
```bash
# 削除コマンド（v1が動作している場合）
rm -rf /Users/saitoyutaka/smart-content-factory-v5/article-v2/
rm -rf /Users/saitoyutaka/smart-content-factory-v5/wxr-v2/
rm -rf /Users/saitoyutaka/smart-content-factory-v5/posts-v2/
rm -rf /Users/saitoyutaka/smart-content-factory-v5/image-gen-v2/
```
**理由**: v1版が存在し機能している場合は不要

### 4. 古いWorkerスクリプト
```bash
# 削除コマンド（新しいセキュアバージョンに移行後）
rm /Users/saitoyutaka/smart-content-factory-v5/claude-worker.js
rm /Users/saitoyutaka/smart-content-factory-v5/cloudflare-worker-fix.js
rm /Users/saitoyutaka/smart-content-factory-v5/worker-combined.js
```
**理由**: `cloudflare-worker-secure.js`に統合済み

### 5. 重複・古いドキュメント
```bash
# 削除コマンド
rm /Users/saitoyutaka/smart-content-factory-v5/CORS-FIX.md
rm /Users/saitoyutaka/smart-content-factory-v5/CLOUDFLARE-WORKER-UPDATE.md
rm /Users/saitoyutaka/smart-content-factory-v5/UPDATE-WORKER.md
rm /Users/saitoyutaka/smart-content-factory-v5/worker-deploy-guide.md
rm /Users/saitoyutaka/smart-content-factory-v5/修正内容チェックリスト.md
```
**理由**: 情報が古いか、他のドキュメントに統合可能

### 6. 不要なデータファイル
```bash
# 削除コマンド
rm /Users/saitoyutaka/smart-content-factory-v5/api-article-formatted.txt
rm /Users/saitoyutaka/smart-content-factory-v5/rss-feeds.txt
rm /Users/saitoyutaka/smart-content-factory-v5/rss/ai_rss_import.txt
rm "/Users/saitoyutaka/smart-content-factory-v5/rss/rss-feeds-detailed-2025-08-17 (2).json"
```
**理由**: テストデータまたは重複データ

### 7. 不要なツール
```bash
# 削除コマンド
rm /Users/saitoyutaka/smart-content-factory-v5/rss-url-validator.html
rm /Users/saitoyutaka/smart-content-factory-v5/note-weekly-tracker.html
rm /Users/saitoyutaka/smart-content-factory-v5/import_actual_data.html
```
**理由**: 一時的な用途で作成、機能が他に統合済み

## 🔄 統合推奨

### ドキュメント統合
以下を`README.md`に統合:
- `HANDOVER.md` → READMEの「Getting Started」セクション
- `RSS2JSON-PRICING.md` → READMEの「External Services」セクション
- `GET_GOOGLE_VISION_API.md` + `setup_google_vision.md` + `README_OCR.md` → 統合して`OCR-SETUP-GUIDE.md`

### スクリプト統合
- `start_ocr_server.sh` + `start_ocr_with_credentials.sh` → 1つのスクリプトに統合
- `ocr_integration.js` → `posts/index.html`に統合（既に含まれている場合）

## ✅ 保持すべきファイル

### コア機能
- `index.html` - メインダッシュボード
- 各機能フォルダの`index.html`
- `security/`フォルダ全体 - 新しいセキュリティシステム

### 重要ドキュメント
- `README.md` - プロジェクト概要
- `SPECIFICATION.md` - 仕様書
- `SECURITY-GUIDE.md` - セキュリティガイド
- `CLAUDE.md` - Claude Code用ガイド
- `CHANGELOG.md` - 変更履歴

### 設定ファイル
- `wrangler.toml` - Cloudflare設定
- `.env.example` - 環境変数テンプレート

### データファイル
- `working-rss-feeds.json` - 動作確認済みフィード
- `import-feeds.json` - インポート用データ
- `rss/ai_rss_feeds_verified.json` - 検証済みフィード

## 🚀 クリーンアップ実行手順

### 1. バックアップ作成
```bash
# プロジェクト全体のバックアップ
cp -r /Users/saitoyutaka/smart-content-factory-v5 /Users/saitoyutaka/smart-content-factory-v5-backup-$(date +%Y%m%d)
```

### 2. 段階的削除

#### Phase 1: テスト・デバッグファイル削除
```bash
rm test*.html debug-panel.html error-monitor.html mock_ocr_server.py api_status_checker.js
```

#### Phase 2: バックアップファイル削除
```bash
rm rss-reader/index-backup.html rss-sources/index_backup.html
```

#### Phase 3: v2フォルダ確認後削除
```bash
# 各v2フォルダの機能がv1で動作確認後
rm -rf *-v2/
```

#### Phase 4: 古いWorker削除
```bash
# cloudflare-worker-secure.jsの動作確認後
rm claude-worker.js cloudflare-worker-fix.js worker-combined.js
```

### 3. 削除後の確認
```bash
# ファイル数確認
find . -type f -name "*.html" -o -name "*.js" -o -name "*.md" | wc -l

# ディレクトリ構造確認
tree -L 2 -I 'node_modules|.git'
```

## 📈 削除による効果

- **ディスク容量**: 約2-3MB削減
- **ファイル数**: 31ファイル削減（約40%削減）
- **保守性**: 大幅に向上
- **可読性**: プロジェクト構造が明確に

## ⚠️ 注意事項

1. **削除前に必ずバックアップを作成**
2. **段階的に削除し、各段階で動作確認**
3. **チーム内で削除計画を共有**
4. **削除後は`git commit`で記録**

## 削除コミット例
```bash
git add -A
git commit -m "chore: プロジェクトクリーンアップ

- テスト・デバッグファイル削除
- バックアップファイル削除
- 重複バージョン削除
- 古いドキュメント統合

削除ファイル数: 31
残存ファイル数: 約50"
```