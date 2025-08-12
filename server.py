#!/usr/bin/env python3
"""
Smart StockBot Server
A simple HTTP server to serve the shopping cart application
"""

import http.server
import socketserver
import os
import mimetypes

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # If accessing root directory, serve index.html
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        
        # Call the parent class method to serve the file
        return super().do_GET()

if __name__ == "__main__":
    PORT = 8000
    Handler = CustomHandler
    
    print(f"Starting server at http://localhost:{PORT}")
    print("Automatically serving index.html for root requests")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()
