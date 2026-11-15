import time
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('PAGEERR',e))
    pg.on('response',lambda r:print('404',r.url) if r.status==404 else None)
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); pg.wait_for_function('window.__play && window.__play.S'); time.sleep(1)
    P='window.__play'; ev=pg.evaluate
    ev(f"{P}.useTool('bag')"); ev(f"{P}.tapRoom('A')")
    for i in range(5):
        print(i, ev(f"(()=>{{try{{{P}.digTap();}}catch(e){{return 'ERR '+e.message+' '+e.stack.slice(0,300)}} return JSON.stringify({P}.dig)}})()")); time.sleep(.3)
    time.sleep(1.5); print(ev(f"JSON.stringify({P}.S.rooms.map(r=>r.bags))"), ev(f"{P}.S.power"), ev(f"JSON.stringify({P}.dig)"))
    b.close()
