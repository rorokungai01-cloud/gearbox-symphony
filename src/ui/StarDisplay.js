// ============================================
// StarDisplay.js — Star rating display (⭐⭐⭐)
// ============================================
import Phaser from 'phaser';
import { FONT_FAMILY_UI } from '../config/constants.js';

export class StarDisplay {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x — center X
   * @param {number} y — center Y
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.stars = 0;

    // Label
    this.scene.add.text(x, y - 30, 'YOUR SCORE', {
      fontSize: '24px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#888899',
    }).setOrigin(0.5);

    // Star text
    this.starText = this.scene.add.text(x, y + 15, '☆☆☆', {
      fontSize: '50px',
      padding: { top: 10, bottom: 10 }
    }).setOrigin(0.5);
  }

  /**
   * Update displayed stars
   * @param {number} count — 0, 1, 2, or 3
   */
  setStars(count) {
    this.stars = count;
    const arr = [];
    for (let i = 0; i < 3; i++) {
      arr.push(i < count ? '⭐' : '☆');
    }
    this.starText.setText(arr.join(''));

    // Bounce animation on change
    if (count > 0) {
      this.scene.tweens.add({
        targets: this.starText,
        scaleX: 1.3, scaleY: 1.3,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
  }
}
