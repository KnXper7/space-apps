import time
from playwright.sync_api import sync_playwright
ADV="(ms)=>{const g=window.__game;for(let i=0;i<ms/50;i++){for(const sc of g.scene.getScenes(true)){const n=sc.time.now+50;sc.time.update(n,50);sc.tweens.update(n,50);}}}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('PAGEERR',e))
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); pg.wait_for_function('window.__play && window.__play.S'); time.sleep(1)
    P='window.__play'; ev=pg.evaluate
    st=lambda:ev(f"JSON.stringify({{day:{P}.S.day,ph:{P}.S.phase,cut:{P}.cut,tool:{P}.tool,dig:{P}.dig,modal:{P}.modalKind,pow:{P}.S.power}})")
    ev(f"{P}.useTool('bag')"); ev(f"{P}.tapRoom('B')")
    for i in range(5): ev(f"{P}.digTap()"); ev(f"({ADV})(300)")
    ev(f"({ADV})(1500)"); time.sleep(.3); print('after dig',st())
    ev(f"{P}.useTool('sleep')"); print('tool',st()); ev(f"{P}.tapRoom('B')"); print('tapped',st())
    
    for i in range(4):
        ev(f"({ADV})(3000)"); time.sleep(.5); print(i,st(),ev(f"JSON.stringify({{n:{P}.nightEv.length,rem:{P}.nightEv.map(e=>Math.round(e.getRemaining?e.getRemaining():-1)).join(',')}})"))
    b.close()
