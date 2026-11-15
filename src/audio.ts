// WebAudio sound effects only. No speech, no music files: every sound is synthesized here.
let ctx: AudioContext | null = null;
let muted = false;
export const sfxMuted = () => muted;
export function setMuted(m: boolean) { muted = m; }
function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}
function tone(f: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, when = 0, slideTo?: number) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur: number, vol = 0.1, when = 0, lo = 200, hi = 4000) {
  const c = ac(); if (!c) return;
  const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + when;
  s.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(lo, t); f.frequency.exponentialRampToValueAtTime(hi, t + dur);
  g.gain.value = vol; s.connect(f).connect(g).connect(c.destination); s.start(t);
}
export const SFX = {
  tap() { tone(560, 0.07, 'sine', 0.09); },
  no() { tone(200, 0.12, 'sawtooth', 0.07); tone(150, 0.16, 'sawtooth', 0.07, 0.1); },
  beep() { tone(900, 0.09, 'square', 0.05); },
  beeps(n: number) { for (let i = 0; i < Math.min(n, 12); i++) tone(880 + i * 12, 0.09, 'square', 0.05, i * 0.22); },
  hit() { noise(0.18, 0.12, 0, 300, 1800); tone(120, 0.18, 'sine', 0.12, 0, 60); },
  block() { tone(1500, 0.08, 'triangle', 0.07, 0, 900); noise(0.06, 0.05, 0, 2000, 6000); },
  scoop() { noise(0.2, 0.09, 0, 300, 2500); },
  dirt() { tone(95, 0.3, 'sine', 0.2, 0, 50); noise(0.3, 0.08, 0, 200, 900); },
  grow() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'sine', 0.07, i * 0.08)); },
  siren() { for (let i = 0; i < 5; i++) { tone(640, 0.5, 'sawtooth', 0.04, i * 1.0, 900); tone(900, 0.5, 'sawtooth', 0.04, i * 1.0 + 0.5, 640); } },
  whoosh() { noise(0.35, 0.07, 0, 300, 3000); },
  flare() { noise(0.9, 0.1, 0, 200, 3500); tone(70, 0.9, 'sine', 0.14, 0, 40); },
  morning() { [523, 659, 784].forEach((f, i) => tone(f, 0.4, 'sine', 0.08, i * 0.16)); },
  stars(n: number) { for (let i = 0; i < n; i++) tone(784 * Math.pow(1.26, i), 0.35, 'triangle', 0.09, 0.2 + i * 0.28); }
};
