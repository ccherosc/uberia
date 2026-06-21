import './styles.css';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app container');
}

try {
  console.info('Booting Uberia');
  void new Phaser.Game(gameConfig);
  console.info('Uberia booted');
} catch (error) {
  console.error('Uberia boot failed', error);
  throw error;
}
