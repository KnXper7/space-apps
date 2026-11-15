import time
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720})
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); pg.wait_for_function('window.__play && window.__play.S'); time.sleep(1)
    P='window.__play'; ev=pg.evaluate
    print('scale',ev(f"{P}.time.timeScale"),'tweenscale',ev(f"{P}.tweens.timeScale"),'status',ev(f"{P}.sys.settings.status"))
    ev(f"{P}.time.delayedCall(300,()=>{{window.__x=1}})"); time.sleep(2); print('after 2s',ev("window.__x"))
    ev(f"{P}.time.addEvent({{delay:300,callback:()=>{{window.__y=1}}}})"); time.sleep(2); print('addEvent',ev("window.__y"))
    ev(f"window.__game.scene.getScene('Play').events.on('update',()=>{{window.__u=(window.__u||0)+1}})"); time.sleep(1); print('updates',ev("window.__u"))
    b.close()
