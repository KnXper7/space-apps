import Phaser from 'phaser';
import NSmod from './logic.js';
(window as any).NS = NSmod;
import './data.js';
import { Boot } from './scenes/Boot';
import { Title } from './scenes/Title';
import { Intro } from './scenes/Intro';
import { Play } from './scenes/Play';
import { Report } from './scenes/Report';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: 1920, height: 1080, backgroundColor: '#05081c',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, roundPixels: false },
  input: { activePointers: 2 },
  scene: [Boot, Title, Intro, Play, Report]
});
(window as any).__game = game;
