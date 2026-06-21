import Phaser from 'phaser';
import { PrototypeScene } from './scenes/PrototypeScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#041014',
  pixelArt: true,
  scene: [PrototypeScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
