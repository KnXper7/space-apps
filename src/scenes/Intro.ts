import Phaser from 'phaser';
import { frame, W, H, C, text, icon } from '../ui';
import { SFX } from '../audio';
import { stars } from './Title';
import { CREW } from '../crew';

// Four quick beats. Tap anywhere to skip.
export class Intro extends Phaser.Scene {
  constructor() { super('Intro'); }
  create() {
    frame(this);
    this.add.image(W / 2, H / 2, 'sky').setDisplaySize(W, H);
    stars(this, 80);
    let go = false;
    const next = () => { if (go) return; go = true; SFX.tap(); this.cameras.main.fadeOut(300, 4, 6, 26); this.time.delayedCall(320, () => this.scene.start('Play')); };
    this.input.once('pointerdown', next);
    this.input.keyboard?.once('keydown', next);

    const LAST = 3;
    const beat = (i: number, build: (c: Phaser.GameObjects.Container) => void, words: string) => {
      this.time.delayedCall(i * 2900, () => {
        if (go) return;
        const c = this.add.container(W / 2, H / 2).setAlpha(0);
        build(c);
        const t = text(this, 0, 215, words, 38, '#ffffff', 700); t.setWordWrapWidth(980); c.add(t);
        this.tweens.add({ targets: c, alpha: 1, duration: 450 });
        this.tweens.add({ targets: c, alpha: 0, duration: 450, delay: 2350, onComplete: () => c.destroy() });
        SFX.whoosh();
        if (i === LAST) this.time.delayedCall(2700, next);
      });
    };
    beat(0, (c) => {
      const e = this.add.image(-210, -10, 'earthC').setDisplaySize(190, 190);
      const m = this.add.image(250, -10, 'moonC').setDisplaySize(120, 120);
      const r = icon(this, 'rocket-launch', -80, -10, 70, C.sun);
      c.add([e, m, r]); this.tweens.add({ targets: r, x: 150, y: -50, duration: 2400, ease: 'Sine.inOut' });
    }, 'Welcome, Mission Commander! It is your first day on the Moon.');
    beat(1, (c) => {
      CREW.forEach((m, j) => {
        const x = -230 + j * 230, g = this.add.graphics().fillStyle(m.col, 0.18).fillCircle(x, -30, 74).lineStyle(3, m.col, 1).strokeCircle(x, -30, 74);
        const ic = icon(this, m.ico, x, -30, 80, m.col), n = text(this, x, 70, m.name, 30, '#ffffff', 800), r = text(this, x, 104, m.role, 20, '#98a3d0', 500);
        const grp = this.add.container(0, 0, [g, ic, n, r]).setScale(0); c.add(grp);
        this.tweens.add({ targets: grp, scale: 1, duration: 420, delay: 300 + j * 300, ease: 'Back.out', onStart: () => SFX.tap() });
      });
    }, 'This is your crew. You decide who does what.');
    beat(2, (c) => {
      const glow = this.add.image(-250, -20, 'glow').setTint(0xff9a1f).setScale(1.4); const sun = this.add.image(-250, -20, 'sunC').setDisplaySize(150, 150);
      c.add([glow, sun]); this.tweens.add({ targets: glow, alpha: 0.5, scale: 1.8, duration: 500, yoyo: true, repeat: -1 });
      for (let i = 0; i < 6; i++) { const p = this.add.image(-170, -40 + i * 12, 'glow').setTint(0xffb347).setScale(0.3).setAlpha(0.9); c.add(p); this.tweens.add({ targets: p, x: 190 + i * 14, y: 30 + i * 6, duration: 1300, delay: i * 220, repeat: -1 }); }
      c.add(icon(this, 'bed', 280, 30, 100, 0x9fb0ee));
    }, 'The Sun sends space rays. Moon dirt on the roof blocks them.');
    beat(3, (c) => {
      [['mountains', 'Rocks'], ['waveform', 'Quakes'], ['broadcast', 'Send to NASA']].forEach(([n, l], i) => {
        const x = -250 + i * 250; const b = this.add.graphics().fillStyle(0xffffff, 0.1).fillCircle(x, -10, 62).lineStyle(1.5, 0xffffff, 0.3).strokeCircle(x, -10, 62);
        const ic = icon(this, n, x, -10, 70, 0xffffff), t = text(this, x, 86, l, 24, '#cfd6f5', 500); c.add([b, ic, t]);
        this.tweens.add({ targets: ic, y: -22, duration: 400, yoyo: true, delay: 300 + i * 220 });
      });
    }, 'Find out what the Moon is made of. Keep your crew safe.');
    text(this, W / 2, 690, 'tap to skip', 16, '#7f8ab8', 400).setAlpha(0.8);
    this.cameras.main.fadeIn(350, 4, 6, 26);
  }
}
