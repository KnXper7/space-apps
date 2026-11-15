import time
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720})
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); pg.wait_for_function('window.__play && window.__play.S'); time.sleep(1)
    P='window.__play'; ev=pg.evaluate
    ev(f"window.__e={P}.time.delayedCall(300,()=>{{window.__x=1}})"); time.sleep(1.5)
    print(ev("JSON.stringify({el:__e.elapsed,delay:__e.delay,paused:__e.paused,hasCb:!!__e.callback,rem:__e.getRemaining(),ts:__e.timeScale,dispatched:__e.hasDispatched,active:__e.getProgress()})"))
    print(ev(f"JSON.stringify({{ctsc:{P}.time.timeScale,paused:{P}.time.paused,now:{P}.time.now,act:{P}.time._active.length,pend:{P}.time._pendingInsertion.length,rem:{P}.time._pendingRemoval.length}})"))
    print(ev(f"typeof {P}.time.update, {P}.time.update.toString().slice(0,400)"))
    b.close()
