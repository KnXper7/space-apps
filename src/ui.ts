import Phaser from 'phaser';
import { CONFIG } from './config';

export const W = 1280, H = 720;
export const C = CONFIG.colors;
export const FACE_COLOR: Record<string, number> = { safe: C.safe, careful: C.careful, ouch: C.ouch };
export const FACE_ICON: Record<string, string> = { safe: 'smiley-f', careful: 'smiley-meh-f', ouch: 'smiley-sad-f' };
export const FONT = 'Lexend';
export const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

// The design is drawn in 1280x720 units; the canvas is 1920x1080 and the camera zooms 1.5x so every shape and word is crisp.
export function frame(scene: Phaser.Scene) { scene.cameras.main.setZoom(1.5).centerOn(W / 2, H / 2); }

export function icon(scene: Phaser.Scene, name: string, x: number, y: number, size: number, tint: number = 0xffffff, alpha = 1) {
  const im = scene.add.image(x, y, 'i-' + name).setDisplaySize(size, size).setTint(tint).setAlpha(alpha);
  return im;
}

export function text(scene: Phaser.Scene, x: number, y: number, str: string, size = 24, color: number | string = '#eef1ff', weight = 600, origin: [number, number] = [0.5, 0.5]) {
  const col = typeof color === 'number' ? hex(color) : color;
  const t = scene.add.text(x, y, str, { fontFamily: FONT, fontSize: size + 'px', color: col, fontStyle: String(weight), align: 'center' });
  t.setOrigin(origin[0], origin[1]).setResolution(2);
  return t;
}

export interface PillOpts {
  label?: string; icon?: string; fill?: number; fillA?: number; stroke?: number; strokeA?: number; color?: number | string; size?: number; iconSize?: number;
  depth?: number; onClick?: () => void; radius?: number; weight?: number; aria?: string;
}
export interface Pill extends Phaser.GameObjects.Container { hit: Phaser.GameObjects.Rectangle; label?: Phaser.GameObjects.Text; ico?: Phaser.GameObjects.Image; setEnabled: (e: boolean) => Pill; setLabel: (s: string) => Pill; }

export function pill(scene: Phaser.Scene, x: number, y: number, w: number, h: number, o: PillOpts = {}): Pill {
  const c = scene.add.container(x, y) as Pill;
  const g = scene.add.graphics();
  const r = o.radius ?? h / 2;
  g.fillStyle(o.fill ?? C.glass, o.fillA ?? 0.1).fillRoundedRect(-w / 2, -h / 2, w, h, r);
  g.lineStyle(1.5, o.stroke ?? C.glass, o.strokeA ?? 0.25).strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  c.add(g);
  const hasIcon = !!o.icon, hasLabel = !!o.label;
  const isz = o.iconSize ?? Math.min(h * 0.5, 34);
  const col = o.color ?? '#eef1ff';
  if (hasIcon) {
    const ix = hasLabel ? -w / 2 + isz / 2 + 18 : 0;
    c.ico = icon(scene, o.icon!, ix, 0, isz, typeof col === 'number' ? col : 0xffffff);
    c.add(c.ico);
  }
  if (hasLabel) {
    c.label = text(scene, hasIcon ? isz / 2 + 10 : 0, 0, o.label!, o.size ?? 24, col, o.weight ?? 700);
    c.add(c.label);
  }
  c.hit = scene.add.rectangle(0, 0, Math.max(w, 44), Math.max(h, 44), 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  c.add(c.hit);
  c.setSize(w, h);
  let enabled = true;
  c.setEnabled = (e) => { enabled = e; c.setAlpha(e ? 1 : 0.45); return c; };
  c.setLabel = (s) => { c.label?.setText(s); return c; };
  c.hit.on('pointerover', () => { if (enabled) scene.tweens.add({ targets: c, scale: 1.04, duration: 90 }); });
  c.hit.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 90 }));
  c.hit.on('pointerdown', () => scene.tweens.add({ targets: c, scale: 0.94, duration: 70 }));
  c.hit.on('pointerup', () => { scene.tweens.add({ targets: c, scale: 1.04, duration: 90 }); if (enabled && o.onClick) o.onClick(); });
  if (o.depth != null) c.setDepth(o.depth);
  return c;
}

// A dark glass panel (modal body).
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, depth = 1001) {
  const g = scene.add.graphics().setPosition(x, y).setDepth(depth);
  g.fillStyle(0x0c1230, 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, 28);
  g.lineStyle(1.5, 0xffffff, 0.16).strokeRoundedRect(-w / 2, -h / 2, w, h, 28);
  return g;
}

export function half(g: Phaser.GameObjects.Graphics, rx: number, ry: number, cx = 0, cy = 0, steps = 56) {
  g.beginPath(); g.moveTo(cx - rx, cy);
  for (let i = 0; i <= steps; i++) { const a = Math.PI + (Math.PI * i) / steps; g.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
  g.closePath();
}
export function halfLine(g: Phaser.GameObjects.Graphics, rx: number, ry: number, cx = 0, cy = 0, a0 = 0, a1 = 1, steps = 56) {
  g.beginPath();
  for (let i = 0; i <= steps; i++) { const a = Math.PI + Math.PI * (a0 + (a1 - a0) * (i / steps)); const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); }
}
