"""Build the The Snug Collection static site.

python3 build.py            -> dist/ and the-snug-collection-site.zip using config.json
python3 build.py --local    -> same, but absolute URLs point at http://localhost:8765 (for testing)

Everything business-specific (domain, email, legal name, endpoints) lives in config.json.
When the LLC is formed, change legal_name and legal_line there and rebuild.
"""
import hashlib, html, json, pathlib, re, shutil, sys, zipfile

ROOT = pathlib.Path(__file__).parent.resolve()
SRC, DIST = ROOT / 'src', ROOT / 'dist'
cfg = json.loads((ROOT / 'config.json').read_text())
LOCAL = '--local' in sys.argv
ORIGIN = 'http://localhost:8765' if LOCAL else 'https://' + cfg['domain']

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

# ---------- assets: hash names so they can be cached for a year ----------
amap = {}  # 'img/kit-blush.webp' -> '/assets/img/kit-blush.1a2b3c4d.webp'

def token_sub(text):
    def rep(m):
        key = m.group(1)
        if key not in amap:
            raise SystemExit('unknown asset token: ' + key)
        return amap[key]
    text = re.sub(r'\{\{A:([^}]+)\}\}', rep, text)
    for k, v in tokens().items():
        text = text.replace('{{%s}}' % k, v)
    return text

def tokens():
    return {
        'ORIGIN': ORIGIN, 'DOMAIN': cfg['domain'], 'EMAIL': cfg['email'], 'BRAND_HTML': html.escape(cfg['brand']),
        'LEGAL_NAME': html.escape(cfg['legal_name']), 'LEGAL_LINE': html.escape(cfg['legal_line']),
        'UPDATED': cfg['updated'], 'YEAR': cfg['year'],
        'WAITLIST': cfg['waitlist_endpoint'], 'CONTACT': cfg['contact_endpoint'],
        'ANALYTICS_LINE': ('We use Cloudflare Web Analytics to count page views. It does not use cookies and, according to Cloudflare, does not collect visitors\u2019 personal data.'
                           if cfg.get('analytics_token') else 'We don\u2019t run any analytics right now. If we add Cloudflare Web Analytics to count page views, we\u2019ll say so here; it does not use cookies.'),
        'ANALYTICS_PROVIDER': ', and privacy-friendly page-view counts' if cfg.get('analytics_token') else '',
    }

def emit_asset(rel, data):
    p = pathlib.PurePosixPath(rel)
    h = hashlib.sha256(data).hexdigest()[:10]
    out = p.parent / ('%s.%s%s' % (p.stem, h, p.suffix))
    dest = DIST / 'assets' / out
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    amap[rel] = '/assets/' + str(out)

assets = SRC / 'assets'
binary_first = [p for p in sorted(assets.rglob('*')) if p.is_file() and p.suffix in ('.woff2', '.webp', '.png', '.jpg', '.svg')]
for p in binary_first:
    emit_asset(str(p.relative_to(assets)), p.read_bytes())
# plain copies (licenses) keep their names
for p in assets.rglob('*.txt'):
    d = DIST / 'assets' / p.relative_to(assets); d.parent.mkdir(parents=True, exist_ok=True); shutil.copy(p, d)
# text assets in dependency order
for rel in ['three.min.js', 'viewer.js', 'site.css', 'site.js', 'main.js', 'collection.js']:
    p = assets / rel
    if p.exists():
        emit_asset(rel, token_sub(p.read_text()).encode())

# ---------- shared partials ----------
partials = {}
for p in (SRC / '_partials').glob('*.html'):
    partials[p.stem.upper()] = p.read_text()

analytics = ''
if cfg.get('analytics_token'):
    analytics = ('<script defer src="https://static.cloudflareinsights.com/beacon.min.js" '
                 'data-cf-beacon=\'{"token": "%s"}\'></script>' % cfg['analytics_token'])

css_inline = (DIST / amap['site.css'].lstrip('/')).read_text()

def render_page(text):
    for _ in range(2):  # partials may contain tokens
        for k, v in partials.items():
            text = text.replace('{{%s}}' % k, v)
    text = text.replace('{{ANALYTICS}}', analytics).replace('{{CSS_INLINE}}', css_inline)
    return token_sub(text)

pages = []
for p in sorted(SRC.rglob('*.html')):
    rel = p.relative_to(SRC)
    if rel.parts[0] in ('_partials', 'assets'):
        continue
    out = DIST / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render_page(p.read_text()))
    pages.append(rel)

# lab (unlinked test pages); binary model files copied as-is
lab = SRC / 'lab'
if lab.exists():
    for f in lab.rglob('*'):
        if f.is_file() and f.suffix != '.html':
            d = DIST / f.relative_to(SRC); d.parent.mkdir(parents=True, exist_ok=True); shutil.copy(f, d)
# root files
for name in ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-512.png', 'og.jpg', 'og-collection.jpg']:
    if (SRC / name).exists():
        shutil.copy(SRC / name, DIST / name)

(DIST / 'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: %s/sitemap.xml\n' % ORIGIN)
urls = [('/', '1.0'), ('/collection/', '0.8'), ('/privacy/', '0.3'), ('/terms/', '0.3')]
(DIST / 'sitemap.xml').write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ''.join('  <url><loc>%s%s</loc><lastmod>2026-10-15</lastmod><priority>%s</priority></url>\n' % (ORIGIN, u, pr) for u, pr in urls) +
    '</urlset>\n')
(DIST / 'site.webmanifest').write_text(json.dumps({
    'name': cfg['brand'], 'short_name': cfg['brand'], 'start_url': '/', 'display': 'browser',
    'background_color': '#F6F0EA', 'theme_color': '#F6F0EA',
    'icons': [{'src': '/apple-touch-icon.png', 'sizes': '180x180', 'type': 'image/png'},
              {'src': '/icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}, indent=2))

endpoint_origin = re.match(r'https://[^/]+', cfg['waitlist_endpoint']).group(0)
csp = ("default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; "
       "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; "
       "connect-src 'self' %s https://cloudflareinsights.com; form-action 'self' %s; frame-src %s; "
       "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests") % ((endpoint_origin,) * 3)
(DIST / '_headers').write_text(
    '/*\n'
    '  Strict-Transport-Security: max-age=31536000\n'
    '  X-Content-Type-Options: nosniff\n'
    '  X-Frame-Options: DENY\n'
    '  Referrer-Policy: strict-origin-when-cross-origin\n'
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n'
    '  Content-Security-Policy: %s\n'
    '\n/assets/*\n'
    '  Cache-Control: public, max-age=31536000, immutable\n'
    '\n/lab/*\n'
    '  X-Robots-Tag: noindex\n'
    '\n/lab/ar/*.usdz\n'
    '  Content-Type: model/vnd.usdz+zip\n'
    '\n/lab/ar/*.glb\n'
    '  Content-Type: model/gltf-binary\n'
    '\nhttps://:project.pages.dev/*\n'
    '  X-Robots-Tag: noindex\n'
    '\nhttps://:version.:project.pages.dev/*\n'
    '  X-Robots-Tag: noindex\n' % csp)

# short links for places a link can't be tapped (typed from a video, scanned from paper); each tags its channel
SHORT = {'tiktok': 'utm_source=tiktok&utm_medium=social', 'flyer': 'utm_source=flyer&utm_medium=print'}
(DIST / '_redirects').write_text(''.join('/%s /?%s 302\n/%s/ /?%s 302\n' % (k, v, k, v) for k, v in SHORT.items()))

# ---------- checks ----------
problems = []
for f in DIST.rglob('*'):
    if f.is_file() and f.suffix in ('.html', '.css', '.js', '.txt', '.xml', '.webmanifest'):
        t = f.read_text(errors='ignore')
        if f.name != 'three.min.js' and re.search(r'\{\{[A-Z_]+(:[^}]*)?\}\}', t):
            problems.append('unresolved token in %s' % f.relative_to(DIST))
        for ref in re.findall(r'["\'(](/assets/[^"\')\s]+)', t):
            if not (DIST / ref.lstrip('/')).exists():
                problems.append('missing %s referenced in %s' % (ref, f.relative_to(DIST)))
if problems:
    print('\n'.join(problems)); raise SystemExit(1)

zp = ROOT / 'the-snug-collection-site.zip'
if not LOCAL:
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DIST.rglob('*')):
            if f.is_file():
                z.write(f, f.relative_to(DIST))
total = sum(f.stat().st_size for f in DIST.rglob('*') if f.is_file())
print('built %d pages, %d files, %.0f KB total%s' % (len(pages), sum(1 for f in DIST.rglob('*') if f.is_file()), total / 1024, '' if LOCAL else ', zip %.0f KB' % (zp.stat().st_size / 1024)))
print('origin:', ORIGIN)
