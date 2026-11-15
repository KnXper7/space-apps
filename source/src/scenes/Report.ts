import Phaser from 'phaser';
import { W, H, C, frame, icon, text, pill } from '../ui';
import { SFX } from '../audio';
import { openGrownups } from '../overlay';
import { CONFIG } from '../config';
import { stars } from './Title';
import { SCIENCE_GOAL } from '../crew';
declare const NS: any;

const NAMES: any = { A: 'Quarters', B: 'Bio Lab', C: 'Geo Lab' };
const WHY = [['rays', 'radioactive', 'Rays'], ['cold', 'snowflake', 'Cold'], ['water', 'drop', 'Water'], ['poison', 'skull', 'Poison']];

export class Report extends Phaser.Scene {
  answers: any = {}; S: any; land: any;
  constructor() { super('Report'); }
  create() {
    frame(this);
    (window as any).__report = this;
    this.S = this.registry.get('S'); this.answers = {};
    this.add.image(W / 2, H / 2, 'sky').setDisplaySize(W, H);
    const bg = this.add.image(W / 2, H / 2, 'pic-earthset').setAlpha(0.28); bg.setScale(Math.max(W / bg.width, H / bg.height));
    stars(this, 60);
    const rescued = this.S.phase === 'rescued';
    this.add.container(W / 2, 64, [icon(this, 'rocket-launch', -250, 0, 50, C.sun), text(this, 20, 0, rescued ? 'The crew came early!' : 'The crew is landing!', 42, '#ffffff', 700)]);
    this.row(190, 'users-three', 0xffffff, 'Safest room for the crew?', 'crewRoom', ['A', 'B', 'C']);
    this.row(340, 'leaf', 0xff8f84, 'Where did the old seeds die?', 'mysteryRoom', ['A', 'B', 'C']);
    this.row(490, 'question', C.sun, 'Why did they die?', 'why', WHY.map((w) => w[0]));
    this.land = pill(this, W / 2, 640, 320, 72, { label: 'Land the crew', icon: 'rocket-launch', fill: C.sun, fillA: 1, stroke: 0xffe0a0, strokeA: 0.9, color: 0x1b1300, size: 28, iconSize: 34, onClick: () => this.submit() });
    this.land.setEnabled(false);
    this.cameras.main.fadeIn(450, 4, 6, 26);
  }
  row(y: number, ic: string, tint: number, label: string, key: string, opts: string[]) {
    icon(this, ic, 88, y, 44, tint); text(this, 124, y, label, 28, '#ffffff', 600, [0, 0.5]);
    const n = opts.length, step = n === 3 ? 124 : 112, x0 = W - 110 - (n - 1) * step;
    const btns: any[] = [];
    opts.forEach((o, i) => {
      const x = x0 + i * step, c = this.add.container(x, y);
      const g = this.add.graphics(); c.add(g);
      const why = WHY.find((w) => w[0] === o);
      const mid = why ? icon(this, why[1], 0, -4, 40, 0xffffff) : text(this, 0, -2, o, 36, '#ffffff', 800);
      c.add(mid);
      const sub = text(this, 0, 58, why ? why[2] : NAMES[o], 15, '#aab4dc', 500); c.add(sub);
      const hit = this.add.rectangle(0, 8, 98, 112, 0xffffff, 0.001).setInteractive({ useHandCursor: true }); c.add(hit);
      const paint = () => { const on = this.answers[key] === o; g.clear().fillStyle(on ? C.sun : 0xffffff, on ? 1 : 0.1).fillCircle(0, 0, 40).lineStyle(on ? 3 : 1.5, on ? 0xffe0a0 : 0xffffff, on ? 1 : 0.3).strokeCircle(0, 0, 40); (mid as any).setTint ? (mid as any).setTint(on ? 0x1b1300 : 0xffffff) : (mid as any).setColor(on ? '#1b1300' : '#ffffff'); };
      (c as any).paint = paint; paint(); btns.push(c);
      hit.on('pointerup', () => { SFX.tap(); this.answers[key] = o; btns.forEach((b) => b.paint()); this.tweens.add({ targets: c, scale: 1.08, duration: 90, yoyo: true }); this.land.setEnabled(!!(this.answers.crewRoom && this.answers.mysteryRoom && this.answers.why)); });
    });
  }
  submit() {
    if (!(this.answers.crewRoom && this.answers.mysteryRoom && this.answers.why)) return;
    SFX.tap();
    const res = NS.finish(this.S, this.answers);
    this.cameras.main.fadeOut(350, 4, 6, 26);
    this.time.delayedCall(370, () => this.showEnd(res));
  }
  showEnd(res: any) {
    this.children.removeAll(true);
    this.add.image(W / 2, H / 2, 'sky').setDisplaySize(W, H);
    const bg = this.add.image(W / 2, H / 2, 'pic-earthset').setAlpha(0.35); bg.setScale(Math.max(W / bg.width, H / bg.height));
    stars(this, 60);
    const sci = this.registry.get('sci'), nFound = sci ? sci.found.length : 0, sciOk = nFound >= SCIENCE_GOAL, count = res.count + (sciOk ? 1 : 0);
    const got = [res.stars.survived, res.stars.safest, res.stars.mystery, sciOk];
    got.forEach((ok, i) => {
      const s = icon(this, 'star-f', W / 2 - 255 + i * 170, 190, 140, ok ? C.sun : 0x39426e).setScale(0).setAlpha(ok ? 1 : 0.7);
      this.tweens.add({ targets: s, scale: 140 / 128, duration: 500, delay: 400 + i * 380, ease: 'Back.out', onStart: () => { if (ok) SFX.stars(1); } });
      if (ok) this.tweens.add({ targets: s, angle: { from: -8, to: 8 }, duration: 1600, yoyo: true, repeat: -1, delay: 1500, ease: 'Sine.inOut' });
    });
    const title = text(this, W / 2, 330, count === 4 ? 'You are a Mission Commander!' : `${count} of 4 stars`, 46, '#ffffff', 800).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500, delay: 1600 });
    const key = res.key, S = this.S;
    const lines = [
      ['heart-f', C.heart, res.stars.survived ? 'You kept the crew safe' : 'The crew came early', res.stars.survived],
      ['users-three', 0xffffff, res.stars.safest ? 'The crew gets the safest room' : 'Safest room was ' + key.crewRooms.join(' or ') + ' (' + key.crewRooms.map((r: string) => NAMES[r]).join(' or ') + ')', res.stars.safest],
      ['leaf', 0xff8f84, res.stars.mystery ? 'Mystery solved: rays hurt the seeds' : 'The seeds died in ' + key.mysteryRoom + ' (' + NAMES[key.mysteryRoom] + '), from rays', res.stars.mystery],
      ['flask', 0xa6f0cf, sciOk ? `You sent ${nFound} finds to NASA` : `${nFound} finds sent. ${SCIENCE_GOAL} earns a star`, sciOk]
    ];
    lines.forEach((l: any, i) => {
      const y = 410 + i * 54, c = this.add.container(W / 2, y).setAlpha(0);
      const t = text(this, 24, 0, l[2], 26, '#eef1ff', 500, [0, 0.5]); const w = t.width + 100;
      c.add([icon(this, l[0], -w / 2 + 20, 0, 36, l[1]), icon(this, l[3] ? 'check-circle' : 'x-circle', 0, 0, 1, 0xffffff).setVisible(false)]);
      t.setX(-w / 2 + 56); c.add(t); c.add(icon(this, l[3] ? 'check-circle' : 'warning', w / 2 + 8, 0, 34, l[3] ? C.safe : C.careful));
      this.tweens.add({ targets: c, alpha: 1, duration: 400, delay: 1900 + i * 250 });
    });
    const again = pill(this, W / 2 - 130, 640, 240, 66, { label: 'Play again', icon: 'play', fill: C.sun, fillA: 1, stroke: 0xffe0a0, strokeA: 0.9, color: 0x1b1300, size: 26, onClick: () => { SFX.tap(); this.scene.start('Title'); } }).setAlpha(0);
    const grown = pill(this, W / 2 + 130, 640, 240, 66, { label: CONFIG.text.facts, icon: 'info', size: 24, onClick: () => { SFX.tap(); openGrownups(this.registry.get('tonight'), this.S.level); } }).setAlpha(0);
    this.tweens.add({ targets: [again, grown], alpha: 1, duration: 400, delay: 2700 });
    if (count > 0) {
      const em = this.add.particles(0, 0, 'dot', { speed: { min: 200, max: 520 }, angle: { min: 215, max: 325 }, lifespan: 2600, gravityY: 520, scale: { start: 0.5, end: 0.2 }, tint: [0xffb020, 0x6be3b0, 0x6fd3ff, 0xff6b7d, 0xffffff], emitting: false, rotate: { min: 0, max: 360 } }).setDepth(50);
      this.time.delayedCall(700, () => { em.explode(30 * count, W / 2, 330); });
    }
    this.cameras.main.fadeIn(450, 4, 6, 26);
  }
}
