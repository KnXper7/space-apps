// Easy knobs. Change a value, save, and the page reloads. Colors are 0xRRGGBB.
// Page-level styling (buttons, info sheet, Next/Skip bar) lives in src/style.css as CSS variables.
export const CONFIG = {
  // The pointing hand that shows what to tap
  hand: {
    enabled: true,      // false = never show the hand
    size: 44,           // px (design units, the game is 1280x720)
    opacity: 0.92,
    color: 0xffb020,
    shadowOffset: 7,    // how far the shadow sits below the hand
    shadowOpacity: 0.55,
    bob: 1.12,          // pulse size (1 = no pulse)
    bobMs: 520,         // pulse speed
  },
  // "I don't know what to do" help
  hint: {
    idleSeconds: 7,     // no tap for this long = the game suggests the next step (0 = never)
    helpButton: true,   // the ? button on the right
  },
  // Words and buttons in the intro. Keep each line short.
  intro: {
    lines: [
      'Welcome, Mission Commander! It is your first day on the Moon.',
      'This is your crew. You decide who does what.',
      'The Sun sends space rays. Moon dirt on the roof blocks them.',
      'Find out what the Moon is made of. Keep your crew safe.',
    ],
    next: 'Next', start: 'Start', skip: 'Skip',
  },
  // Names shown to players
  text: { facts: 'Mission Facts' },
  // Caption pill (the few words under the Earth and Sun)
  caption: { y: 292, size: 26, bg: 0x0c1230, bgOpacity: 0.82 },
  // Game colors
  colors: {
    bg0: 0x05081c, bg1: 0x0f1740, ink: 0xeef1ff, dim: 0x98a3d0, sun: 0xffb020, safe: 0x6be3b0, careful: 0xffd166, ouch: 0xff6f61,
    air: 0x6fd3ff, heart: 0xff6b7d, dust: 0xa99c86, dust2: 0x8a7f6c, glass: 0xffffff, panel: 0x0c1128,
  },
};
