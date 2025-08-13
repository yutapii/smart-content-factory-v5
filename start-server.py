#!/usr/bin/env python3
"""
SCF V5 ローカルサーバー起動スクリプト
CORS問題を回避するための簡易HTTPサーバー
"""

import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # CORSヘッダーを追加
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    
    print(f"🚀 SCF V5 サーバー起動中...")
    print(f"📁 ディレクトリ: {DIRECTORY}")
    print(f"🌐 URL: http://localhost:{PORT}")
    print(f"📡 RSS Sources: http://localhost:{PORT}/rss-sources/")
    print(f"📋 RSS Reader: http://localhost:{PORT}/rss-reader/")
    print(f"\n終了するには Ctrl+C を押してください\n")
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 サーバーを停止しました")
        sys.exit(0)
    except Exception as e:
        print(f"❌ エラー: {e}")
        sys.exit(1)