#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RSSフィード統合スクリプト
- 複数のJSONファイルから重複を排除してマスターリストを作成
- URLベースで重複排除を実行
- 05_rss-reader互換の形式で出力
"""

import json
import os
from typing import List, Dict, Set

def load_json_file(file_path: str) -> Dict:
    """JSONファイルを読み込む"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return {}

def extract_feeds_from_hierarchical(data: Dict) -> List[Dict]:
    """階層構造のJSONからフィードを抽出"""
    feeds = []
    
    if 'feeds' in data:
        for category_data in data['feeds']:
            category = category_data.get('category', '')
            
            # feedsキー内のアイテムを処理
            if 'feeds' in category_data:
                for feed in category_data['feeds']:
                    feeds.append({
                        'name': feed.get('name', ''),
                        'url': feed.get('url', ''),
                        'category': category
                    })
    
    return feeds

def extract_feeds_from_export_format(data: Dict) -> List[Dict]:
    """エクスポート形式のJSONからフィードを抽出"""
    feeds = []
    
    if 'feeds' in data:
        for feed in data['feeds']:
            feeds.append({
                'name': feed.get('name', ''),
                'url': feed.get('url', ''),
                'category': feed.get('category', '')
            })
    
    return feeds

def extract_feeds_from_working_format(data: Dict) -> List[Dict]:
    """working形式のJSONからフィードを抽出"""
    feeds = []
    
    if 'workingFeeds' in data:
        for feed in data['workingFeeds']:
            feeds.append({
                'name': feed.get('name', ''),
                'url': feed.get('url', ''),
                'category': feed.get('category', '')
            })
    
    return feeds

def clean_url(url: str) -> str:
    """URLを正規化（末尾のスラッシュや#を削除）"""
    url = url.strip().rstrip('/')
    # アンカーやクエリパラメータの一部を除去（ただし、RSSに必要なパラメータは保持）
    if url.endswith('#'):
        url = url[:-1]
    return url

def consolidate_feeds(folder_path: str) -> List[Dict]:
    """フォルダ内の全JSONファイルからフィードを統合"""
    all_feeds = []
    url_seen = set()
    
    json_files = [
        'rss-feeds-additional.json',
        'rss-feeds-china-ai.json', 
        'rss-feeds-detailed-2025-08-17 (1).json',
        'rss-feeds-detailed-2025-08-17.json',
        'rss-feeds-detailed-2025-08-18 (1).json',
        'rss-feeds-detailed-2025-08-18.json',
        'rss-feeds-detailed-2025-08-18のコピー.json',
        'working-rss-feeds.json'
    ]
    
    for filename in json_files:
        file_path = os.path.join(folder_path, filename)
        if not os.path.exists(file_path):
            print(f"ファイルが見つかりません: {filename}")
            continue
            
        print(f"処理中: {filename}")
        data = load_json_file(file_path)
        
        if not data:
            continue
        
        # ファイル形式を判定して適切な抽出関数を選択
        feeds = []
        
        if 'feeds' in data and isinstance(data['feeds'], list):
            # 階層構造かエクスポート形式かを判定
            if data['feeds'] and 'feeds' in data['feeds'][0]:
                # 階層構造（rss-feeds-additional.json形式）
                feeds = extract_feeds_from_hierarchical(data)
            else:
                # エクスポート形式（detailed形式）
                feeds = extract_feeds_from_export_format(data)
        elif 'workingFeeds' in data:
            # working形式
            feeds = extract_feeds_from_working_format(data)
        else:
            print(f"未知の形式: {filename}")
            continue
        
        # 重複排除しながら追加
        for feed in feeds:
            url = clean_url(feed.get('url', ''))
            name = feed.get('name', '').strip()
            category = feed.get('category', '').strip()
            
            # 必須フィールドチェック
            if not url or not name:
                continue
                
            # URL重複チェック
            if url in url_seen:
                print(f"重複スキップ: {name} ({url})")
                continue
                
            url_seen.add(url)
            all_feeds.append({
                'name': name,
                'url': url,
                'category': category if category else 'その他'
            })
            
        print(f"{filename} から {len(feeds)} 件のフィードを処理しました")
    
    return all_feeds

def main():
    folder_path = "/Users/saitoyutaka/smart-content-factory-v5/選択項目から作成したフォルダ"
    
    print("RSSフィード統合処理を開始します...")
    consolidated_feeds = consolidate_feeds(folder_path)
    
    print(f"\n統合結果:")
    print(f"- 総フィード数: {len(consolidated_feeds)}")
    
    # カテゴリ別統計
    categories = {}
    for feed in consolidated_feeds:
        cat = feed['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"- カテゴリ別内訳:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}件")
    
    # マスターファイルに保存
    output_path = os.path.join(folder_path, "rss-feeds-master.json")
    
    # ソート（カテゴリ順、その後名前順）
    consolidated_feeds.sort(key=lambda x: (x['category'], x['name']))
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(consolidated_feeds, f, ensure_ascii=False, indent=2)
    
    print(f"\nマスターファイルを作成しました: {output_path}")
    print("統合処理完了！")

if __name__ == "__main__":
    main()