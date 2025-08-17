# 🔐 SCF V5 セキュリティガイド

## 概要
Smart Content Factory V5では、APIキーと機密情報を安全に管理するための包括的なセキュリティシステムを実装しました。

## ✅ 実装済みのセキュリティ改善

### 1. APIキー管理システム
- **暗号化**: Web Crypto APIを使用したAES-256-GCM暗号化
- **パスワード派生**: PBKDF2（100,000回反復）によるキー派生
- **セッション管理**: 30分のタイムアウト付きセッショントークン
- **ゼロ知識**: サーバー側にAPIキーを保存しない

### 2. 設定管理
- **環境分離**: 開発/本番環境の設定分離
- **機密情報フィルタリング**: 非暗号化ストレージへの機密情報保存防止
- **設定検証**: 起動時の設定値検証

### 3. Cloudflare Worker強化
- **認証**: X-Auth-Tokenヘッダーによる認証
- **レート制限**: IPベースの分あたり60リクエスト制限
- **CORS制御**: 許可されたオリジンのみアクセス可能
- **セキュリティヘッダー**: XSS、クリックジャッキング防止

### 4. 暗号化ユーティリティ
- **RSA暗号化**: 追加のセキュリティレイヤー
- **HMAC署名**: データ整合性の検証
- **TOTP生成**: 二要素認証サポート
- **パスワード強度チェック**: リアルタイム強度評価

### 5. セキュアな設定UI
- **マスターパスワード**: すべてのAPIキーを保護
- **視覚的フィードバック**: セキュリティステータス表示
- **バックアップ/リストア**: 暗号化された設定のエクスポート
- **監査ログ**: アクセス履歴の記録

## 🚀 使用方法

### 初期設定

1. **セキュリティ設定ページを開く**
```bash
open /Users/saitoyutaka/smart-content-factory-v5/security/settings-secure.html
```

2. **マスターパスワードを設定**
- 12文字以上の強力なパスワードを設定
- 大文字、小文字、数字、特殊文字を含める

3. **APIキーを追加**
- サービスを選択（Anthropic、OpenAI、Google Vision等）
- APIキーを入力
- 暗号化して保存

### APIキーの使用

```javascript
// 設定の初期化
const configLoader = new ConfigLoader();
await configLoader.init();

// APIキーの取得（パスワード必要）
const apiKey = await configLoader.getAPIKey('ANTHROPIC_API_KEY', masterPassword);

// セキュアなリクエスト作成
const requestConfig = await configLoader.createSecureRequest('anthropic', masterPassword);
```

### Cloudflare Workerのデプロイ

1. **新しいセキュアWorkerをデプロイ**
```bash
# wrangler.tomlを更新
name = "scf-v5-secure"
main = "cloudflare-worker-secure.js"

# デプロイ
wrangler deploy
```

2. **環境変数を設定**
- Cloudflareダッシュボードで環境変数を設定
- AUTH_SECRET: 認証用シークレット
- 許可するオリジンを設定

## 🔒 セキュリティベストプラクティス

### DO's ✅
1. **強力なマスターパスワードを使用**
   - 最低12文字
   - 複雑性を確保
   - 定期的に変更

2. **APIキーをローテーション**
   - 90日ごとに更新
   - 古いキーは削除

3. **バックアップを作成**
   - 定期的にエクスポート
   - 安全な場所に保管

4. **HTTPSを使用**
   - 本番環境では必須
   - ローカルでもHTTPS推奨

5. **最小権限の原則**
   - 必要最小限のAPIスコープ
   - 読み取り専用キーを優先

### DON'Ts ❌
1. **APIキーをコードに直接記述しない**
2. **暗号化なしでローカルストレージに保存しない**
3. **パスワードを共有しない**
4. **公開リポジトリに.envファイルをコミットしない**
5. **デバッグモードを本番で有効にしない**

## 📊 セキュリティチェックリスト

- [ ] マスターパスワード設定済み
- [ ] すべてのAPIキーが暗号化保存
- [ ] Cloudflare Worker認証設定
- [ ] CORS設定の確認
- [ ] レート制限の有効化
- [ ] HTTPSの使用
- [ ] バックアップの作成
- [ ] .envファイルの.gitignore追加
- [ ] デバッグモード無効化
- [ ] セッションタイムアウト設定

## 🔄 マイグレーションガイド

### 既存システムからの移行

1. **既存のAPIキーをエクスポート**
```javascript
// 旧システムからAPIキーを取得
const oldKeys = localStorage.getItem('api_keys');
```

2. **新システムにインポート**
```javascript
// 新しいセキュアストレージに保存
await apiKeyManager.storeAPIKeys(oldKeys, masterPassword);
```

3. **旧データを削除**
```javascript
// 平文のAPIキーを削除
localStorage.removeItem('api_keys');
```

## 🚨 インシデント対応

### APIキー漏洩時の対応

1. **即座に無効化**
   - 該当サービスでキーを無効化
   - 新しいキーを生成

2. **影響範囲の確認**
   - アクセスログを確認
   - 不正使用の痕跡を調査

3. **システム更新**
   - 新しいキーで更新
   - パスワード変更

4. **再発防止**
   - 原因分析
   - 対策実施

## 📝 更新履歴

| 日付 | バージョン | 内容 |
|-----|-----------|------|
| 2025-01-17 | 1.0.0 | 初期セキュリティシステム実装 |
| - | - | APIキー暗号化機能追加 |
| - | - | Cloudflare Worker認証追加 |
| - | - | セキュア設定UI作成 |

## 🔗 関連ファイル

- `/security/api-key-manager.js` - APIキー管理
- `/security/config-loader.js` - 設定管理
- `/security/crypto-utils.js` - 暗号化ユーティリティ
- `/security/settings-secure.html` - 設定UI
- `/cloudflare-worker-secure.js` - セキュアWorker
- `/.env.example` - 環境変数テンプレート

## 📞 サポート

セキュリティに関する質問や問題がある場合は、以下を確認してください：

1. このガイドの該当セクション
2. コンソールのエラーメッセージ
3. 設定UIのセキュリティステータス

---

**重要**: このシステムは継続的に改善されています。定期的にアップデートを確認し、最新のセキュリティパッチを適用してください。