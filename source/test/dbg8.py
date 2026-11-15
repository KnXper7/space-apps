import time
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('PAGEERR',str(e)[:400]))
    pg.on('response',lambda r:print('404',r.url) if r.status==404 else None)
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); pg.wait_for_function('window.__play && window.__play.S'); time.sleep(1.5)
    P='window.__play'
    print(pg.evaluate(f"(()=>{{try{{{P}.S.day=2;{P}.S.power=3;{P}.useTool('rock');return 'ok'}}catch(e){{return e.stack.slice(0,600)}}}})()"))
    b.close()
