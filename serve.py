"""Local stand-in for Cloudflare Pages: serves dist/, applies the /* and /assets/* blocks of _headers, and serves 404.html."""
import http.server, pathlib, sys, functools
ROOT = pathlib.Path(__file__).parent.resolve() / 'dist'

def parse_headers():
    rules, cur = [], None
    for line in (ROOT / '_headers').read_text().splitlines():
        if not line.strip():
            continue
        if not line.startswith((' ', '\t')):
            cur = (line.strip(), []); rules.append(cur)
        else:
            k, v = line.strip().split(':', 1); cur[1].append((k.strip(), v.strip()))
    return rules
RULES = parse_headers()

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        path = self.path.split('?')[0]
        for pat, hs in RULES:
            if pat == '/*' or (pat.endswith('/*') and pat.startswith('/') and path.startswith(pat[:-1])):
                for k, v in hs:
                    if k == 'Strict-Transport-Security':
                        continue
                    self.send_header(k, v)
        super().end_headers()
    def send_error(self, code, message=None, explain=None):
        if code == 404 and (ROOT / '404.html').exists():
            body = (ROOT / '404.html').read_bytes()
            self.send_response(404); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
            return
        super().send_error(code, message, explain)
    def log_message(self, *a):
        pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=str(ROOT))).serve_forever()
