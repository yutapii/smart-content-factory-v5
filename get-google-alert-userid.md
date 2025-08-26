# 📍 USER_IDはどこにある？取得方法完全ガイド

## ⚠️ 重要な事実
**USER_IDは直接表示されていません！**
Googleアラートの画面には表示されず、RSS URLの中に自動的に含まれます。

## 🎯 USER_ID取得の唯一の方法

### ステップ1：Googleアラートを作成
1. https://www.google.co.jp/alerts にアクセス
2. 何でもいいのでアラートを1つ作成
   - 例：「テスト」というキーワード
3. **配信先を「RSSフィード」に必ず設定** ⚠️最重要

### ステップ2：RSSアイコンをクリック
![RSSアイコン](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjZmY2NjAwIiBkPSJNMy45MjkgNS4xYzYuNDg0IDAgMTEuOTcxIDUuNDcyIDExLjk3MSAxMS45NjNoMy4wNDNDMTguOTQzIDguOTEgMTIuMTEzIDIgMy45MjkgMnYzLjF6TTMuOTI5IDEwLjE2NmMzLjcwOCAwIDYuOTEgMy4wODkgNi45MSA2LjkwM2gzLjA1OWMwLTUuNTEtNC40NjgtOS45NjgtOS45NjktOS45Njh2My4wNjV6TTYuNDkgMTguMDYzYzAgMS4zOTYtMS4xMzEgMi41MzEtMi41MjggMi41MzEtMS4zOTUgMC0yLjUyOC0xLjEzNS0yLjUyOC0yLjUzMSAwLTEuMzk3IDEuMTMzLTIuNTI5IDIuNTI4LTIuNTI5IDEuMzk3IDAgMi41MjggMS4xMzIgMi41MjggMi41Mjl6Ii8+PC9zdmc+)
オレンジ色のRSSアイコンをクリック

### ステップ3：URLからUSER_IDを確認
新しいタブで開いたURLを見る：
```
https://www.google.com/alerts/feeds/12345678901234567890/9876543210987654
                                      ↑ これがUSER_ID ↑    ↑ ALERT_ID ↑
```

## 📊 実際の見え方

### Googleアラート管理画面
```
あなたのアラート
┌─────────────────────────────────────┐
│ 🔍 生成AI              🔶 ✏️ 🗑️    │ ← このRSSアイコンをクリック！
├─────────────────────────────────────┤
│ 🔍 ChatGPT             🔶 ✏️ 🗑️    │
├─────────────────────────────────────┤
│ 🔍 自動運転            🔶 ✏️ 🗑️    │
└─────────────────────────────────────┘
```

### クリック後のURL
```
https://www.google.com/alerts/feeds/04829374659283746592/17364859273645982736
```
この場合：
- **USER_ID**: `04829374659283746592`（あなたのアカウント固有）
- **ALERT_ID**: `17364859273645982736`（このアラート固有）

## 🔍 USER_IDの特徴

### 全アラート共通
同じGoogleアカウントのすべてのアラートで**USER_IDは同じ**：
```
アラート1: /04829374659283746592/11111111111111111111
アラート2: /04829374659283746592/22222222222222222222
アラート3: /04829374659283746592/33333333333333333333
           ↑ すべて同じUSER_ID ↑
```

### 見つからない場所
以下の場所には**表示されません**：
- ❌ Googleアカウント設定
- ❌ Googleアラートの設定画面
- ❌ メールで送られてくるアラート
- ✅ **RSS URLの中だけ**

## 💡 簡単な確認方法

### 方法1：ブラウザのアドレスバー
1. RSSアイコンクリック
2. アドレスバーを見る
3. `/feeds/`の後の20桁がUSER_ID

### 方法2：デベロッパーツール
1. Googleアラート画面でF12
2. RSSアイコンを右クリック→「要素を検証」
3. `href`属性にURL全体が表示

### 方法3：テキストエディタにコピペ
1. RSS URLをコピー
2. メモ帳に貼り付け
3. `/`で区切られた数字を確認

## ⚠️ よくある間違い

### ❌ 間違い1：GoogleアカウントIDと混同
```
Googleアカウント: example@gmail.com
USER_ID: 12345678901234567890（全く別物）
```

### ❌ 間違い2：手動で作ろうとする
```
USER_IDは自動生成のみ。手動では作れません。
```

### ❌ 間違い3：メールのリンクから探す
```
メール配信のアラートにはRSS URLは含まれません。
必ず「RSSフィード」配信を選択。
```

## 📝 SCF V5での保存方法

```javascript
// 初回設定時に保存
const firstAlertUrl = "https://www.google.com/alerts/feeds/04829374659283746592/17364859273645982736";
const userId = firstAlertUrl.split('/')[5]; // "04829374659283746592"

// LocalStorageに保存
localStorage.setItem('google-alert-user-id', userId);

// 以降は再利用
const savedUserId = localStorage.getItem('google-alert-user-id');
const newAlertId = "99999999999999999999";
const newAlertUrl = `https://www.google.com/alerts/feeds/${savedUserId}/${newAlertId}`;
```

## 🎯 まとめ

1. **USER_IDは画面に表示されない**
2. **RSS URLからのみ取得可能**
3. **一度取得すれば全アラートで同じ**
4. **必ず「RSSフィード」配信を選択**

これで、USER_IDの場所と取得方法が明確になりました！