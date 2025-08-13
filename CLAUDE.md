# SCF V5 - Claude Code専用実装ガイド

## 🎯 プロジェクト概要
日刊AIゆたさん新聞の編集支援システム（10機能）の実装プロジェクト

## 📋 絶対ルール

### 1. コード実装の鉄則
- **新規作成のみ** - 修正・編集は禁止
- **1機能 = 1ファイル** - 各機能は完全独立
- **外部依存なし** - CDN、npm、外部ライブラリ使用禁止
- **インライン実装** - HTML内にCSS/JSを全て記述

### 2. ファイル構造
```
scf-v5/
├── index.html          # メインダッシュボード
├── [機能1]/
│   └── index.html     # 独立した機能ファイル
├── [機能2]/
│   └── index.html
└── ... (計10機能)
```

### 3. 実装順序
1. ディレクトリ構造の作成
2. 各機能のindex.html作成（並行処理可）
3. メインダッシュボード作成
4. 動作確認

## 🔧 技術仕様

### HTML構造
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[機能名] - SCF V5</title>
    <style>
        /* インラインCSS */
    </style>
</head>
<body>
    <!-- コンテンツ -->
    <script>
        // インラインJavaScript
    </script>
</body>
</html>
```

### 共通デザインルール
- フォント: system-ui, sans-serif
- プライマリカラー: #ff6b6b
- 背景: #f8f9fa
- カード背景: #ffffff
- 影: 0 2px 4px rgba(0,0,0,0.1)
- 角丸: 8px
- パディング: 20px

### エラーハンドリング
- try-catchで全処理をラップ
- ユーザーフレンドリーなエラーメッセージ
- console.errorでデバッグ情報出力

## 📝 テスト手順

### 個別機能テスト
1. 各機能フォルダのindex.htmlをブラウザで開く
2. F12でコンソールを確認
3. 基本操作を実行
4. エラーがないことを確認

### 統合テスト
1. メインのindex.htmlを開く
2. 各機能へのリンクを確認
3. 機能間の遷移を確認

## ⚠️ 注意事項

### やってはいけないこと
- Editツールでの既存ファイル修正
- 複雑な依存関係の構築
- 300行を超える単一ファイル
- 非同期処理の過度な使用

### 推奨事項
- Writeツールで新規作成
- シンプルな実装
- 200行以内のファイル
- 同期的な処理フロー

## 🚀 実装コマンド例

```bash
# ディレクトリ作成
mkdir -p scf-v5/{wxr,thumbnail,posts,rss,analytics,scheduler,backup,templates,settings}

# 動作確認（macOS）
open scf-v5/index.html

# 動作確認（Windows）
start scf-v5/index.html
```

## 📊 品質基準

- [ ] 各機能が独立して動作
- [ ] エラーハンドリング実装済み
- [ ] 日本語UI
- [ ] レスポンシブ対応
- [ ] 1秒以内の処理速度
- [ ] コンソールエラーなし

## 🔄 更新履歴管理

実装完了時は必ずCHANGELOG.mdを更新

---

*このドキュメントはClaude Code専用です。実装時は必ずこのルールに従ってください。*