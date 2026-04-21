// ============================================
// SteamEffect.js — Ambient rising steam
// ============================================
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class SteamEffect {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    
    // Ambient steam rising from the bottom
    this.emitter = scene.add.particles(GAME_WIDTH / 2, GAME_HEIGHT + 75, 'particle_glow', {
      x: { min: -GAME_WIDTH / 2, max: GAME_WIDTH / 2 },
      speedY: { min: -30, max: -90 },
      speedX: { min: -15, max: 15 },
      scale: { start: 3, end: 9 },
      alpha: { start: 0, end: 0.05, yoyo: true },
      tint: 0xaabbcc, // Pale blueish grey steam
      blendMode: 'SCREEN',
      lifespan: { min: 4000, max: 8000 },
      frequency: 200,
    });
    
    // Draw steam behind everything except background
    this.emitter.setDepth(1);
  }

  destroy() {
    if (this.emitter) {
      this.emitter.destroy();
    }
  }
}
