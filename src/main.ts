import './styles.css';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app container');
}

void new Phaser.Game(gameConfig);
