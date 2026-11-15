import sys, time, json
from playwright.sync_api import sync_playwright
OUT='test/shots'
errs=[]
PG=[None]
ADV="(ms)=>{const g=window.__game;for(let i=0;i<ms/50;i++){for(const sc of g.scene.getScenes(true)){const n=sc.time.now+50;sc.time.update(n,50);sc.tweens.update(n,50);}}}"
def waitf(cond,tries=40):
    for _ in range(tries):
        if PG[0].evaluate(cond): return
        sl(.5)
    raise Exception('timeout '+cond)
def sl(s):
    PG[0].evaluate(f"({ADV})({int(s*1000)})"); import time as t; t.sleep(.35)
def run(w,h,name,level='normal'):
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg=b.new_page(viewport={'width':w,'height':h}); PG[0]=pg
        pg.on('response',lambda r:print('HTTP404',r.url) if r.status==404 else None)
        pg.on('pageerror',lambda e:print('PAGEERR',str(e)[:300]))
        pg.on('console',lambda m:errs.append(('console',m.text)) if m.type=='error' else None)
        pg.goto('http://localhost:4173/'); waitf('window.__game && window.__game.scene.isActive("Title")')
        sl(1.5); pg.screenshot(path=f'{OUT}/{name}-0-title.png')
        pg.evaluate(f"window.__game.registry.set('level','{level}')")
        pg.evaluate("window.__game.scene.start('Intro')"); sl(1.2); pg.screenshot(path=f'{OUT}/{name}-0b-intro.png'); pg.evaluate("window.__game.scene.stop('Intro')")
        pg.evaluate("window.__game.scene.start('Play')"); waitf('window.__play && window.__play.S'); sl(1.2)
        pg.screenshot(path=f'{OUT}/{name}-1-day1.png')
        P="window.__play"
        def ev(s):
            try: return pg.evaluate(s)
            except Exception as e:
                print('EVALFAIL',s[:120],str(e)[:300]); raise
        def state(): return ev(f"({{day:{P}.S.day,phase:{P}.S.phase,power:{P}.S.power,air:{P}.S.air,hearts:{P}.S.hearts,dirt:{P}.S.rooms.map(r=>r.dirt+'/'+r.bags).join(' '),sizes:{P}.nights.map(n=>n.size).join('')}})")
        print(name,'start',state())
        # day 1 by the hand: beep A, beep B, dig on the better, sleep
        ev(f"{P}.useTool('beep')"); sl(.2); ev(f"{P}.tapRoom('A')"); sl(.4); ev(f"{P}.useTool('beep')") if ev(f"{P}.tool")==None else None
        ev(f"{P}.tapRoom('B')"); sl(1.5); pg.screenshot(path=f'{OUT}/{name}-2-readings.png')
        rd=ev(f"{P}.readings"); print('readings',{k:v['units'] for k,v in rd.items()})
        best=min(rd,key=lambda k:rd[k]['units'])
        ev(f"{P}.useTool('bag')"); ev(f"{P}.tapRoom('{best}')"); sl(.7); pg.screenshot(path=f'{OUT}/{name}-3-dig.png')
        for i in range(5): ev(f"{P}.digTap()"); sl(.25)
        sl(1.4); pg.screenshot(path=f'{OUT}/{name}-4-dirt.png')
        print('after dig',state())
        shot=[0]
        def night(room):
            print('pre',ev(f"JSON.stringify({{day:{P}.S.day,cut:{P}.cut,modal:{P}.modalKind,tool:{P}.tool,alarm:!!{P}.alarm,dig:{P}.dig}})"))
            ev(f"{P}.useTool('sleep')"); ev(f"{P}.tapRoom('{room}')"); print('post',ev(f"JSON.stringify({{day:{P}.S.day,cut:{P}.cut,tool:{P}.tool}})")); sl(.8)
            if ev(f"!!{P}.alarm"):
                pg.screenshot(path=f'{OUT}/{name}-5-alarm.png'); ev(f"{P}.tapRoom('{room}')"); sl(.8)
            sl(4.2); pg.screenshot(path=f'{OUT}/{name}-6-night-{shot[0]}.png'); shot[0]+=1
            sl(5); print('dbg',ev(f"JSON.stringify({{cut:{P}.cut,modal:{P}.modalKind,tool:{P}.tool,alarm:!!{P}.alarm,ph:{P}.S.phase,over:{P}.nightEv.length}})"))
            waitf(f"{P}.modalKind==='morning'"); sl(1.2)
            pg.screenshot(path=f'{OUT}/{name}-7-morning-{shot[0]}.png')
            ev(f"{P}.closeMorning()"); sl(.6)
        night(best); print('after n1',state())
        for d in range(2,8):
            if ev(f"{P}.S.phase")!='day': break
            ev(f"{P}.useTool('plant')") if d==2 else None
            if d==2: ev(f"{P}.tapRoom('{best}')"); sl(.8)
            ev(f"{P}.tool=null")
            if d==2:
                ev(f"{P}.useTool('rock')"); sl(.6); pg.screenshot(path=f'{OUT}/{name}-10-sites.png'); ev(f"{P}.tapRoom('C')"); sl(.8); pg.screenshot(path=f'{OUT}/{name}-10b-ask.png')
                ev(f"{P}.closeModal(); {P}.runJob('rock',2,false)"); sl(1.2); pg.screenshot(path=f'{OUT}/{name}-11-walk.png')
                waitf(f"{P}.modalKind==='find'"); sl(.8); pg.screenshot(path=f'{OUT}/{name}-12-find.png')
                ev(f"(()=>{{{P}.closeModal();{P}.cut=false;{P}.sendToNasa();{P}.refresh();}})()"); sl(.7); pg.screenshot(path=f'{OUT}/{name}-13-send.png'); sl(1.5)
            if d==3:
                ev(f"{P}.useTool('quake')"); sl(.6); pg.screenshot(path=f'{OUT}/{name}-14-askq.png'); ev(f"{P}.closeModal(); {P}.runJob('quake',0,False)".replace('False','false')); sl(3.5)
                ev(f"{P}.openMoonBook()"); sl(.8); pg.screenshot(path=f'{OUT}/{name}-15-book.png'); ev(f"{P}.closeModal()")
            # check every room once if power allows
            for rid in 'ABC':
                if ev(f"{P}.S.power")>=1 and rid not in ev(f"Object.keys({P}.readings)"):
                    ev(f"{P}.useTool('beep')"); ev(f"{P}.tapRoom('{rid}')"); sl(.3)
            rd=ev(f"{P}.readings")
            if d in (3,7): ev(f"{P}.openJournal()"); sl(.8); pg.screenshot(path=f'{OUT}/{name}-8-journal{d}.png'); ev(f"{P}.closeModal()")
            safest=min(rd,key=lambda k:rd[k]['units']) if rd else best
            night(safest); print('after n',d,state())
        # report
        sl(3); waitf('window.__report && window.__game.scene.isActive("Report")'); sl(1)
        pg.screenshot(path=f'{OUT}/{name}-9-report.png')
        ev("(()=>{const r=window.__report;r.answers={crewRoom:'A',mysteryRoom:'B',why:'rays'};r.submit();})()"); sl(4.5)
        pg.screenshot(path=f'{OUT}/{name}-9b-end.png')
        pg.click('text=x') if False else None
        b.close()
run(1280,720,'desk')
print('ERRORS',errs[:8])
