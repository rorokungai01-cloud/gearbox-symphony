// ============================================
// gameConfig.js — Phaser 3 game configuration
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './constants.js';
import { BootScene } from '../scenes/BootScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { LevelSelectScene } from '../scenes/LevelSelectScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { FreePlayScene } from '../scenes/FreePlayScene.js';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.BG,
  resolution: Math.max(2, window.devicePixelRatio || 1), // Always render at 2x minimum for sharp text
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    roundPixels: true, // Snap rendering to integer coordinates to prevent blurry edge bleeding
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, FreePlayScene],
};
