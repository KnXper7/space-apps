import Phaser from 'phaser';
import { frame, W, H, C, text, icon, pill } from '../ui';
import { SFX, setMuted, sfxMuted } from '../audio';
import { openGrownups } from '../overlay';
import { CONFIG } from '../config';
declare const NSData: any;

export function stars(scene: Phaser.Scene, n = 90) {
  for (let i = 0; i < n; i++) {
    const s = scene.add.image(Math.random() * W, Math.random() * H * 0.8, 'dot').setScale(0.1 + Math.random() * 0.2).setAlpha(0.25 + Math.random() * 0.6).setDepth(1);
    if (i % 3 === 0) scene.tweens.add({ targets: s, alpha: 0.1, duration: 900 + Math.random() * 1800, yoyo: true, repeat: -1, delay: Math.random() * 1500 });
  }
}

export class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    frame(this);
    if (!this.registry.has('level')) this.registry.set('level', 'normal');
    if (!this.registry.has('loaded')) {
      this.registry.set('loaded', true);
      NSData.loadTonight().then((t: any) => this.registry.set('tonight', t));
    }
    const bg = this.add.image(W / 2, H / 2, 'pic-earthset');
    bg.setScale(Math.max(W / bg.width, H / bg.height) * 1.04);
    this.tweens.add({ targets: bg, scale: bg.scale * 1.06, duration: 22000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.rectangle(W / 2, H / 2, W, H, 0x04061a, 0.5).setDepth(2);
    const g = this.add.graphics().setDepth(2); g.fillGradientStyle(0x04061a, 0x04061a, 0x04061a, 0x04061a, 0, 0, 0.85, 0.85).fillRect(0, H * 0.45, W, H * 0.55);
    stars(this, 50);

    const t1 = text(this, W / 2, 168, 'Moon Detective', 32, C.sun, 600).setDepth(5);
    const t2 = text(this, W / 2, 262, 'Night Shift', 138, '#ffffff', 800).setDepth(5);
    t2.setShadow(0, 6, 'rgba(0,0,0,.5)', 24, false, true);
    const t3 = text(this, W / 2, 352, 'Protect your room from Sun storms.', 26, '#cfd6f5', 400).setDepth(5);
    [t1, t2, t3].forEach((t, i) => { t.setAlpha(0).setY(t.y + 14); this.tweens.add({ targets: t, alpha: 1, y: t.y - 14, duration: 700, delay: 150 + i * 160, ease: 'Cubic.out' }); });

    const lv = ['easy', 'normal', 'hard'], names: any = { easy: 'Easy', normal: 'Medium', hard: 'Hard' };
    const pills: any[] = [];
    const paint = () => pills.forEach((p, i) => { const on = this.registry.get('level') === lv[i]; p.bgOn.setVisible(on); p.label.setColor(on ? '#1b1300' : '#eef1ff'); });
    lv.forEach((k, i) => {
      const p: any = pill(this, W / 2 - 190 + i * 190, 446, 170, 54, { label: names[k], size: 22, depth: 5, onClick: () => { this.registry.set('level', k); SFX.tap(); paint(); } });
      const on = this.add.graphics().fillStyle(C.sun, 1).fillRoundedRect(-85, -27, 170, 54, 27); p.addAt(on, 1); p.bgOn = on; pills.push(p);
    });
    paint();

    const play = pill(this, W / 2, 548, 280, 80, { label: 'Play', icon: 'play', fill: C.sun, fillA: 1, stroke: 0xffe0a0, strokeA: 0.9, color: 0x1b1300, size: 34, iconSize: 36, depth: 5, onClick: () => { SFX.tap(); this.cameras.main.fadeOut(350, 4, 6, 26); this.time.delayedCall(360, () => this.scene.start('Intro')); } });
    this.tweens.add({ targets: play, scale: 1.04, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    pill(this, 130, 678, 200, 44, { label: CONFIG.text.facts, icon: 'info', size: 18, weight: 500, depth: 5, onClick: () => { SFX.tap(); openGrownups(this.registry.get('tonight'), this.registry.get('level')); } });
    const snd: any = pill(this, W - 56, 678, 52, 44, { icon: 'speaker-high', depth: 5, onClick: () => { setMuted(!sfxMuted()); snd.ico.setTexture(sfxMuted() ? 'i-speaker-slash' : 'i-speaker-high'); if (!sfxMuted()) SFX.tap(); } });
    text(this, W / 2, 692, 'NASA photo: Artemis II Earthset', 14, '#8e99c6', 400).setDepth(5);
    this.cameras.main.fadeIn(400, 4, 6, 26);
  }
}
