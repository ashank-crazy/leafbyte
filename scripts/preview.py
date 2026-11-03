"""Local preview with explicit no-store responses for repeatable cold-load checks."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4328)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory='.'))
    print(f'LeafByte preview: http://127.0.0.1:{args.port}/dist/', flush=True)
    server.serve_forever()
