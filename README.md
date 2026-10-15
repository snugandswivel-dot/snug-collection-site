# The Snug Collection — website

Static site for thesnugcollection.com, hosted on Cloudflare Pages.

## Build

    python3 build.py            # production build into dist/ (uses config.json)
    python3 build.py --local    # same, with URLs pointing at http://localhost:8765
    python3 serve.py            # local server with the same headers and 404 handling as Pages

Cloudflare Pages settings: build command `python3 build.py`, output directory `dist`.
Every push to `main` redeploys.

## Where things live

- `config.json` — domain, email, brand, legal name, form endpoints, analytics token. Change these here, not in the pages.
- `src/` — pages (`index.html`, `collection/`, `privacy/`, `terms/`, `404.html`) and shared partials.
- `src/assets/` — CSS, JS, the 3D viewer (three.js r128, self-hosted), fonts (OFL), images.
- `build.py` — fills partials and tokens, hashes asset names, writes `_headers` (CSP, HSTS), `robots.txt`, `sitemap.xml`, `site.webmanifest`, and fails the build on unresolved tokens or missing assets.
- `qa.py` — Playwright checks (forms, 3D, layout width, legal pages, 404). Needs `serve.py` running.

## When the LLC is formed

Update `legal_name` and `legal_line` in `config.json`, review `src/privacy/` and `src/terms/`, push.
