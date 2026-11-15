import Phaser from 'phaser';
import { frame, W, H } from '../ui';

const ICONS = ['gauge','shovel','plant','moon-stars','lightning','notebook','speaker-high','speaker-slash','info','bed','sun','siren','person-simple-run','wind','meteor','sparkle','snowflake','drop','skull','leaf','question','arrow-right','check-circle','play','skip-forward','rocket-launch','users-three','microscope','heart-break','lock','magnifying-glass','warning',
  'smiley-f','smiley-meh-f','smiley-sad-f','star-f','heart-f','hand-pointing-f',
  'flask','wrench','airplane-tilt','stethoscope','broadcast','mountains','waveform','radioactive','atom','x-circle','hard-hat','planet','cube','fire','stack','target'];

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const bar = this.add.rectangle(W / 2, H / 2, 10, 4, 0xffb020).setOrigin(0, 0.5);
    frame(this);
    this.load.on('progress', (p: number) => bar.setSize(300 * p, 4).setPosition(W / 2 - 150, H / 2));
    ICONS.forEach((n) => this.load.svg('i-' + n, `icons/${n}.svg`, { width: 128, height: 128 }));
    ['earthset', 'sun', 'earth', 'moon'].forEach((n) => this.load.image('pic-' + n, `img/${n}.webp`));
  }
  create() {
    const mk = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
      const t = this.textures.createCanvas(key, w, h); draw(t.getContext()); t.refresh();
    };
    mk('dot', 24, 24, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(12, 12, 11, 0, 7); c.fill(); });
    mk('glow', 256, 256, (c) => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
    mk('streak', 120, 10, (c) => { const g = c.createLinearGradient(0, 0, 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.beginPath(); c.roundRect(0, 2, 120, 6, 3); c.fill(); });
    mk('sunrays', 512, 512, (c) => {
      c.translate(256, 256);
      for (let i = 0; i < 16; i++) { c.rotate((Math.PI * 2) / 16); const g = c.createLinearGradient(0, 0, 0, -250); g.addColorStop(0, 'rgba(255,255,255,.0)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-9, -70); c.lineTo(0, -250); c.lineTo(9, -70); c.fill(); }
    });
    mk('sky', 8, 720, (c) => { const g = c.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, '#04061a'); g.addColorStop(0.62, '#0d1538'); g.addColorStop(1, '#1b2350'); c.fillStyle = g; c.fillRect(0, 0, 8, 720); });
    mk('ground', 1280, 230, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, '#c2b69f'); g.addColorStop(0.18, '#a99d86'); g.addColorStop(1, '#5d5546');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, 46); c.quadraticCurveTo(640, -26, 1280, 46); c.lineTo(1280, 230); c.lineTo(0, 230); c.closePath(); c.fill();
      c.save(); c.clip();
      let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 26; i++) { const x = rnd() * 1280, y = 70 + rnd() * 150, rx = 14 + rnd() * 46, ry = rx * (0.22 + rnd() * 0.12); c.fillStyle = 'rgba(40,32,22,.20)'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,245,225,.16)'; c.beginPath(); c.ellipse(x, y - ry * 0.55, rx * 0.92, ry * 0.5, 0, 0, 7); c.fill(); }
      c.restore();
    });
    // round NASA photos
    const circ = (key: string, src: string, size: number) => {
      const img = this.textures.get(src).getSourceImage() as HTMLImageElement;
      mk(key, size, size, (c) => { c.beginPath(); c.arc(size / 2, size / 2, size / 2, 0, 7); c.clip(); const s = Math.max(size / img.width, size / img.height); c.drawImage(img, (size - img.width * s) / 2, (size - img.height * s) / 2, img.width * s, img.height * s); });
    };
    circ('sunC', 'pic-sun', 256); circ('earthC', 'pic-earth', 256); circ('moonC', 'pic-moon', 256);
    const go = () => this.scene.start('Title');
    // the font must be ready before any text is drawn
    (document as any).fonts.load('700 24px Lexend').then(go, go);
  }
}
