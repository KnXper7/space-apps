import time
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('PAGEERR',e))
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); pg.wait_for_function('window.__play && window.__play.S'); time.sleep(1)
    P='window.__play'; ev=pg.evaluate
    ev(f"{P}.time.delayedCall(100,()=>{{window.__x=1}})"); time.sleep(.6); print('plain timer',ev("window.__x"))
    ev(f"{P}.useTool('bag')"); ev(f"{P}.tapRoom('A')")
    for i in range(5): ev(f"{P}.digTap()")
    print('events',ev(f"{P}.time._active.length"), ev(f"{P}.time._pendingInsertion.length"), 'paused',ev(f"{P}.time.paused"))
    time.sleep(1.5); print(ev(f"JSON.stringify({P}.dig)"), ev(f"JSON.stringify({P}.S.rooms.map(r=>r.bags))"))
    print('digObjs hit', ev(f"!!{P}.digObjs"))
    b.close()
