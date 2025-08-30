ご飯梅干30度超えました# Smart Content Factory V5 - データフロー仕様書

## 📊 05_rss-reader → 06_database データフロー

### 概要
05_rss-readerで収集したRSS記事データを06_databaseへ保存し、記事の選択・送信を行うフローです。

### データフロー図
```
[05_rss-reader]
    ↓
    収集（RSS取得）
    ↓
    解析（記事抽出）
    ↓
    保存（LocalStorage: 06_database_articles）
    ↓
[06_database]
    ↓
    読み込み（自動/手動）
    ↓
    選択（チェックボックス）
    ↓
    送信（10_rss-to-article）
```

## 🔄 データ保存処理（05_rss-reader）

### 保存関数: `saveAllTo06Database()`
**場所**: 05_rss-reader/index.html:3624-3743

#### 処理フロー:
1. **記事収集**
   - 各RSSフィードから記事を取得
   - CORS回避サービス経由でフェッチ
   - XMLパースして記事データ抽出

2. **データ変換**
   ```javascript
   const articleData = {
       id: generateUniqueId(),
       title: item.querySelector('title')?.textContent,
       link: item.querySelector('link')?.textContent,
       description: item.querySelector('description')?.textContent,
       source: feed.name,
       sourceUrl: feed.url,
       category: feed.category,
       pubDate: new Date(pubDateText).toISOString(),
       fetchedAt: new Date().toISOString()
   };
   ```

3. **重複チェック**
   - 既存データをLocalStorageから読み込み
   - URLベースで重複確認
   - 新規記事のみ追加

4. **保存形式**
   ```javascript
   const databaseData = {
       version: "1.0",
       lastUpdated: new Date().toISOString(),
       articles: [...],
       metadata: {
           totalArticles: articles.length,
           sources: uniqueSources,
           categories: uniqueCategories
       }
   };
   ```

5. **LocalStorage保存**
   - キー: `06_database_articles`
   - 形式: JSON文字列
   - 更新時: 既存データとマージ

## 📥 データ読み込み処理（06_database）

### 読み込み関数: `loadFromRSS()`
**場所**: 06_database/index.html:156-169

#### 処理フロー:
1. **自動読み込み**（ページロード時）
   ```javascript
   window.addEventListener('load', () => {
       const stored = localStorage.getItem('06_database_articles');
       if (stored) {
           // データ存在通知
       }
   });
   ```

2. **手動読み込み**（ボタンクリック）
   - 「05_rss-readerから読み込む」ボタン
   - LocalStorageからデータ取得
   - 記事一覧表示

3. **表示処理**
   ```javascript
   function displayArticles(articles) {
       // 記事ごとにHTML要素生成
       // チェックボックス付きカード表示
       // 選択状態管理
   }
   ```

## 💾 LocalStorageキー仕様

### キー: `06_database_articles`

#### データ構造:
```json
{
    "version": "1.0",
    "lastUpdated": "2025-08-30T12:00:00.000Z",
    "articles": [
        {
            "id": "unique-id-123",
            "title": "記事タイトル",
            "link": "https://example.com/article",
            "description": "記事の説明文",
            "source": "TechCrunch",
            "sourceUrl": "https://techcrunch.com/feed/",
            "category": "テクノロジー",
            "pubDate": "2025-08-30T10:00:00.000Z",
            "fetchedAt": "2025-08-30T11:00:00.000Z"
        }
    ],
    "metadata": {
        "totalArticles": 150,
        "sources": ["TechCrunch", "The Verge", ...],
        "categories": ["テクノロジー", "AI・機械学習", ...]
    }
}
```

## 🚀 記事送信処理（06_database → 10_rss-to-article）

### 送信関数: `sendToRssToArticle()`
**場所**: 06_database/index.html:295-317

#### 処理フロー:
1. **選択記事収集**
   - チェックボックスで選択された記事
   - 選択数の確認（0件の場合はアラート）

2. **データ準備**
   ```javascript
   const exportData = {
       exportedAt: new Date().toISOString(),
       source: '06_database',
       articles: selectedArticles
   };
   ```

3. **保存と通知**
   - キー: `rss-to-article-input`
   - 形式: JSON文字列
   - 通知: トーストメッセージ表示

4. **ページ遷移**
   ```javascript
   window.location.href = '../10_rss-to-article/index.html';
   ```

## 🔧 エラーハンドリング

### 05_rss-reader側
- RSS取得エラー: エラー状態を記録、次のフィードへ継続
- パースエラー: スキップして次の記事へ
- 保存エラー: トースト通知でユーザーに通知

### 06_database側
- データ読み込みエラー: エラーメッセージ表示
- 選択エラー: アラート表示
- 送信エラー: コンソールログとメッセージ表示

## 📈 パフォーマンス最適化

### 重複排除
- URLベースの重複チェック
- 既存データとのマージ処理
- インクリメンタル更新

### データサイズ管理
- LocalStorage容量制限（約5-10MB）
- 古い記事の自動削除（未実装・要検討）
- データ圧縮（未実装・要検討）

## 🎯 ユーザーフロー

1. **RSS収集フェーズ**（05_rss-reader）
   - RSSフィード登録
   - 自動テスト実行
   - エラー管理
   - データベース保存

2. **記事選択フェーズ**（06_database）
   - データ読み込み
   - 記事一覧表示
   - 複数選択
   - 送信準備

3. **記事編集フェーズ**（10_rss-to-article）
   - 選択記事の受信
   - 内容編集
   - AI処理
   - 最終出力

## 📝 注意事項

### データ整合性
- LocalStorageの同期問題に注意
- 複数タブでの操作時の競合状態
- ブラウザのプライベートモードでは動作しない

### 容量制限
- LocalStorage: 約5-10MB
- 大量の記事保存時は定期的なクリーンアップが必要

### セキュリティ
- XSS対策: HTMLエスケープ処理
- CORS回避サービスの信頼性確認
- 機密情報を含むRSSフィードの取り扱い注意

## 🔄 今後の改善案

1. **インクリメンタル更新**
   - 差分更新の実装
   - 更新日時での絞り込み

2. **データ圧縮**
   - LZ-string等での圧縮
   - 不要フィールドの削除

3. **バックグラウンド同期**
   - Service Workerの活用
   - 定期的な自動更新

4. **エクスポート機能**
   - JSON/CSV形式でのエクスポート
   - バックアップ機能

---

*最終更新: 2025-08-30*
*Smart Content Factory V5 - データフロー仕様書*