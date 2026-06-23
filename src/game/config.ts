import Phaser from 'phaser';
import { PrototypeScene } from './scenes/PrototypeScene';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions';

export { GAME_HEIGHT, GAME_WIDTH };

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
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
