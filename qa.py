"""Browser QA for the built site. Requires serve.py running on :8765."""
import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright
OUT = pathlib.Path(__file__).parent.resolve() / 'work' / 'qa'; OUT.mkdir(parents=True, exist_ok=True)
BASE = 'http://localhost:8765'
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        report = {}
        async def page(vp, scheme='light', rm='no-preference'):
            ctx = await b.new_context(viewport=vp, color_scheme=scheme, device_scale_factor=1, reduced_motion=rm)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
            pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
            posted = []
            async def fake(route):
                posted.append(json.loads(route.request.post_data or '{}'))
                await route.fulfill(status=200, content_type='application/json', body='{"ok":true}', headers={'Access-Control-Allow-Origin': '*'})
            await pg.route('https://contentos.app.n8n.cloud/**', fake)
            return ctx, pg, errs, posted

        # --- home, desktop
        ctx, pg, errs, posted = await page({'width': 1440, 'height': 900})
        await pg.goto(BASE + '/', wait_until='load'); await pg.mouse.move(700, 400); await pg.wait_for_timeout(4000)  # a mouse move is the desktop wake signal for the 3D
        await pg.screenshot(path=str(OUT / 'home-desk-top.png'))
        r = {'gl': await pg.evaluate('!!document.querySelector("#c.on")'), 'sw': await pg.evaluate('document.documentElement.scrollWidth')}
        await pg.click('[data-look="holly"]'); await pg.wait_for_timeout(1300)
        await pg.screenshot(path=str(OUT / 'home-desk-holly.png'))
        for y in range(0, 7000, 600):
            await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(110)
        await pg.evaluate('document.querySelector("#next").scrollIntoView()'); await pg.wait_for_timeout(900)
        await pg.screenshot(path=str(OUT / 'home-desk-next.png'))
        await pg.click('#submit'); await pg.wait_for_timeout(250)
        r['invalid_blocked'] = await pg.evaluate('document.querySelectorAll("[aria-invalid=true]").length')
        await pg.screenshot(path=str(OUT / 'home-desk-invalid.png'))
        await pg.fill('#email', 'qa@example.com'); await pg.click('label[for=n3]'); await pg.click('#submit'); await pg.wait_for_timeout(1500)
        r['ok'] = await pg.evaluate('document.querySelector("#ok").classList.contains("on")')
        r['share'] = await pg.evaluate('document.querySelector("#sharelink").textContent')
        r['pin'] = await pg.evaluate('document.querySelector("#pinBtn").href')
        await pg.screenshot(path=str(OUT / 'home-desk-done.png'))
        await pg.click('#faqwrap details:nth-of-type(2) summary'); await pg.wait_for_timeout(700)
        await pg.evaluate('document.querySelector("#faq").scrollIntoView()'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=str(OUT / 'home-desk-faq.png'))
        await pg.click('#contactBtn'); await pg.fill('#cemail', 'qa@example.com'); await pg.fill('#cmsg', 'hello from qa'); await pg.click('#csubmit'); await pg.wait_for_timeout(700)
        r['contact'] = await pg.evaluate('document.querySelector("#cstatus").textContent')
        await pg.evaluate('window.scrollTo(0,document.body.scrollHeight)'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=str(OUT / 'home-desk-footer.png'))
        r['posted'] = posted; r['errors'] = errs; report['home_desk'] = r; await ctx.close()

        # --- home, phone dark, query preselect
        ctx, pg, errs, posted = await page({'width': 390, 'height': 844}, 'dark')
        await pg.goto(BASE + '/?next=kitty&ref=abc123#waitlist', wait_until='load'); await pg.wait_for_timeout(2500)
        r = {'next_checked': await pg.evaluate('document.querySelector("#n1").checked'), 'sw': await pg.evaluate('document.documentElement.scrollWidth')}
        await pg.screenshot(path=str(OUT / 'home-phone-waitlist.png'))
        await pg.evaluate('window.scrollTo(0,0)'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=str(OUT / 'home-phone-top.png'))
        await pg.screenshot(path=str(OUT / 'home-phone-full.png'), full_page=True)
        r['errors'] = errs; report['home_phone'] = r; await ctx.close()

        # --- collection, desktop
        ctx, pg, errs, posted = await page({'width': 1440, 'height': 900})
        await pg.goto(BASE + '/collection/#kitty', wait_until='load'); await pg.wait_for_timeout(4500)
        r = {'name': await pg.evaluate('document.querySelector("#look .name").textContent'), 'gl': await pg.evaluate('!!document.querySelector("#c.on")'), 'sw': await pg.evaluate('document.documentElement.scrollWidth')}
        await pg.screenshot(path=str(OUT / 'coll-desk-kitty.png'))
        await pg.click('#next'); await pg.wait_for_timeout(1200)
        await pg.click('[data-mode="kit"]'); await pg.wait_for_timeout(1400)
        await pg.click('[data-ring="match"]'); await pg.wait_for_timeout(800)
        r['hash'] = await pg.evaluate('location.hash')
        await pg.screenshot(path=str(OUT / 'coll-desk-butter-kit.png'))
        await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=str(OUT / 'coll-desk-pearl-kit.png'))
        r['errors'] = errs; report['coll_desk'] = r; await ctx.close()

        # --- collection, phone
        ctx, pg, errs, posted = await page({'width': 390, 'height': 844})
        await pg.goto(BASE + '/collection/', wait_until='load'); await pg.wait_for_timeout(3500)
        await pg.screenshot(path=str(OUT / 'coll-phone.png'))
        await pg.evaluate('document.querySelector("#rail").scrollTo({left:document.querySelectorAll(".lk")[3].offsetLeft-60})'); await pg.wait_for_timeout(1600)
        r = {'after_swipe': await pg.evaluate('document.querySelector("#look .name").textContent'), 'sw': await pg.evaluate('document.documentElement.scrollWidth')}
        await pg.screenshot(path=str(OUT / 'coll-phone-swipe.png'))
        await pg.screenshot(path=str(OUT / 'coll-phone-full.png'), full_page=True)
        r['errors'] = errs; report['coll_phone'] = r; await ctx.close()

        # --- legal + 404
        ctx, pg, errs, posted = await page({'width': 1280, 'height': 900})
        for path, name in [('/privacy/', 'privacy'), ('/terms/', 'terms'), ('/nope-xyz', '404')]:
            resp = await pg.goto(BASE + path, wait_until='load'); await pg.wait_for_timeout(500)
            report[name] = {'status': resp.status, 'title': await pg.title()}
            await pg.screenshot(path=str(OUT / f'{name}.png'))
        report['legal_errors'] = errs; await ctx.close()

        # --- reduced motion sanity
        ctx, pg, errs, posted = await page({'width': 1280, 'height': 800}, rm='reduce')
        await pg.goto(BASE + '/', wait_until='load'); await pg.wait_for_timeout(2500)
        await pg.evaluate('window.scrollTo(0,1600)'); await pg.wait_for_timeout(400)
        report['reduced'] = {'hidden_rv': await pg.evaluate('[...document.querySelectorAll(".rv")].filter(e=>getComputedStyle(e).opacity==="0").length'), 'errors': errs}
        await ctx.close()
        await b.close()
        print(json.dumps(report, indent=1)[:6000])

asyncio.run(run())
