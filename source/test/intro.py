import sys; sys.argv=['x']
exec(open('test/play.py').read().split("def run(")[0])
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720}); PG[0]=pg
    pg.on('pageerror',lambda e:print('PAGEERR',str(e)[:300]))
    pg.goto('http://localhost:4173/'); waitf('window.__game && window.__game.scene.isActive("Title")'); sl(1)
    pg.evaluate("window.__game.scene.start('Intro')"); sl(1.5)
    pg.screenshot(path='test/shots/i0.png')
    print('nav shown:',not pg.evaluate("document.getElementById('intro-nav').hidden"), pg.evaluate("document.getElementById('intro-next').textContent"))
    for k in range(3):
        pg.click('#intro-next'); sl(1.5); pg.screenshot(path=f'test/shots/i{k+1}.png')
    print('last label:',pg.evaluate("document.getElementById('intro-next').textContent"))
    pg.click('#intro-next'); sl(1.5); waitf('window.__game.scene.isActive("Play")'); print('now in Play; nav hidden:',pg.evaluate("document.getElementById('intro-nav').hidden"))
    sl(1.5); pg.screenshot(path='test/shots/p1.png')
    pg.evaluate("window.__play.refresh()"); sl(.5)
    # idle hint
    sl(9); pg.screenshot(path='test/shots/p2-idle.png')
    print('helpOn',pg.evaluate("window.__play.helpOn"))
    b.close()
