import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Change to the actual directory
os.chdir(r"C:\Users\Usuario\ickp\actual")

port = 8080
server = HTTPServer(('', port), SimpleHTTPRequestHandler)
print(f"Serving from {os.getcwd()} on port {port}")
server.serve_forever()