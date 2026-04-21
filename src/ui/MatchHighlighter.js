// ============================================
// MatchHighlighter.js — Shows correct/incorrect cells
// ============================================
import { CELL_SIZE, GRID_PADDING, GRID_OFFSET_X, GRID_OFFSET_Y, COLORS } from '../config/constants.js';

export class MatchHighlighter {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} offsetX
   * @param {number} offsetY
   */
  constructor(scene, offsetX, offsetY) {
    this.scene = scene;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.indicators = [];
  }

  /**
   * Show match/mismatch indicators on the grid
   * @param {(string|null)[][]} playerGrid
   * @param {(string|null)[][]} targetPattern
   * @param {number} rows
   * @param {number} cols
   */
  show(playerGrid, targetPattern, rows, cols) {
    this.clear();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const target = targetPattern[row]?.[col] || null;
        const player = playerGrid[row]?.[col] || null;

        // Only show indicators where there's supposed to be something
        if (target === null && player === null) continue;

        const x = this.offsetX + col * (CELL_SIZE + GRID_PADDING) + CELL_SIZE / 2;
        const y = this.offsetY + row * (CELL_SIZE + GRID_PADDING) + CELL_SIZE / 2;

        const isMatch = target === player;
        const icon = isMatch ? '✓' : '✗';
        const color = isMatch ? '#00ff88' : '#ff4444';

        const indicator = this.scene.add.text(x + 22, y - 22, icon, {
          fontSize: '16px',
          fontStyle: 'bold',
          color: color,
        }).setOrigin(0.5).setAlpha(0).setDepth(50);

        this.indicators.push(indicator);

        // Animate in simultaneously
        this.scene.tweens.add({
          targets: indicator,
          alpha: 1,
          scaleX: 1.2, scaleY: 1.2,
          duration: 200,
          delay: 0, // No stagger, appear all at once
          yoyo: false,
        });
      }
    }

    // Auto-hide after 2 seconds
    this.scene.time.delayedCall(2500, () => {
      this.clear();
    });
  }

  clear() {
    this.indicators.forEach(ind => {
      if (ind && ind.destroy) {
        this.scene.tweens.add({
          targets: ind,
          alpha: 0,
          duration: 150,
          onComplete: () => ind.destroy(),
        });
      }
    });
    this.indicators = [];
  }
}
