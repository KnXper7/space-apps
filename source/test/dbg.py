import time
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':720}); pg.on('pageerror',lambda e:print('PAGEERR',e)); pg.on('console',lambda m:print('CON',m.type,m.text[:200]) if m.type in('error','warning') else None)
    pg.goto('http://localhost:4173/'); pg.wait_for_function('window.__game && window.__game.scene.isActive("Title")'); time.sleep(1)
    pg.evaluate("window.__game.scene.start('Play')"); pg.wait_for_function('window.__play && window.__play.S'); time.sleep(1)
    P='window.__play'; ev=pg.evaluate
    ev(f"{P}.useTool('bag')"); print('tool',ev(f"{P}.tool"),'tip',ev(f"{P}.tip"))
    ev(f"{P}.tapRoom('A')"); print('dig',ev(f"JSON.stringify({P}.dig)"))
    for i in range(5): ev(f"{P}.digTap()"); time.sleep(.25)
    time.sleep(1.2); print('S',ev(f"JSON.stringify({P}.S.rooms)"), ev(f"{P}.S.power"))
    ev(f"{P}.useTool('sleep')"); ev(f"{P}.tapRoom('A')"); time.sleep(1)
    print('alarm',ev(f"!!{P}.alarm"),'cut',ev(f"{P}.cut"))
    time.sleep(9); print('modal',ev(f"{P}.modalKind"),'cut',ev(f"{P}.cut"))
    b.close()
