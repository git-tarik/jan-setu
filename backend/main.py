"""
Main Server Entry Point (Python).
Starts the modular HTTP server and initializes the SQLite database.
"""
import http.server
import socketserver
import json
import sys
import io

# Fix Windows cp1252 console encoding - allow emoji/unicode in print statements
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from backend.config import PORT, HOST
from backend.database import init_db
from backend.router import handle_request

class ModularHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

class ModularRequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_response_json(self, status_code: int, data: dict):
        response_bytes = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Connection", "close")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(response_bytes)
        self.wfile.flush()
        self.close_connection = True

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Connection", "close")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.close_connection = True

    def do_GET(self):
        status, result = handle_request("GET", self.path)
        self._send_response_json(status, result)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = None
        if content_length > 0:
            raw_body = self.rfile.read(content_length).decode("utf-8")
            try:
                body = json.loads(raw_body)
            except json.JSONDecodeError:
                body = {}
        status, result = handle_request("POST", self.path, body)
        self._send_response_json(status, result)

    def log_message(self, format, *args):
        sys.stderr.write(f"[Python Modular Backend] {format % args}\n")

def run_server():
    init_db()
    server_address = (HOST, PORT)
    httpd = ModularHTTPServer(server_address, ModularRequestHandler)
    print(f"[Python Backend] Running on http://{HOST}:{PORT}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Python backend...", flush=True)
        httpd.server_close()

if __name__ == "__main__":
    run_server()
