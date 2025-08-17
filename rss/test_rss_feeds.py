#!/usr/bin/env python3
"""
AI関連RSSフィードの検証スクリプト
実際に動作するフィードのみを抽出
"""
import json
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
import time

# テストするRSSフィード一覧
rss_feeds = {
    "research_organizations": [
        {"name": "OpenAI Blog", "url": "https://openai.com/blog/rss.xml", "category": "AI研究機関"},
        {"name": "Google AI Blog", "url": "https://blog.google/technology/ai/rss/", "category": "AI研究機関"},
        {"name": "DeepMind Blog", "url": "https://deepmind.com/blog/feed/basic/", "category": "AI研究機関"},
        {"name": "Anthropic News", "url": "https://www.anthropic.com/rss.xml", "category": "AI研究機関"},
        {"name": "Meta AI Blog", "url": "https://ai.meta.com/blog/rss/", "category": "AI研究機関"},
        {"name": "Microsoft AI Blog", "url": "https://blogs.microsoft.com/ai/feed/", "category": "AI研究機関"},
    ],
    "academic_sources": [
        {"name": "arXiv AI", "url": "http://arxiv.org/rss/cs.AI", "category": "学術論文"},
        {"name": "arXiv Machine Learning", "url": "http://arxiv.org/rss/cs.LG", "category": "学術論文"},
        {"name": "arXiv Neural Computing", "url": "http://arxiv.org/rss/cs.NE", "category": "学術論文"},
        {"name": "MIT CSAIL News", "url": "https://www.csail.mit.edu/rss.xml", "category": "大学研究機関"},
        {"name": "Stanford HAI", "url": "https://hai.stanford.edu/rss.xml", "category": "大学研究機関"},
    ],
    "japanese_sources": [
        {"name": "理化学研究所 AIP", "url": "https://aip.riken.jp/feed/", "category": "日本のAI研究"},
        {"name": "産総研 AIRC", "url": "https://www.airc.aist.go.jp/feed/", "category": "日本のAI研究"},
        {"name": "Preferred Networks", "url": "https://tech.preferred.jp/ja/blog/feed/", "category": "日本のAI企業"},
        {"name": "Ledge.ai", "url": "https://ledge.ai/rss/", "category": "日本のAIメディア"},
        {"name": "AI-SCHOLAR", "url": "https://ai-scholar.tech/feed/", "category": "日本のAIメディア"},
    ],
    "ai_companies": [
        {"name": "NVIDIA AI Blog", "url": "https://blogs.nvidia.com/ai-podcast/feed/", "category": "AI企業"},
        {"name": "Hugging Face Blog", "url": "https://huggingface.co/blog/feed.xml", "category": "AI企業"},
        {"name": "Stability AI", "url": "https://stability.ai/feed", "category": "AI企業"},
        {"name": "Cohere Blog", "url": "https://cohere.com/blog/rss", "category": "AI企業"},
        {"name": "Midjourney", "url": "https://www.midjourney.com/feed", "category": "AI企業"},
    ],
    "developer_platforms": [
        {"name": "GitHub AI", "url": "https://github.blog/category/ai/feed/", "category": "開発プラットフォーム"},
        {"name": "AWS ML Blog", "url": "https://aws.amazon.com/blogs/machine-learning/feed/", "category": "クラウドAI"},
        {"name": "Google Cloud AI", "url": "https://cloud.google.com/feeds/google-cloud-ai-ml-release-notes.xml", "category": "クラウドAI"},
        {"name": "Azure AI Blog", "url": "https://techcommunity.microsoft.com/gxcuf89792/rss/board?board.id=AIBlog", "category": "クラウドAI"},
    ]
}

def test_rss_feed(url, timeout=5):
    """RSSフィードをテスト"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        
        if response.status_code == 200:
            # XMLパースを試す
            try:
                root = ET.fromstring(response.content)
                # RSS or Atomフィードかチェック
                if 'rss' in root.tag or 'feed' in root.tag or root.find('.//item') is not None or root.find('.//entry') is not None:
                    # アイテム数を数える
                    items = root.findall('.//item') or root.findall('.//entry')
                    return True, f"OK ({len(items)} items)", response.url
                else:
                    return False, "Not valid RSS/Atom", response.url
            except:
                # JSONフィードの可能性をチェック
                if 'application/json' in response.headers.get('content-type', ''):
                    try:
                        data = response.json()
                        if 'items' in data or 'feed' in data:
                            return True, "OK (JSON feed)", response.url
                    except:
                        pass
                return False, "Parse error", response.url
        else:
            return False, f"HTTP {response.status_code}", response.url
            
    except requests.Timeout:
        return False, "Timeout", url
    except requests.ConnectionError:
        return False, "Connection error", url
    except Exception as e:
        return False, str(e)[:30], url

def main():
    """メイン処理"""
    print("AI関連RSSフィードの検証を開始...")
    print("=" * 60)
    
    working_feeds = []
    failed_feeds = []
    
    for category, feeds in rss_feeds.items():
        print(f"\n【{category}】")
        for feed in feeds:
            print(f"  Testing: {feed['name']}...", end=" ")
            success, message, actual_url = test_rss_feed(feed['url'])
            
            if success:
                print(f"✅ {message}")
                # 実際のURLに更新（リダイレクト対応）
                feed['url'] = actual_url
                feed['status'] = 'active'
                feed['last_checked'] = datetime.now().isoformat()
                working_feeds.append(feed)
            else:
                print(f"❌ {message}")
                feed['status'] = 'error'
                feed['error'] = message
                failed_feeds.append(feed)
            
            time.sleep(0.5)  # サーバー負荷軽減
    
    # 結果をJSON形式で保存
    result = {
        "metadata": {
            "total_tested": len(working_feeds) + len(failed_feeds),
            "working": len(working_feeds),
            "failed": len(failed_feeds),
            "test_date": datetime.now().isoformat(),
            "categories": list(rss_feeds.keys())
        },
        "feeds": {
            "category": "AI・機械学習",
            "feeds": working_feeds
        }
    }
    
    # 動作するフィードのみを保存
    output_file = "/Users/saitoyutaka/smart-content-factory-v5/rss/ai_rss_feeds_verified.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n" + "=" * 60)
    print(f"検証完了！")
    print(f"✅ 動作: {len(working_feeds)}個")
    print(f"❌ エラー: {len(failed_feeds)}個")
    print(f"結果を保存: {output_file}")
    
    # インポート用の簡易フォーマットも作成
    import_file = "/Users/saitoyutaka/smart-content-factory-v5/rss/ai_rss_import.txt"
    with open(import_file, 'w', encoding='utf-8') as f:
        for feed in working_feeds:
            f.write(f"{feed['name']}|{feed['url']}|{feed['category']}\n")
    print(f"インポート用ファイル: {import_file}")

if __name__ == "__main__":
    main()