import os
import sys
os.chdir(r"C:\Users\Usuario\ickp\actual")
print(f"Serving from: {os.getcwd()}")
import http.server
import socketserver

PORT = 9999
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    httpd.serve_forever()