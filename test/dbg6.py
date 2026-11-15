import time
from playwright.sync_api import sync_playwright
ADV="(ms)=>{const g=window.__game;for(let i=0;i<ms/50;i++){for(const sc of g.scene.getScenes(true)){const n=sc.time.now+50;sc.time.update(n,50);sc.tweens.update(n,50);}}}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('PAGEERR',e))
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); pg.wait_for_function('window.__play && window.__play.S'); time.sleep(1)
    P='window.__play'; ev=pg.evaluate
    ev(f"{P}.useTool('sleep')"); ev(f"{P}.tapRoom('A')")
    for i in range(6):
        ev(f"({ADV})(1500)"); time.sleep(.3); print(i,ev(f"JSON.stringify({{cut:{P}.cut,modal:{P}.modalKind,ev:{P}.nightEv.length,alarm:!!{P}.alarm}})"))
    b.close()
