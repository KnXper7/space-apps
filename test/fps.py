import time
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720})
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); time.sleep(3)
    print('fps',pg.evaluate("window.__game.loop.actualFps"), 'renderer',pg.evaluate("window.__game.renderer.type"))
    t0=pg.evaluate("window.__play.time.now"); time.sleep(2); print('game ms in 2s real:',pg.evaluate("window.__play.time.now")-t0)
    b.close()
