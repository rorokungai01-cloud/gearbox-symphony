// ============================================
// SparkEffect.js — Particle burst for placement
// ============================================
import { COLORS } from '../config/constants.js';

/**
 * Emits a burst of golden sparks at the specified coordinates
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} color
 */
export function emitSparks(scene, x, y, color = COLORS.GOLD) {
  const particles = scene.add.particles(x, y, 'particle_spark', {
    speed: { min: 50, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: color,
    blendMode: 'ADD',
    lifespan: { min: 300, max: 600 },
    quantity: 12,
    gravityY: 300,
    emitting: false,
  });
  
  particles.setDepth(110);
  particles.explode(12);

  // Auto clean up
  scene.time.delayedCall(1000, () => {
    particles.destroy();
  });
}
