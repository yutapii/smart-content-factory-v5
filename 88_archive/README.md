# 88_archive - アーカイブフォルダ

このフォルダには不要になったテスト・デバッグ用ファイルを保管しています。

## 移動済みファイル（2024-08-29）

- `data-bridge.html` - IndexedDB/localStorage連携テストツール（複雑すぎて不採用）
- `debug-indexeddb.html` - IndexedDBデバッグツール（Chrome依存のため不採用）
- `init-database.html` - IndexedDB初期化ツール（Chrome依存のため不採用）
- `simple-test.html` - localStorageテストツール（06_databaseに置き換え）

## 現在採用している方式

**06_database/** - シンプルなJSONファイルベースのデータベース
- Chrome非依存
- GitHubに保存可能
- 10,000件上限のローテーション管理

これらのファイルは参考資料として保管していますが、実際の運用では使用しません。