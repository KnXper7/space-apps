exec(open('test/play.py').read().split("def run(")[0])
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    for (w,h,n) in [(1280,720,'d'),(844,390,'ph'),(390,844,'pt')]:
        pg=b.new_page(viewport={'width':w,'height':h}); PG[0]=pg
        pg.on('pageerror',lambda e:print('PAGEERR',str(e)[:200]))
        pg.goto('http://localhost:4173/'); waitf('window.__game && window.__game.scene.isActive("Title")'); sl(2.5)
        pg.screenshot(path=f'test/shots/ui-{n}-title.png')
        pg.evaluate("window.__game.scene.start('Play')"); waitf('window.__play && window.__play.S'); sl(2.5)
        pg.screenshot(path=f'test/shots/ui-{n}-play.png')
        pg.evaluate("window.openHowTo && 0")
        pg.mouse.click(w-int(24*w/1280)-6, int(98*h/720)) if n=='d' else None
        sl(.6); pg.screenshot(path=f'test/shots/ui-{n}-howto.png')
        print(n,'overlay shown',not pg.evaluate("document.getElementById('overlay').hidden"))
        pg.close()
    b.close()
