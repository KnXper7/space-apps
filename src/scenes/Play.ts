import { CONFIG } from '../config';
import Phaser from 'phaser';
import { W, H, C, FACE_COLOR, FACE_ICON, frame, icon, text, pill, panel, half, halfLine } from '../ui';
import { SFX, setMuted, sfxMuted } from '../audio';
import { openGrownups } from '../overlay';
import { stars } from './Title';
import { CREW, JOB, SITES, QUAKE_FINDS, SCIENCE_GOAL, DISCO, discoById, crewById } from '../crew';
declare const NS: any, NSData: any;

const RX: any = { A: 240, B: 640, C: 1040 };
const NAMES: any = { A: 'Quarters', B: 'Bio Lab', C: 'Geo Lab' };
const BASE = 572, DR = 140, DRY = 160, STEP = 14, DOCK_Y = 664, DIG_TAPS = 5, ALARM_MS = 5000;
const ids = ['A', 'B', 'C'];
const TOOLS = [
  { id: 'beep', icon: 'gauge', label: 'Check', p: 1, a: 0, u: 1 },
  { id: 'bag', icon: 'shovel', label: 'Dirt', p: 1, a: 1, u: 1 },
  { id: 'plant', icon: 'plant', label: 'Seeds', p: 1, a: 0, u: 2 },
  { id: 'rock', icon: 'mountains', label: 'Rock', p: 1, a: 1, u: 2 },
  { id: 'quake', icon: 'waveform', label: 'Quake', p: 1, a: 0, u: 3 },
  { id: 'sleep', icon: 'moon-stars', label: 'Sleep', p: 0, a: 2, u: 1 }
];
const TIPS: any = {
  noTool: { s: 'Pick a tool first' }, power: { s: 'No power. Bedtime!', point: { tool: 'sleep' } }, air: { s: 'Not enough air' },
  bagDay: { s: 'One dig a day' }, roofFull: { s: 'Roof is full' }, trays: { s: 'No seed trays left' }, locked: { s: 'Unlocks soon' }, placed: { s: 'Sensor is listening' }, empty: { s: 'Nothing new here' }
};
const STORM_WORDS = ['quiet', 'small', 'medium', 'BIG'];
const SUN_SCALE = [0.62, 0.86, 1.12, 1.42];
const TRAY_TINT: any = { sprout: 0x9fe3b8, healthy: 0x6be3b0, droopy: 0xffd166, hurt: 0xff6f61 };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (d: string) => { const p = d.split('-'); return MONTHS[+p[1] - 1] + ' ' + +p[2] + ', ' + p[0]; };

export class Play extends Phaser.Scene {
  S: any; level = 'normal'; nights: any[] = []; readings: any = {}; clues: any = {}; journal: any[] = []; seen: any = {};
  tool: string | null = null; tip: any = null; dig: any = null; alarm: any = null; cut = false; modalObjs: any[] = []; modalKind = '';
  rv: any = {}; badges: any = {}; keeper: any; keeperAt = 'B'; hand: any; handShadow: any; handIcon: any; lastTap = 0; helpOn = false; helpNow = false; cap: any; capBg: any; capTxt: any; sun: any; sunGlow: any; sunRays: any;
  hudG: any; hudDays: any[] = []; dockBtns: any = {}; jBadge: any; jBadgeT: any; toast: any; tipTimer: any; nightEv: any[] = []; nightObjs: any[] = [];
  crew: any = {}; sci: any = {}; sites: any[] = []; sensorObj: any = null; lastRes: any = null;
  dust: any; hot: any; alarmObjs: any[] = []; digObjs: any = null; pointer: any;
  constructor() { super('Play'); }

  get lv() { return NS.LEVELS[this.S.level]; }

  create() {
    frame(this);
    (window as any).__play = this;
    this.level = this.registry.get('level') || 'normal';
    this.nights = NSData.buildNights(this.registry.get('tonight'));
    this.S = NS.newGame({ level: this.level, flares: this.nights });
    this.readings = {}; this.clues = {}; this.journal = []; this.seen = {}; this.tool = null; this.tip = null; this.dig = null; this.alarm = null; this.cut = false;
    this.rv = {}; this.badges = {}; this.modalObjs = []; this.keeperAt = 'B';
    this.sci = { found: [], data: 0, sensor: false, nights: 0, visits: { hi: 0, ma: 0, cr: 0 } }; this.crew = {}; this.sites = []; this.sensorObj = null; this.lastRes = null; this.registry.set('sci', this.sci);

    this.add.image(W / 2, H / 2, 'sky').setDisplaySize(W, H).setDepth(0);
    stars(this, 110);
    const earth = this.add.image(150, 168, 'earthC').setDisplaySize(66, 66).setDepth(2); earth.setTint(0xdfe9ff);
    earth.setInteractive({ useHandCursor: true }).on('pointerup', () => { if (!this.cut && !this.modalKind) { SFX.tap(); this.info('earth'); } });
    this.add.image(150, 168, 'glow').setTint(0x6fa8ff).setScale(0.6).setAlpha(0.35).setDepth(2);
    this.tweens.add({ targets: earth, angle: 360, duration: 90000, repeat: -1 });
    this.add.image(W / 2, H - 115, 'ground').setDisplaySize(W, 230).setDepth(5);

    this.buildSun();
    ids.forEach((id) => this.buildRoom(id));
    this.buildKeeper();
    this.buildCrew();
    this.buildSites();
    this.buildHud();
    this.buildDock();
    this.buildCaption();
    const HC = CONFIG.hand;
    this.handShadow = icon(this, 'hand-pointing-f', 0, HC.shadowOffset, HC.size, 0x000000, HC.shadowOpacity);
    this.handIcon = icon(this, 'hand-pointing-f', 0, 0, HC.size, HC.color, HC.opacity);
    this.hand = this.add.container(0, 0, [this.handShadow, this.handIcon]).setDepth(120).setVisible(false);
    this.tweens.add({ targets: this.hand, scale: HC.bob, duration: HC.bobMs, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.lastTap = this.time.now; this.helpOn = false;
    this.input.on('pointerdown', () => { this.lastTap = this.time.now; if (this.helpOn) { this.helpOn = false; this.time.delayedCall(30, () => this.refresh()); } });
    if (CONFIG.hint.idleSeconds > 0) this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (this.helpOn || this.cut || this.modalKind || this.dig || this.alarm || this.S.phase !== 'day') return;
      if (this.time.now - this.lastTap > CONFIG.hint.idleSeconds * 1000) { this.helpOn = true; this.refresh(); }
    } });
    this.dust = this.add.particles(0, 0, 'dot', { speed: { min: 30, max: 120 }, lifespan: 500, scale: { start: 0.3, end: 0 }, tint: 0xc9b99a, emitting: false, gravityY: 120 }).setDepth(66);
    this.hot = this.add.particles(0, 0, 'dot', { speed: { min: 50, max: 170 }, lifespan: 420, scale: { start: 0.32, end: 0 }, tint: 0xffe2a0, emitting: false }).setDepth(66);
    this.input.keyboard?.on('keydown-SPACE', () => { if (this.dig) this.digTap(); });
    this.input.keyboard?.on('keydown-ESC', () => this.closeModal());
    this.refresh();
    this.cameras.main.fadeIn(450, 4, 6, 26);
  }

  // ---------------------------------------------------------------- world
  buildSun() {
    const s = this.add.container(1100, 178).setDepth(3);
    this.sunRays = this.add.image(0, 0, 'sunrays').setTint(0xffb347).setAlpha(0.5).setScale(0.62);
    this.sunGlow = this.add.image(0, 0, 'glow').setTint(0xff8a00).setScale(2.2).setAlpha(0.55);
    const photo = this.add.image(0, 0, 'sunC').setDisplaySize(118, 118);
    s.add([this.sunGlow, this.sunRays, photo]);
    s.setSize(150, 150);
    const hit = this.add.rectangle(0, 0, 150, 150, 0xffffff, 0.001).setInteractive({ useHandCursor: true }); s.add(hit);
    hit.on('pointerup', () => { if (!this.cut && !this.modalKind) { SFX.tap(); this.info('sun'); } });
    this.tweens.add({ targets: this.sunRays, angle: 360, duration: 60000, repeat: -1 });
    this.sun = s;
  }
  applySun() {
    const f = this.S ? Math.min(3, NS.flareTonight(this.S)) : 0;
    this.tweens.killTweensOf(this.sunGlow); this.tweens.killTweensOf(this.sun);
    this.tweens.add({ targets: this.sun, scale: SUN_SCALE[f], duration: 500, ease: 'Back.out' });
    this.tweens.add({ targets: this.sunGlow, alpha: f ? 0.95 : 0.5, scale: f ? 2.7 : 2.2, duration: f ? 480 : 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  buildRoom(id: string) {
    const c = this.add.container(RX[id], BASE).setDepth(10);
    const top = this.add.graphics(), g = this.add.graphics(), dome = this.add.graphics(), ring = this.add.graphics().setAlpha(0);
    const icons = this.add.container(0, 0);
    c.add([top, g, dome, icons, ring]);
    // plate
    const plate = this.add.graphics().setPosition(RX[id], BASE + 32).setDepth(11);
    plate.fillStyle(0x0c1230, 0.7).fillRoundedRect(-82, -17, 164, 34, 17).lineStyle(1.5, 0xffffff, 0.28).strokeRoundedRect(-82, -17, 164, 34, 17);
    const lt = text(this, RX[id] - 52, BASE + 32, id, 24, '#ffffff', 800).setDepth(12);
    const nt = text(this, RX[id] + 14, BASE + 33, NAMES[id], 17, '#cfd6f5', 500).setDepth(12);
    // pulse ring (shows when you can pick a room)
    halfLine(ring, DR + 10, DRY + 10); ring.lineStyle(4, C.sun, 1).strokePath();
    this.tweens.add({ targets: ring, scale: 1.015, duration: 600, yoyo: true, repeat: -1 });
    const hit = this.add.rectangle(RX[id], BASE - 88, 300, 180, 0xffffff, 0.001).setDepth(15).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => this.tapRoom(id));
    this.rv[id] = { c, top, g, dome, icons, ring, hit, clueIc: null };
    this.drawRoom(id, false);
  }
  layer(g: any, i: number, id: string) {
    const rx = DR + STEP * i, ry = DRY + STEP * i;
    half(g, rx, ry); g.fillStyle(i % 2 ? 0xb8a88a : 0x9c8a6e, 1).fillPath(); g.lineStyle(2, 0x6c604c, 0.85).strokePath();
    halfLine(g, rx - 5, ry - 5, 0, 0, 0.55, 0.86); g.lineStyle(3, 0xe9dfc6, 0.35).strokePath();
    let s = (id.charCodeAt(0) * 31 + i * 17) | 0; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 12; k++) { const a = Math.PI + rnd() * Math.PI, rr = 0.9 + rnd() * 0.08; g.fillStyle(0x5f5443, 0.35).fillCircle(Math.cos(a) * rx * rr, Math.sin(a) * ry * rr, 2 + rnd() * 3); }
  }
  drawRoom(id: string, fresh: boolean) {
    const r = NS.room(this.S, id), o = this.rv[id];
    o.top.clear(); o.g.clear(); o.dome.clear(); o.icons.removeAll(true);
    o.g.fillStyle(0x000000, 0.28).fillEllipse(0, 8, 2 * (DR + STEP * r.bags) + 34, 20);
    for (let i = r.bags; i >= 1; i--) this.layer(i === r.bags ? o.top : o.g, i, id);
    if (fresh && r.bags) { o.top.setScale(0.97, 0.7).setAlpha(0.6); this.tweens.add({ targets: o.top, scaleX: 1, scaleY: 1, alpha: 1, duration: 420, ease: 'Back.out' }); } else o.top.setScale(1).setAlpha(1);
    half(o.dome, DR, DRY); o.dome.fillStyle(0x111b42, 1).fillPath();
    half(o.dome, DR * 0.94, DRY * 0.9); o.dome.fillStyle(0x1b2a62, 0.5).fillPath();
    o.dome.fillStyle(0xffe1a8, 0.13).fillEllipse(0, -16, 236, 58);
    o.dome.fillStyle(0x3b4675, 1).fillRoundedRect(-DR + 10, -9, 2 * DR - 20, 9, 4);
    halfLine(o.dome, DR, DRY); o.dome.lineStyle(5, 0xd6e4ff, 0.9).strokePath();
    halfLine(o.dome, DR * 0.9, DRY * 0.9, 0, 0, 0.6, 0.82); o.dome.lineStyle(8, 0xffffff, 0.42).strokePath();
    halfLine(o.dome, DR * 0.9, DRY * 0.9, 0, 0, 0.86, 0.9); o.dome.lineStyle(8, 0xffffff, 0.3).strokePath();
    o.icons.add(icon(this, 'bed', -88, -34, 54, 0x93a4e0, 0.85));
    this.S.trays.filter((t: any) => t.room === id).forEach((t: any, k: number) => {
      const im = icon(this, t.state === 'hurt' ? 'leaf' : 'plant', -16 + k * 58, -34, 52, TRAY_TINT[t.state]); o.icons.add(im);
      if (fresh) { im.setScale(0); this.tweens.add({ targets: im, scale: 52 / 128, duration: 400, ease: 'Back.out' }); }
      if (t.state === 'droopy') im.setAngle(-14); if (t.state === 'hurt') im.setAngle(-24).setAlpha(0.8);
    });
    if (this.clues[id]) {
      const dead = this.clues[id] === 'dead';
      o.icons.add(icon(this, dead ? 'leaf' : 'plant', 92, -34, 46, dead ? 0x8d5a52 : 0x4fa882, 0.8));
      o.icons.add(icon(this, 'sparkle', 112, -64, 22, dead ? 0xff9a8f : 0xa6f0cf));
    }
    const y = BASE - DRY - STEP * r.bags - 40;
    if (this.badges[id]) this.badges[id].setY(y);
  }

  astro(x: number, y: number, accent: number, badge: string, badgeCol: number) {
    const k: any = this.add.container(x, y).setDepth(20);
    const g = this.add.graphics();
    const o = 0x59628c;
    g.fillStyle(0xb9c1dd, 1).fillRoundedRect(-24, -64, 13, 32, 5).lineStyle(2.5, o).strokeRoundedRect(-24, -64, 13, 32, 5);
    g.fillStyle(0xf4f6ff, 1).fillRoundedRect(-12, -16, 10, 16, 4).fillRoundedRect(3, -16, 10, 16, 4).lineStyle(2.5, o).strokeRoundedRect(-12, -16, 10, 16, 4).strokeRoundedRect(3, -16, 10, 16, 4);
    g.fillStyle(0xf4f6ff, 1).fillRoundedRect(-17, -52, 34, 40, 13).lineStyle(2.5, o).strokeRoundedRect(-17, -52, 34, 40, 13);
    g.fillStyle(accent, 1).fillRoundedRect(-6, -40, 12, 9, 3);
    g.fillStyle(accent, 1).fillRoundedRect(-17, -26, 34, 5, 2);
    g.fillStyle(0xf4f6ff, 1).fillCircle(0, -64, 19).lineStyle(2.5, o).strokeCircle(0, -64, 19);
    g.fillStyle(0x1a2656, 1).fillRoundedRect(-14, -73, 28, 18, 9);
    g.lineStyle(2.5, 0xffffff, 0.6); g.beginPath(); g.arc(-3, -66, 8, Math.PI * 1.1, Math.PI * 1.6); g.strokePath();
    k.add(g); k.setSize(44, 90);
    const b = icon(this, badge, 0, -104, 24, badgeCol); k.add(b);
    this.tweens.add({ targets: g, y: -2.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    k.g = g; return k;
  }
  buildKeeper() { this.keeper = this.astro(RX.B + 100, BASE + 38, 0xffb020, 'star-f', C.sun); }
  buildCrew() {
    CREW.forEach((m, i) => {
      const hx = RX[ids[i]] - 95, a = this.astro(hx, BASE + 38, m.col, m.ico, m.col); a.home = hx;
      const hit = this.add.rectangle(0, -44, 56, 110, 0xffffff, 0.001).setInteractive({ useHandCursor: true }); a.add(hit);
      hit.on('pointerup', () => { if (!this.cut && !this.modalKind) { SFX.tap(); this.showToast(m.ico, m.name + ', ' + m.role); } });
      this.crew[m.id] = a;
    });
  }
  buildSites() {
    SITES.forEach((st, i) => {
      const c = this.add.container(RX[ids[i]] - 175, BASE + 34).setDepth(18).setVisible(false);
      const g = this.add.graphics().fillStyle(0x0c1230, 0.85).fillCircle(0, 0, 32).lineStyle(3, st.col, 1).strokeCircle(0, 0, 32);
      const hit = this.add.rectangle(0, 0, 80, 80, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      c.add([g, icon(this, st.ic, 0, 0, 36, st.col), hit]);
      hit.on('pointerup', () => this.pickSite(i));
      this.tweens.add({ targets: c, scale: 1.1, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.sites.push(c);
    });
  }
  drawSensor() {
    if (this.sensorObj) return;
    const c = this.add.container(440, BASE + 46).setDepth(17), g = this.add.graphics();
    g.lineStyle(3, 0x9fd8ff, 0.9).lineBetween(-12, 8, 0, -14).lineBetween(12, 8, 0, -14).lineBetween(0, -14, 0, -30);
    c.add([g, icon(this, 'waveform', 0, -40, 26, 0x9fd8ff)]);
    c.setScale(0); this.tweens.add({ targets: c, scale: 1, duration: 400, ease: 'Back.out' }); this.sensorObj = c;
  }
  walk(a: any, tx: number, quiet = false) {
    if (Math.abs(a.x - tx) < 4) return;
    if (!quiet) SFX.whoosh();
    a.g.scaleX = tx < a.x ? -1 : 1; this.tweens.add({ targets: a, x: tx, duration: 520, ease: 'Sine.inOut' }); this.tweens.add({ targets: a, y: BASE + 24, duration: 130, yoyo: true, repeat: 1 });
  }
  moveKeeper(id: string, quiet = false) { this.walk(this.keeper, RX[id] + 100, quiet); this.keeperAt = id; }
  worker(tool: string) { return this.crew[JOB[tool]] || this.keeper; }
  moveWorker(tool: string, id: string) { const w = this.worker(tool); const tx = RX[id] + (w === this.keeper ? 100 : -95 + 0); this.walk(w, w === this.keeper ? tx : RX[id] - 95); }

  // ---------------------------------------------------------------- HUD + dock
  buildHud() {
    this.hudG = this.add.graphics().setDepth(100);
    for (let i = 0; i < 5; i++) this.hudDays.push(text(this, 40 + i * 36, 38, String(i + 1), 17, '#1b1300', 800).setDepth(101).setVisible(false));
    const zone = (x: number, w: number, k: string) => { const z = this.add.rectangle(x, 38, w, 48, 0xffffff, 0.001).setDepth(102).setInteractive({ useHandCursor: true }); z.on('pointerup', () => { if (!this.cut && !this.modalKind) { SFX.tap(); this.info(k); } }); };
    zone(425, 170, 'power'); zone(678, 250, 'air'); zone(915, 190, 'hearts');
    const bk = this.add.rectangle(1052, 38, 100, 48, 0xffffff, 0.001).setDepth(102).setInteractive({ useHandCursor: true }); bk.on('pointerup', () => { if (!this.cut && !this.modalKind) { SFX.tap(); this.openMoonBook(); } });
    const jb: any = pill(this, 1148, 38, 48, 48, { icon: 'notebook', depth: 102, onClick: () => { if (!this.cut && !this.alarm && !this.modalKind) { SFX.tap(); this.openJournal(); } } });
    this.jBadge = this.add.graphics().setDepth(103); this.jBadgeT = text(this, 1164, 20, '', 14, '#1b1300', 800).setDepth(104);
    const sb: any = pill(this, 1204, 38, 48, 48, { icon: 'speaker-high', depth: 102, onClick: () => { setMuted(!sfxMuted()); sb.ico.setTexture(sfxMuted() ? 'i-speaker-slash' : 'i-speaker-high'); if (!sfxMuted()) SFX.tap(); } });
    pill(this, 1260 - 8, 38, 48, 48, { icon: 'info', depth: 102, onClick: () => { if (!this.cut) { SFX.tap(); openGrownups(this.registry.get('tonight'), this.S.level); } } });
    jb.setX(1124); sb.setX(1180);
    if (CONFIG.hint.helpButton) pill(this, 1252, 98, 48, 48, { icon: 'question', depth: 102, onClick: () => { if (!this.cut && !this.modalKind && !this.alarm) this.askHelp(); } });
  }
  refreshHud() {
    const S = this.S, g = this.hudG; g.clear();
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 36, cur = i + 1 === Math.min(S.day, 5), past = i + 1 < S.day;
      if (cur) g.fillStyle(C.sun, 1).fillCircle(x, 38, 15); else if (past) g.fillStyle(0xffffff, 0.35).fillCircle(x, 38, 6); else g.lineStyle(1.5, 0xffffff, 0.4).strokeCircle(x, 38, 6);
      this.hudDays[i].setVisible(cur);
    }
    // power
    if (!(this as any).pw) { (this as any).pw = [0, 1, 2, 3, 4].map((i) => icon(this, 'lightning', 360 + i * 30, 38, 26, C.sun).setDepth(101)); (this as any).wi = icon(this, 'wind', 556, 38, 26, C.air).setDepth(101); (this as any).sc = icon(this, 'flask', 1024, 38, 28, 0xa6f0cf).setDepth(101); (this as any).sct = text(this, 1046, 38, '', 22, '#ffffff', 700, [0, 0.5]).setDepth(101); (this as any).hr = [0, 1, 2, 3, 4, 5].map((i) => icon(this, 'heart-f', 842 + i * 32, 38, 26, C.heart).setDepth(101)); }
    (this as any).pw.forEach((im: any, i: number) => im.setAlpha(i < S.power ? 1 : 0.18));
    const low = S.air <= 3;
    for (let i = 0; i < 10; i++) { g.fillStyle(i < S.air ? (low ? C.ouch : C.air) : 0xffffff, i < S.air ? 1 : 0.14).fillRoundedRect(578 + i * 18, 28, 13, 20, 4); }
    (this as any).wi.setTint(low ? C.ouch : C.air);
    const maxH = this.lv.hearts;
    (this as any).hr.forEach((im: any, i: number) => im.setVisible(i < maxH).setAlpha(i < S.hearts ? 1 : 0.2));
    (this as any).sct.setText(`${this.sci.found.length}/${DISCO.length}`);
    const n = this.journal.length; this.jBadge.clear(); this.jBadgeT.setText(n ? String(n) : '');
    if (n) { this.jBadge.fillStyle(C.sun, 1).fillCircle(1138, 20, 11); this.jBadgeT.setPosition(1138, 20); }
  }
  buildDock() {
    TOOLS.forEach((t, i) => {
      const x = W / 2 + (i - 2.5) * 104;
      const c = this.add.container(x, DOCK_Y).setDepth(100);
      const g = this.add.graphics(); c.add(g);
      const ico = icon(this, t.icon, 0, 0, 34, 0xffffff); c.add(ico);
      const lock = icon(this, 'lock', 0, 0, 26, 0xffffff, 0.9).setVisible(false); c.add(lock);
      const label = text(this, 0, 42, t.label, 15, '#cfd6f5', 600); c.add(label);
      const costs: any[] = []; for (let k = 0; k < t.p; k++) costs.push(icon(this, 'lightning', 0, 42, 13, C.sun)); if (t.a) for (let k = 0; k < t.a; k++) costs.push(icon(this, 'wind', 0, 42, 13, C.air));
      costs.forEach((im) => c.add(im));
      const w0 = label.width, tot = costs.length * 13 + 4; label.setX(-tot / 2 + 0); costs.forEach((im, k) => im.setX(w0 / 2 - tot / 2 + 8 + k * 13 + 2));
      const dot = this.add.graphics(); c.add(dot);
      const hit = this.add.rectangle(0, 8, 84, 92, 0xffffff, 0.001).setInteractive({ useHandCursor: true }); c.add(hit);
      hit.on('pointerdown', () => this.tweens.add({ targets: c, scale: 0.93, duration: 70 }));
      hit.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 90 }));
      hit.on('pointerup', () => { this.tweens.add({ targets: c, scale: 1, duration: 90 }); this.useTool(t.id); });
      this.dockBtns[t.id] = { c, g, ico, lock, label, dot, x };
    });
  }
  refreshDock() {
    const S = this.S;
    TOOLS.forEach((t) => {
      const b = this.dockBtns[t.id]; b.g.clear();
      const sel = this.tool === t.id, locked = t.u > S.day;
      const ok = !this.cut && !this.alarm && !this.dig && S.phase === 'day' && (t.id === 'sleep' ? true : t.id === 'rock' || t.id === 'quake' ? this.canExtra(t.id).ok : NS.canUse(S, t.id).ok);
      b.g.fillStyle(sel ? C.sun : 0xffffff, sel ? 1 : 0.1).fillCircle(0, 0, 33); b.g.lineStyle(sel ? 3 : 1.5, sel ? 0xffe0a0 : 0xffffff, sel ? 1 : 0.28).strokeCircle(0, 0, 33);
      b.ico.setTint(sel ? 0x1b1300 : 0xffffff).setVisible(!locked); b.lock.setVisible(locked);
      b.c.setAlpha(ok || locked ? 1 : 0.42); if (locked) b.c.setAlpha(0.6);
      b.dot.clear(); if (t.u > 1 && S.day >= t.u && !this.seen[t.id]) b.dot.fillStyle(C.sun, 1).fillCircle(26, -26, 7);
    });
  }
  buildCaption() {
    this.capBg = this.add.graphics().setDepth(110); this.capTxt = text(this, W / 2, CONFIG.caption.y, '', CONFIG.caption.size, '#ffffff', 600).setDepth(111);
  }
  setCaption(str: string) {
    this.capBg.clear(); this.capTxt.setText(str || '');
    if (!str) return;
    const w = this.capTxt.width + 56;
    this.capBg.fillStyle(CONFIG.caption.bg, CONFIG.caption.bgOpacity).fillRoundedRect(W / 2 - w / 2, CONFIG.caption.y - 25, w, 50, 25).lineStyle(1.5, 0xffffff, 0.25).strokeRoundedRect(W / 2 - w / 2, CONFIG.caption.y - 25, w, 50, 25);
    this.capTxt.setAlpha(0); this.capBg.setAlpha(0); this.tweens.add({ targets: [this.capTxt, this.capBg], alpha: 1, duration: 200 });
  }

  // ---------------------------------------------------------------- guide: a pointing hand and a few words
  guide(): any {
    const S = this.S, lv = this.lv, read = Object.keys(this.readings), n = read.length;
    if (this.alarm) return { s: S.air >= 1 ? 'Run to your safest room!' : 'No air to run. Stay put!' };
    if (this.dig) return { s: 'Dig! Dig! Dig!', point: { dig: true } };
    if (this.tip) return this.tip;
    const tut = lv.hints && S.day === 1;
    if (this.tool === 'sleep') return { s: tut ? 'Sleep where the beeps are low' : 'Tap a room to sleep in' };
    if (this.tool === 'beep') {
      const next = S.rooms.filter((r: any) => !this.readings[r.id])[0];
      if (tut && n === 1) return { s: '1 beep = 1 space ray. Try another room', point: next ? { room: next.id } : null };
      return { s: 'Tap a room', point: tut && next ? { room: next.id } : null };
    }
    if (this.tool === 'bag') { const best = read.slice().sort((a, b) => this.readings[a].units - this.readings[b].units)[0]; return { s: 'Tap a roof', point: tut && best ? { room: best } : null }; }
    if (this.tool === 'plant') return { s: 'Tap a safe room' };
    if (this.tool === 'rock') return { s: 'Pick a place' };
    if (S.power < 1) return { s: 'Bedtime!', point: { tool: 'sleep' } };
    if (tut) {
      if (n === 0) return { s: 'Tap Check', point: { tool: 'beep' } };
      if (n === 1) return { s: '1 beep = 1 space ray', point: { tool: 'beep' } };
      if (!S.bagToday) return { s: 'Moon dirt blocks rays', point: { tool: 'bag' } };
      return { s: 'Bedtime!', point: { tool: 'sleep' } };
    }
    if (!lv.hints) return { s: '' };
    if (S.day >= 2 && !this.seen.plant && S.trays.length < NS.MAX_TRAYS) return { s: 'Plants make air', point: { tool: 'plant' } };
    if (S.day >= 2 && !this.seen.rock && S.air >= 3) return { s: 'Lily can find rocks', point: { tool: 'rock' } };
    if (S.day >= 3 && !this.seen.quake && !this.sci.sensor) return { s: 'Jun can place a sensor', point: { tool: 'quake' } };
    if (S.air <= 3) return { s: 'Low air! Plants make air' };
    if (S.day === 5) return { s: 'Last night!' };
    return { s: '' };
  }
  refresh() {
    this.refreshHud(); this.refreshDock(); this.applySun();
    ids.forEach((id) => { const on = (!!this.tool && this.tool !== 'rock' && !this.cut && !this.dig) || !!this.alarm; const ring = this.rv[id].ring; this.tweens.add({ targets: ring, alpha: on ? 0.9 : 0, duration: 200 }); });
    this.sites.forEach((c: any) => c.setVisible(this.tool === 'rock' && !this.cut && !this.modalKind));
    let g = this.guide();
    if (!g.s && !g.point && (this.helpOn || this.helpNow)) g = this.suggest();
    this.setCaption(this.cut || this.modalKind ? '' : g.s);
    const p = g.point;
    if (!CONFIG.hand.enabled || !p || this.cut || this.modalKind) { this.hand.setVisible(false); return; }
    this.hand.setVisible(true);
    if (p.tool) { const b = this.dockBtns[p.tool]; this.placeHand(b.x, DOCK_Y - 62, 180); }
    else if (p.room) this.placeHand(RX[p.room] + 14, BASE - 40, 0);
    else if (p.dig) this.placeHand(RX[this.dig.room] + 185, BASE - 34, 0);
  }
  placeHand(x: number, y: number, angle: number) {
    this.hand.setPosition(x, y).setAngle(angle);
    this.handShadow.y = angle === 180 ? -CONFIG.hand.shadowOffset : CONFIG.hand.shadowOffset;   // shadow stays below on screen
  }
  // The next sensible step, used by the ? button and the idle hint
  suggest(): any {
    const S = this.S;
    if (S.power < 1) return { s: 'Bedtime!', point: { tool: 'sleep' } };
    if (S.air <= 3 && S.trays.length < NS.MAX_TRAYS) return { s: 'Plants make air', point: { tool: 'plant' } };
    if (!S.bagToday) return { s: 'Cover a roof with dirt', point: { tool: 'bag' } };
    if (this.sci.found.length < SCIENCE_GOAL && S.air >= 1) return { s: 'Send a crew member for rocks', point: { tool: 'rock' } };
    if (S.day >= 3 && !this.sci.sensor) return { s: 'Place a sensor', point: { tool: 'quake' } };
    return { s: 'Done for today? Go to bed', point: { tool: 'sleep' } };
  }
  askHelp() { this.helpNow = true; this.lastTap = this.time.now; this.refresh(); this.helpNow = false; this.helpOn = true; SFX.tap(); }

  // ---------------------------------------------------------------- tools
  fail(code: string) { this.tip = TIPS[code] || { s: 'Not now' }; this.tool = null; SFX.no(); this.refresh(); if (this.tipTimer) this.tipTimer.remove(); this.tipTimer = this.time.delayedCall(3200, () => { this.tip = null; this.refresh(); }); }
  canExtra(tool: string): any {
    const S = this.S; if (S.phase !== 'day') return { ok: false, code: 'noTool' };
    if (S.power < 1) return { ok: false, code: 'power' };
    if (tool === 'rock' && S.air < 1) return { ok: false, code: 'air' };
    if (tool === 'quake' && this.sci.sensor) return { ok: false, code: 'placed' };
    return { ok: true };
  }
  useTool(tool: string) {
    if (this.cut || this.alarm || this.modalKind) return;
    if (this.dig) this.cancelDig();
    const T: any = TOOLS.find((t) => t.id === tool);
    if (T && T.u > this.S.day) return this.fail('locked');
    if (tool === 'rock' || tool === 'quake') { const c = this.canExtra(tool); if (!c.ok) return this.fail(c.code); }
    else if (tool !== 'sleep') { const c = NS.canUse(this.S, tool); if (!c.ok) return this.fail(c.code); }
    if (this.S.phase !== 'day') return;
    this.seen[tool] = true;
    if (tool === 'quake') { this.tool = null; SFX.tap(); return this.askCrew('quake', 0); }
    this.tool = this.tool === tool ? null : tool; this.tip = null; SFX.tap(); this.refresh();
  }
  tapRoom(id: string) {
    if (this.cut || this.modalKind) return;
    if (this.alarm) return this.endAlarm(id);
    if (this.dig) this.cancelDig();
    if (!this.tool) return this.fail('noTool');
    if (this.tool === 'rock') return this.pickSite(ids.indexOf(id));
    this.applyTool(this.tool, id);
  }
  stick(r: any) {
    const k = [r.kind, r.room || '', r.day, r.units ?? '', r.state || ''].join('|');
    if (this.journal.some((s) => s.key === k)) return;
    this.journal.push({ key: k, ...r });
  }
  reveal(id: string) {
    const r = NS.room(this.S, id), kind = r.startDirt === 0 ? 'dead' : r.startDirt === 2 ? 'alive' : null;
    if (!kind || this.clues[id]) return '';
    this.clues[id] = kind; this.stick({ kind: 'clue', room: id, day: this.S.day, state: kind });
    this.time.delayedCall(900, () => { this.drawRoom(id, false); this.showToast('sparkle', kind === 'dead' ? 'Clue! The old seeds died here' : 'Clue! The old seeds grew here'); this.hot.explode(16, RX[id] + 92, BASE - 40); });
    return kind;
  }
  showToast(ic: string, str: string) {
    this.toast?.destroy();
    const c = this.add.container(W / 2, 108).setDepth(115); const t = text(this, 16, 0, str, 22, '#ffffff', 600); const w = t.width + 78;
    const g = this.add.graphics().fillStyle(0x0c1230, 0.9).fillRoundedRect(-w / 2, -26, w, 52, 26).lineStyle(1.5, C.sun, 0.8).strokeRoundedRect(-w / 2, -26, w, 52, 26);
    c.add([g, icon(this, ic, -w / 2 + 30, 0, 30, C.sun), t]); c.setAlpha(0).setY(120); this.toast = c;
    this.tweens.add({ targets: c, alpha: 1, y: 108, duration: 250 }); this.tweens.add({ targets: c, alpha: 0, duration: 400, delay: 2800, onComplete: () => c.destroy() });
  }
  applyTool(t: string, id: string) {
    if (t === 'sleep') { this.tool = null; return this.beginNight(id); }
    const c = NS.canUse(this.S, t, id); if (!c.ok) return this.fail(c.code);
    this.tip = null; this.moveWorker(t, id);
    if (t === 'bag') { this.tool = null; this.startDig(id); return; }
    const r = NS[t](this.S, id); if (!r.ok) return this.fail(r.code);
    if (t === 'beep') {
      const rd = { kind: 'beep', room: id, day: r.day, units: r.units, face: r.face };
      this.readings[id] = rd; this.stick(rd); this.reveal(id); SFX.beeps(r.units); this.showReading(id, rd, true);
      if (this.lv.readings === 'fade') this.time.delayedCall(8000, () => { if (this.readings[id] === rd) { delete this.readings[id]; this.hideBadge(id); } });
      if (this.S.power < 1 || (this.S.day === 1 && this.lv.hints && Object.keys(this.readings).length >= 2)) this.tool = null;
      return this.refresh();
    }
    if (t === 'plant') { this.seen.plant = true; SFX.grow(); this.drawRoom(id, true); this.hot.explode(14, RX[id], BASE - 50); }
    this.tool = null; this.refresh();
  }
  showReading(id: string, rd: any, count: boolean) {
    this.hideBadge(id);
    const r = NS.room(this.S, id), y = BASE - DRY - STEP * r.bags - 40;
    const c = this.add.container(RX[id], y).setDepth(30);
    const col = FACE_COLOR[rd.face];
    const g = this.add.graphics().fillStyle(0x0c1230, 0.9).fillRoundedRect(-62, -28, 124, 56, 28).lineStyle(2.5, col, 0.95).strokeRoundedRect(-62, -28, 124, 56, 28);
    const ic = icon(this, FACE_ICON[rd.face], -30, 0, 36, col), num = text(this, 26, 1, count ? '0' : String(rd.units), 32, '#ffffff', 800);
    c.add([g, ic, num]); c.setSize(124, 56);
    const hit = this.add.rectangle(0, 0, 124, 56, 0xffffff, 0.001).setInteractive({ useHandCursor: true }); c.add(hit);
    hit.on('pointerup', () => { if (!this.cut && !this.modalKind) { SFX.tap(); this.info('beep'); } });
    c.setScale(0); this.tweens.add({ targets: c, scale: 1, duration: 320, ease: 'Back.out' });
    this.badges[id] = c;
    if (count && rd.units > 0) { let n = 0; this.time.addEvent({ delay: 220, repeat: rd.units - 1, callback: () => { if (!num.active) return; n++; num.setText(String(n)); } }); } else num.setText(String(rd.units));
  }
  hideBadge(id: string) { if (this.badges[id]) { this.badges[id].destroy(); delete this.badges[id]; } }

  // ---------------------------------------------------------------- crew jobs: Rock (Lily) and Quake sensor (Jun)
  pickSite(i: number) {
    if (this.cut || this.modalKind || this.tool !== 'rock' || i < 0) return;
    const st = SITES[i]; if (this.sci.visits[st.id] >= st.finds.length) return this.fail('empty');
    this.askCrew('rock', i);
  }
  askCrew(job: string, site: number) {
    const m = crewById(JOB[job]), risk = NS.flareTonight(this.S) >= 2, st = job === 'rock' ? SITES[site] : null;
    const c = this.openModal(640, risk ? 450 : 400, 'ask');
    const top = risk ? -140 : -125;
    c.add(text(this, 0, top, `Send ${m.name}?`, 38, '#ffd98a', 700));
    c.add(icon(this, m.ico, -150, top + 78, 76, m.col)); c.add(text(this, -96, top + 62, m.name, 34, '#ffffff', 800, [0, 0.5])); c.add(text(this, -96, top + 98, m.role, 20, '#98a3d0', 500, [0, 0.5]));
    const row: [string, number][] = []; if (st) row.push([st.ic, st.col]); else row.push(['waveform', 0x9fd8ff]); row.push(['lightning', C.sun]); if (job === 'rock') row.push(['wind', C.air]);
    const x0 = -(row.length - 1) * 50; row.forEach((r, i) => c.add(icon(this, r[0], x0 + i * 100, top + 176, 48, r[1])));
    if (risk) { c.add(icon(this, 'sun', -196, top + 238, 34, C.ouch)); c.add(icon(this, 'heart-break', -152, top + 238, 34, C.heart)); c.add(text(this, -122, top + 238, 'Storm tonight. Outside is risky.', 19, '#ffb3bd', 500, [0, 0.5])); }
    const yb = risk ? 150 : 128;
    c.add(pill(this, -130, yb, 200, 60, { label: 'No', icon: 'x-circle', size: 26, onClick: () => { SFX.no(); this.tool = null; this.closeModal(); } }));
    c.add(pill(this, 130, yb, 200, 60, { label: 'Yes', icon: 'check-circle', fill: C.sun, fillA: 1, stroke: 0xffe0a0, strokeA: 0.9, color: 0x1b1300, size: 26, onClick: () => { SFX.tap(); this.closeModal(); this.runJob(job, site, risk); } }));
  }
  runJob(job: string, site: number, risk: boolean) {
    const S = this.S, m = crewById(JOB[job]), a = this.crew[m.id];
    S.power -= 1; if (job === 'rock') S.air -= 1; S.toolsUsed++;
    this.tool = null; this.cut = true; this.refresh();
    const sx = job === 'rock' ? RX[ids[site]] - 175 : 440;
    this.walk(a, sx);
    this.time.delayedCall(620, () => { for (let k = 0; k < 4; k++) this.time.delayedCall(k * 260, () => { SFX.scoop(); this.dust.explode(7, sx, BASE + 52); this.tweens.add({ targets: a.g, scaleY: 0.9, duration: 110, yoyo: true }); }); });
    this.time.delayedCall(1900, () => {
      this.walk(a, a.home);
      if (job === 'quake') {
        this.sci.sensor = true; this.drawSensor(); SFX.grow(); this.hot.explode(14, 440, BASE + 8); this.showToast('waveform', 'Sensor is listening');
        this.time.delayedCall(700, () => { this.cut = false; this.refresh(); });
        return;
      }
      const st = SITES[site], find = discoById(st.finds[this.sci.visits[st.id]++]);
      this.sci.found.push(find.id); this.sci.data++;
      if (risk) { S.hearts = Math.max(1, S.hearts - 1); }
      this.time.delayedCall(900, () => { this.refreshHud(); this.openFind(find, risk); });
    });
  }
  tagRow(c: any, tag: string, y: number) {
    const seen = tag === 'seen';
    c.add(icon(this, seen ? 'check-circle' : 'magnifying-glass', -150, y, 30, seen ? C.safe : C.careful));
    c.add(text(this, -122, y, seen ? 'NASA has seen this' : 'NASA is still studying this', 22, seen ? '#a8f0cf' : '#ffe2a0', 600, [0, 0.5]));
  }
  openFind(find: any, hurt: boolean) {
    const c = this.openModal(720, hurt ? 560 : 520, 'find');
    c.add(text(this, 0, -222, 'You found', 24, '#98a3d0', 500));
    c.add(icon(this, find.ic, 0, -140, 100, 0xffe2a0));
    c.add(text(this, 0, -62, find.name, 44, '#ffffff', 800)); c.add(text(this, 0, -22, find.term, 20, '#98a3d0', 500));
    this.tagRow(c, find.tag, 28);
    const t = text(this, 0, 94, find.fact, 20, '#cfd6f5', 400); t.setWordWrapWidth(600); c.add(t);
    let y = 150; if (hurt) { c.add(icon(this, 'heart-break', -20, y, 34, C.heart)); c.add(text(this, 10, y, 'Storm rays. -1 heart', 20, '#ffb3bd', 500, [0, 0.5])); y += 40; }
    const b = this.okBtn(c, hurt ? 232 : 205, () => { this.closeModal(); this.cut = false; this.sendToNasa(); this.refresh(); }, 'broadcast', 'Send'); b.setScale(1);
    SFX.stars(1);
  }
  sendToNasa() {
    const from = { x: RX.B, y: BASE - DRY - 20 }, to = { x: 150, y: 168 };
    const b = icon(this, 'broadcast', from.x, from.y, 46, C.air).setDepth(70); SFX.whoosh();
    const trail = this.time.addEvent({ delay: 70, loop: true, callback: () => this.hot.explode(1, b.x, b.y) });
    this.tweens.add({ targets: b, x: to.x, y: to.y, scale: 0.45, duration: 1300, ease: 'Sine.in', onComplete: () => {
      trail.remove(); b.destroy(); SFX.beeps(2);
      const fl = this.add.image(to.x, to.y, 'glow').setTint(0x7fb4ff).setScale(0.4).setDepth(4); this.tweens.add({ targets: fl, scale: 1.8, alpha: 0, duration: 700, onComplete: () => fl.destroy() });
      this.showToast('broadcast', 'Sent to NASA');
    } });
  }
  openMoonBook() {
    const c = this.openModal(900, 640, 'book'); let det: any = null;
    c.add(icon(this, 'flask', -400, -276, 38, 0xa6f0cf)); c.add(text(this, -362, -276, 'Moon book', 34, '#ffd98a', 700, [0, 0.5]));
    c.add(icon(this, 'check-circle', 90, -276, 26, C.safe)); c.add(text(this, 114, -276, 'seen', 18, '#a8f0cf', 500, [0, 0.5]));
    c.add(icon(this, 'magnifying-glass', 210, -276, 26, C.careful)); c.add(text(this, 234, -276, 'studying', 18, '#ffe2a0', 500, [0, 0.5]));
    det = text(this, 0, 232, 'Tap a find.', 19, '#cfd6f5', 400); det.setWordWrapWidth(800); c.add(det);
    DISCO.forEach((d, i) => {
      const col = i % 3, row = Math.floor(i / 3), x = -280 + col * 280, y = -190 + row * 130, got = this.sci.found.includes(d.id);
      const g = this.add.graphics().fillStyle(0xffffff, got ? 0.1 : 0.04).fillRoundedRect(-124, -50, 248, 100, 22).lineStyle(1.5, got ? (d.tag === 'seen' ? C.safe : C.careful) : 0xffffff, got ? 0.8 : 0.15).strokeRoundedRect(-124, -50, 248, 100, 22);
      const cell = this.add.container(x, y); cell.add(g);
      if (got) { cell.add(icon(this, d.ic, -70, 0, 50, 0xffe2a0)); const t = text(this, -34, -8, d.name, 22, '#ffffff', 700, [0, 0.5]); cell.add(t); cell.add(text(this, -34, 20, d.term, 14, '#98a3d0', 400, [0, 0.5])); cell.add(icon(this, d.tag === 'seen' ? 'check-circle' : 'magnifying-glass', 98, -30, 22, d.tag === 'seen' ? C.safe : C.careful)); }
      else cell.add(icon(this, 'question', 0, 0, 44, 0x4a5486));
      if (got) { const hit = this.add.rectangle(0, 0, 248, 100, 0xffffff, 0.001).setInteractive({ useHandCursor: true }); cell.add(hit); hit.on('pointerup', () => { SFX.tap(); det.setText(d.fact + '  Source: ' + d.src); }); }
      c.add(cell);
    });
    const last = this.sci.found[this.sci.found.length - 1]; if (last) det.setText(discoById(last).fact + '  Source: ' + discoById(last).src);
    this.okBtn(c, 282);
  }

  // ---------------------------------------------------------------- digging
  startDig(id: string) {
    this.dig = { room: id, n: 0 };
    const c = this.add.container(RX[id] + 185, BASE + 36).setDepth(25), g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillEllipse(0, 12, 130, 18); g.fillStyle(0x9c8a6e, 1).fillEllipse(0, 0, 116, 50).lineStyle(2, 0x6c604c, 0.9).strokeEllipse(0, 0, 116, 50);
    g.fillStyle(0xb8a88a, 1).fillEllipse(-8, -10, 84, 30); g.fillStyle(0xe9dfc6, 0.35).fillEllipse(-18, -18, 40, 8);
    const sh = icon(this, 'shovel', 0, -42, 54, 0xffffff), pips = this.add.graphics().setPosition(0, -88);
    c.add([g, sh, pips]); c.setScale(0); this.tweens.add({ targets: c, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: sh, y: -50, angle: 10, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const hit = this.add.rectangle(RX[id] + 185, BASE + 10, 170, 120, 0xffffff, 0.001).setDepth(26).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.digTap());
    this.digObjs = { c, hit, pips, sh }; this.drawPips(); this.refresh();
  }
  drawPips() { const p = this.digObjs.pips; p.clear(); for (let i = 0; i < DIG_TAPS; i++) p.fillStyle(i < this.dig.n ? C.sun : 0xffffff, i < this.dig.n ? 1 : 0.3).fillCircle(-40 + i * 20, 0, 6); }
  cancelDig() { if (this.digObjs) { this.digObjs.c.destroy(); this.digObjs.hit.destroy(); this.digObjs = null; } this.dig = null; }
  digTap() {
    const d = this.dig; if (!d || this.cut) return;
    d.n++; SFX.scoop(); this.drawPips();
    const id = d.room, from = { x: RX[id] + 185, y: BASE + 4 }, to = { x: RX[id] + (Math.random() * 60 - 30), y: BASE - DRY - STEP * NS.room(this.S, id).bags - 4 };
    const b = this.add.image(from.x, from.y, 'dot').setTint(0xb8a88a).setScale(0.5).setDepth(40);
    this.tweens.addCounter({ from: 0, to: 1, duration: 560, ease: 'Sine.inOut', onUpdate: (tw: any) => { const t = tw.getValue(); b.x = from.x + (to.x - from.x) * t; b.y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 150; b.angle += 12; }, onComplete: () => { b.destroy(); this.dust.explode(6, to.x, to.y); } });
    this.tweens.add({ targets: this.worker('bag').g, scaleY: 0.92, duration: 80, yoyo: true });
    if (d.n >= DIG_TAPS) {
      this.time.delayedCall(560, () => {
        if (this.dig !== d) return;
        this.cancelDig();
        const r = NS.bag(this.S, id); if (!r.ok) return this.fail(r.code);
        delete this.readings[id]; this.hideBadge(id); this.drawRoom(id, true); SFX.dirt(); this.cameras.main.shake(180, 0.004); this.dust.explode(22, RX[id], BASE - DRY - STEP * r.bags);
        this.refresh();
      });
      this.digObjs.hit.disableInteractive();
    } else this.refresh();
  }

  // ---------------------------------------------------------------- bedtime
  beginNight(id: string) {
    this.tool = null; this.tip = null; if (this.dig) this.cancelDig(); this.moveKeeper(id);
    if (NS.flareTonight(this.S) > 0) {
      this.alarm = { room: id }; SFX.siren();
      const red = this.add.rectangle(W / 2, H / 2, W, H, 0xff2a2a, 0.0).setDepth(50); this.tweens.add({ targets: red, alpha: 0.16, duration: 400, yoyo: true, repeat: -1 });
      const sir = icon(this, 'siren', W / 2, 180, 64, C.ouch).setDepth(112); this.tweens.add({ targets: sir, angle: 14, scale: sir.scale * 1.12, duration: 160, yoyo: true, repeat: -1 });
      const fuse = this.add.graphics().setDepth(112); const t0 = this.time.now;
      const ev = this.time.addEvent({ delay: 30, loop: true, callback: () => { const p = Math.max(0, 1 - (this.time.now - t0) / ALARM_MS); fuse.clear().fillStyle(0xffffff, 0.2).fillRoundedRect(W / 2 - 140, 222, 280, 10, 5).fillStyle(C.ouch, 1).fillRoundedRect(W / 2 - 140, 222, 280 * p, 10, 5); } });
      this.alarmObjs = [red, sir, fuse, ev];
      this.alarm.timer = this.time.delayedCall(ALARM_MS, () => this.endAlarm(id));
      return this.refresh();
    }
    this.runNight(id, id);
  }
  endAlarm(shelter: string) {
    if (!this.alarm) return;
    const slept = this.alarm.room; this.alarm.timer?.remove(); this.alarm = null;
    this.alarmObjs.forEach((o) => (o.destroy ? o.destroy() : o.remove())); this.alarmObjs = [];
    this.runNight(slept, shelter);
  }
  runNight(slept: string, shelter: string) {
    const S = this.S, fin = shelter !== slept && S.air >= 1 ? shelter : slept;
    const r0 = NS.room(S, fin), f = NS.flareTonight(S), d = Math.min(4, r0.dirt), bags = r0.bags;
    this.cut = true; this.moveKeeper(fin, true); this.setCaption(''); this.hand.setVisible(false);
    const res = NS.sleep(S, slept, shelter);
    res.quake = null; if (this.sci.sensor) { const id = QUAKE_FINDS[this.sci.nights++]; this.sci.data++; if (id) { this.sci.found.push(id); res.quake = id; } else res.quake = 'data'; }
    this.lastRes = res;
    this.stick({ kind: 'night', room: res.room, day: res.day, units: res.units, face: res.face });
    res.trays.forEach((t: any) => this.stick({ kind: 'seed', room: t.room, day: res.day, state: t.state }));
    if (this.lv.readings !== 'easy') { Object.keys(this.readings).forEach((k) => this.hideBadge(k)); this.readings = {}; }
    this.reveal(res.room);
    this.refreshDock();
    const x0 = RX[fin];
    // dim the world, keep the room, the sun and the keeper bright
    const dark = this.add.rectangle(W / 2, H / 2, W, H, 0x02030c, 0).setDepth(55); this.tweens.add({ targets: dark, alpha: 0.62, duration: 600 });
    const lift = (o: any, dp: number) => { o._d = o.depth; o.setDepth(dp); };
    lift(this.rv[fin].c, 58); lift(this.sun, 58); lift(this.keeper, 59);
    const crewA: any[] = CREW.map((m) => this.crew[m.id]);
    crewA.forEach((a: any, i: number) => { a._d = a.depth; a.setDepth(59); a.g.scaleX = 1; this.tweens.add({ targets: a, x: x0 - 100 + i * 45, y: BASE - 4, scale: 0.8, duration: 450 + i * 80 }); });
    this.hideBadge(fin);
    this.tweens.add({ targets: this.keeper, x: x0 + 40, y: BASE - 4, scale: 0.8, duration: 450 });
    const zz = icon(this, 'moon-stars', x0 - 50, BASE - 100, 30, 0xb8c6ff).setDepth(59); this.tweens.add({ targets: zz, y: zz.y - 22, alpha: 0.2, duration: 1600, repeat: -1 });
    // live counter
    const cnt = this.add.container(x0, BASE - DRY - STEP * bags - 40).setDepth(60); const cg = this.add.graphics(), cic = icon(this, 'smiley-f', -30, 0, 36, C.safe), cn = text(this, 26, 1, '0', 32, '#ffffff', 800);
    cnt.add([cg, cic, cn]);
    let hits = 0;
    const setCount = (n: number) => { const fc = NS.face(n), col = FACE_COLOR[fc]; cg.clear().fillStyle(0x0c1230, 0.92).fillRoundedRect(-62, -28, 124, 56, 28).lineStyle(2.5, col, 1).strokeRoundedRect(-62, -28, 124, 56, 28); cic.setTexture('i-' + FACE_ICON[fc]).setTint(col); cn.setText(String(n)); };
    setCount(0);
    const skip = pill(this, W - 70, 676, 64, 44, { icon: 'skip-forward', depth: 130, onClick: () => finish(true) });
    this.nightObjs = [dark, zz, cnt, skip];
    if (this.sci.sensor && this.sensorObj) { this.nightEv.push(this.time.delayedCall(3300, () => { this.cameras.main.shake(900, 0.0035); SFX.hit(); this.tweens.add({ targets: this.sensorObj, scale: 1.5, duration: 160, yoyo: true, repeat: 3 }); })); }
    if (f > 0) {
      this.time.delayedCall(250, () => { SFX.flare(); this.cameras.main.flash(350, 255, 190, 110); this.tweens.add({ targets: this.sun, scale: this.sun.scale * 1.3, duration: 260, yoyo: true, repeat: 2 }); if (f >= 2) this.cameras.main.shake(900, 0.004); });
    }
    // the rays: every ray that gets in is one beep, exactly res.units of them
    const rays: any[] = [];
    const ct = NS.COSMIC[d], st = f * NS.STORM_MULT[d];
    for (let i = 0; i < ct; i++) rays.push({ storm: false, through: true }); for (let i = 0; i < 4 - ct; i++) rays.push({ storm: false, through: false });
    for (let i = 0; i < st; i++) rays.push({ storm: true, through: true }); for (let i = 0; i < f * 3 - st; i++) rays.push({ storm: true, through: false });
    for (let i = rays.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rays[i], rays[j]] = [rays[j], rays[i]]; }
    const span = 6200, outer = { rx: DR + STEP * bags + (bags ? 0 : 7), ry: DRY + STEP * bags + (bags ? 0 : 7) };
    let done = 0, over = false;
    const finish = (skipped: boolean) => {
      if (over) return; over = true;
      this.nightEv.forEach((e) => e.remove()); this.nightEv = [];
      this.tweens.killTweensOf(this.nightObjs.concat([this.sun])); this.children.list.filter((o: any) => o.getData && o.getData('ray')).forEach((o: any) => { this.tweens.killTweensOf(o); o.destroy(); });
      setCount(res.units);
      this.tweens.add({ targets: dark, alpha: 0, duration: 700 });
      this.time.delayedCall(650, () => {
        this.nightObjs.forEach((o) => o.destroy && o.destroy()); this.nightObjs = [];
        this.rv[fin].c.setDepth(10); this.sun.setDepth(3); this.keeper.setDepth(20);
        this.keeper.setScale(1); this.keeper.setPosition(x0 + 100, BASE + 38);
        crewA.forEach((a: any) => { a.setDepth(a._d ?? 20); a.setScale(1); a.setPosition(a.home, BASE + 38); });
        ids.forEach((id) => this.drawRoom(id, false));
        this.cut = false; this.refresh(); this.openMorning(res);
        this.cameras.main.flash(500, 255, 214, 150, true); SFX.morning();
      });
    };
    rays.forEach((ry, i) => {
      const at = 900 + (span - 900) * ((i + Math.random() * 0.6) / rays.length);
      const ev = this.time.delayedCall(at, () => {
        if (over) return;
        const S0 = ry.storm ? { x: this.sun.x + (Math.random() * 60 - 30), y: this.sun.y + 30 } : { x: 100 + Math.random() * 1000, y: -30 };
        const T = { x: x0 + (Math.random() * 130 - 65), y: BASE - 36 - Math.random() * 60 };
        let E = T;
        if (!ry.through) for (let k = 0; k <= 80; k++) { const t = k / 80, x = S0.x + (T.x - S0.x) * t, y = S0.y + (T.y - S0.y) * t; if (((x - x0) / outer.rx) ** 2 + ((y - BASE) / outer.ry) ** 2 <= 1 && y <= BASE) { E = { x, y }; break; } }
        const st = this.add.image(S0.x, S0.y, 'glow').setTint(ry.storm ? 0xffb347 : 0xbfe9ff).setDepth(62).setScale(ry.storm ? 0.36 : 0.26); st.setData('ray', true); this.tweens.add({ targets: st, alpha: { from: 0.55, to: 1 }, duration: 130, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: st, x: E.x, y: E.y, duration: 620 + Math.random() * 260, ease: 'Quad.in', onComplete: () => {
          this.tweens.killTweensOf(st); st.destroy(); done++;
          if (ry.through) { hits++; setCount(Math.min(hits, res.units)); this.hot.explode(14, E.x, E.y); SFX.hit(); SFX.beep(); this.cameras.main.shake(90, 0.003); const fl = this.add.image(E.x, E.y, 'glow').setTint(0xfff1c0).setScale(0.3).setDepth(63); this.tweens.add({ targets: fl, scale: 1, alpha: 0, duration: 300, onComplete: () => fl.destroy() }); }
          else { this.dust.explode(8, E.x, E.y); this.hot.explode(5, E.x, E.y); SFX.block(); }
        } });
      });
      this.nightEv.push(ev);
    });
    this.nightEv.push(this.time.delayedCall(span + 1300, () => finish(false)));
  }

  // ---------------------------------------------------------------- modals
  openModal(w: number, h: number, kind: string) {
    this.closeModal(); this.modalKind = kind; this.hand.setVisible(false);
    const back = this.add.rectangle(W / 2, H / 2, W, H, 0x02030c, 0.66).setDepth(1000).setInteractive();
    const pn = panel(this, W / 2, H / 2, w, h); const c = this.add.container(W / 2, H / 2).setDepth(1002);
    c.setAlpha(0).setScale(0.96); this.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 200 });
    this.modalObjs = [back, pn, c]; return c;
  }
  closeModal() { this.modalObjs.forEach((o) => o.destroy()); this.modalObjs = []; if (this.modalKind) { this.modalKind = ''; if (this.scene.isActive()) this.refresh(); } }
  okBtn(c: any, y: number, fn?: () => void, ico = 'check-circle', label = 'OK') {
    const b = pill(this, 0, y, 190, 58, { label, icon: ico, fill: C.sun, fillA: 1, stroke: 0xffe0a0, strokeA: 0.9, color: 0x1b1300, size: 24, onClick: () => { SFX.tap(); (fn || (() => this.closeModal()))(); } });
    c.add(b); return b;
  }
  rows(c: any, rows: any[], y0: number, x0 = -300) {
    rows.forEach((r, i) => { const y = y0 + i * 58; c.add(icon(this, r[0], x0, y, 38, r[1])); c.add(text(this, x0 + 40, y, r[2], 24, '#eef1ff', 500, [0, 0.5])); });
  }
  info(kind: string) {
    const S = this.S, c = this.openModal(760, 470, 'info');
    const n = this.nights[Math.min(S.day, NS.DAYS) - 1];
    if (kind === 'beep') { c.add(text(this, 0, -170, '1 beep = 1 space ray', 36, '#ffd98a', 700)); this.rows(c, [['radioactive', C.ouch, 'Space rays never stop.'], ['shovel', C.dust, 'Moon dirt blocks some.'], ['smiley-f', C.safe, '3 or less: safe'], ['smiley-meh-f', C.careful, '4 to 7: careful'], ['smiley-sad-f', C.ouch, '8 or more: ouch']], -95); }
    else if (kind === 'earth') { c.add(text(this, 0, -170, 'Mission Control', 36, '#ffd98a', 700)); this.rows(c, [['broadcast', C.air, 'Radio takes 1.3 seconds to reach Earth'], ['flask', 0xa6f0cf, 'Send your finds to NASA'], ['planet', 0x7fb4ff, 'NASA is still learning about the Moon']], -90); }
    else if (kind === 'sun') {
      c.add(text(this, 0, -170, 'Sun storms', 36, '#ffd98a', 700));
      this.rows(c, [['sun', C.sun, 'Sometimes the Sun sends a storm of rays.'], ['shovel', C.dust, 'Thick Moon dirt blocks storm rays best.'], ['sparkle', C.careful, n ? `Tonight is real: ${n.live ? 'today' : fmtDate(n.date)}` : 'Tonight is a real night'], ['radioactive', C.ouch, `Storm tonight: ${STORM_WORDS[n ? n.size : 0]}`]], -95);
    } else if (kind === 'air') { c.add(text(this, 0, -170, 'Air', 36, '#ffd98a', 700)); this.rows(c, [['moon-stars', 0xb8c6ff, '-2 every night'], ['shovel', C.dust, '-1 each dig'], ['person-simple-run', C.ouch, '-1 running in a storm'], ['plant', C.safe, '+1 each morning per healthy plant']], -90); }
    else if (kind === 'power') { c.add(text(this, 0, -170, 'Power', 36, '#ffd98a', 700)); this.rows(c, [['sun', C.sun, '+3 every morning'], ['lightning', C.sun, 'Save up to 5'], ['gauge', 0xffffff, 'Check, Dirt and Seeds use 1']], -90); }
    else if (kind === 'hearts') { c.add(text(this, 0, -170, 'Hearts', 36, '#ffd98a', 700)); this.rows(c, [['smiley-f', C.safe, 'Safe night: 0 lost'], ['smiley-meh-f', C.careful, 'Careful night: 1 lost'], ['smiley-sad-f', C.ouch, 'Ouch night: 2 lost'], ['wind', C.air, 'No air at bedtime: 1 more']], -90); }
    this.okBtn(c, 185);
  }
  openMorning(res: any) {
    const c = this.openModal(760, 620, 'morning'), col = FACE_COLOR[res.face];
    c.add(text(this, 0, -214, `Night ${res.day} is over`, 30, '#ffd98a', 700));
    c.add(icon(this, FACE_ICON[res.face], -120, -120, 116, col));
    const n = text(this, 20, -122, String(res.units), 104, '#ffffff', 800, [0, 0.5]); c.add(n);
    c.add(icon(this, 'radioactive', 150, -120, 52, C.ouch));
    c.add(text(this, 0, -44, res.units === 1 ? 'ray got in' : 'rays got in', 26, '#cfd6f5', 500));
    if (res.heartsLost) { for (let i = 0; i < res.heartsLost; i++) c.add(icon(this, 'heart-break', -20 - (res.heartsLost - 1) * 24 + i * 48, 22, 44, C.heart)); c.add(text(this, 0, 68, `${res.heartsLost} ${res.heartsLost > 1 ? 'hearts' : 'heart'} lost`, 24, '#ffb3bd', 600)); }
    else { c.add(icon(this, 'check-circle', -20, 22, 44, C.safe)); c.add(text(this, 0, 68, 'No hearts lost', 24, '#a8f0cf', 600)); }
    let y = 112;
    if (res.airShort) { c.add(icon(this, 'wind', -20, y, 30, C.ouch)); c.add(text(this, 14, y, 'No air at bedtime', 22, '#ffb3bd', 500, [0, 0.5])); y += 40; }
    if (res.airGain) { c.add(icon(this, 'plant', -70, y, 30, C.safe)); c.add(icon(this, 'wind', -34, y, 30, C.air)); c.add(text(this, -6, y, `+${res.airGain} air`, 22, '#cfeaff', 600, [0, 0.5])); y += 40; }
    if (res.quake) { const d = res.quake === 'data' ? null : discoById(res.quake); c.add(icon(this, 'waveform', -150, y, 30, 0x9fd8ff)); c.add(text(this, -116, y, d ? d.name + '!' : '+1 data', 22, d ? '#ffe2a0' : '#cfeaff', 600, [0, 0.5])); if (d) c.add(icon(this, d.tag === 'seen' ? 'check-circle' : 'magnifying-glass', 70, y, 24, d.tag === 'seen' ? C.safe : C.careful)); y += 40; }
    const fy = Math.max(y + 10, 168);
    const F = NSData.SEED_FACTS, worst = res.trays.some((t: any) => t.state === 'hurt') ? 'hurt' : res.trays.some((t: any) => t.state === 'droopy') ? 'droopy' : res.trays.length ? 'healthy' : '';
    if (worst) { const t = text(this, 0, fy, F[worst].text, 17, '#aab4dc', 400); t.setWordWrapWidth(640); c.add(t); c.add(text(this, 0, fy + 30, 'NASA data: ' + F[worst].src.replace('NASA study ', ''), 14, '#7d88b6', 400)); }
    this.okBtn(c, 272, () => this.closeMorning(), this.S.phase === 'report' || this.S.phase === 'rescued' ? 'rocket-launch' : 'check-circle', this.S.phase === 'report' || this.S.phase === 'rescued' ? 'Land' : 'OK');
    // the number counts up
    let k = 0; n.setText('0'); this.time.addEvent({ delay: 160, repeat: Math.max(0, res.units - 1), callback: () => { if (!n.active) return; k++; n.setText(String(k)); } });
  }
  closeMorning() {
    this.closeModal();
    if (this.lastRes?.quake && this.S.phase === 'day') this.sendToNasa();
    if (this.S.phase === 'report' || this.S.phase === 'rescued') { this.registry.set('S', this.S); this.cameras.main.fadeOut(450, 4, 6, 26); this.time.delayedCall(470, () => this.scene.start('Report')); }
  }
  openJournal() {
    const S = this.S, c = this.openModal(1000, 580, 'journal');
    c.add(icon(this, 'notebook', -440, -246, 40, C.sun)); c.add(text(this, -410, -246, 'Journal', 34, '#ffd98a', 700, [0, 0.5]));
    ids.forEach((id, i) => { const x = -170 + i * 290 + 70; c.add(text(this, x, -190, id + '  ' + NAMES[id], 22, '#cfd6f5', 600)); });
    const days = [...new Set(this.journal.map((j) => j.day))].sort() as number[];
    if (!days.length) c.add(text(this, 0, -20, 'Use Check to fill your journal.', 26, '#98a3d0', 400));
    days.forEach((day, di) => {
      const y = -135 + di * 74; c.add(text(this, -440, y, 'Day ' + day, 22, '#98a3d0', 600, [0, 0.5]));
      const line = this.add.graphics().lineStyle(1, 0xffffff, 0.12).lineBetween(-450, y + 36, 450, y + 36); c.add(line);
      ids.forEach((id, i) => {
        let x = -240 + i * 290; const list = this.journal.filter((j) => j.day === day && j.room === id);
        list.forEach((e) => {
          if (e.kind === 'beep' || e.kind === 'night') { c.add(icon(this, e.kind === 'beep' ? 'gauge' : 'moon-stars', x, y, 22, 0xaab4dc)); c.add(icon(this, FACE_ICON[e.face], x + 28, y, 28, FACE_COLOR[e.face])); c.add(text(this, x + 52, y + 1, String(e.units), 22, '#ffffff', 700, [0, 0.5])); x += 92; }
          else if (e.kind === 'seed') { c.add(icon(this, e.state === 'hurt' ? 'leaf' : 'plant', x + 8, y, 28, TRAY_TINT[e.state])); x += 44; }
          else if (e.kind === 'clue') { c.add(icon(this, e.state === 'dead' ? 'leaf' : 'plant', x + 8, y, 28, e.state === 'dead' ? 0x8d5a52 : 0x4fa882)); c.add(icon(this, 'sparkle', x + 28, y - 10, 16, C.sun)); x += 48; }
        });
      });
    });
    this.okBtn(c, 246);
  }
}
