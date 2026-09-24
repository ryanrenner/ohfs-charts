"""Local preview: python3 preview/serve.py, then open http://localhost:8000/sagewood.php
Any /<slug>.php path renders a fake page with the shared snippet, using the local
config and data/ in this repo (not jsDelivr)."""
import http.server, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = """<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/preview/theme.css"><script src="/preview/chart.umd.min.js"></script></head>
<body><div class="block block--lightest block--basic"><div class="container"><section class="main clear">
<p>Existing page content above the component: {path}</p>
{snippet}
<p>Existing page content below the component.</p>
</section></div></div></body></html>"""
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def do_GET(self):
        if self.path.split('?')[0].endswith('.php'):
            snip = open(os.path.join(ROOT, 'snippets', 'market-dashboard.html')).read()
            snip = re.sub(r'src="https://cdn\.jsdelivr\.net/[^"]+"', 'src="/ohfs-chart-config.js"', snip)
            body = PAGE.format(path=self.path, snippet=snip).encode()
            self.send_response(200); self.send_header('Content-Type', 'text/html'); self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()
http.server.ThreadingHTTPServer(('', 8000), H).serve_forever()
