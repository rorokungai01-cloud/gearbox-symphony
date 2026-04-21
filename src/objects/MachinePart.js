// ============================================
// MachinePart.js — Base class for all parts
// ============================================
import Phaser from 'phaser';
import { CELL_SIZE, FONT_FAMILY_UI } from '../config/constants.js';

export class MachinePart extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} partType
   * @param {string} iconKey
   * @param {string} labelText
   * @param {number} color
   */
  constructor(scene, x, y, partType, iconKey, labelText, color) {
    super(scene, x, y);
    this.scene = scene;
    this.partType = partType;
    this.partColor = color;

    // Offset to center within the cell
    const cx = CELL_SIZE / 2;
    const cy = CELL_SIZE / 2;

    // The main icon
    if (iconKey.startsWith('icon_')) {
      this.icon = scene.add.image(cx, cy, iconKey).setOrigin(0.5);
      const scale = Math.min(99 / this.icon.width, 99 / this.icon.height);
      this.icon.setScale(scale);
      this.icon.baseScale = scale;
    } else {
      this.icon = scene.add.text(cx, cy, iconKey, {
        fontSize: '36px',
      }).setOrigin(0.5);
      this.icon.baseScale = 1;
    }

    this.add([this.icon]);

    // Add this container to the scene
    scene.add.existing(this);

    // Initial spawn pop
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scaleX: 1, scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Trigger the activation animation (called when playhead passes)
   */
  animateTrigger() {
    const targetScale = this.icon.baseScale * 1.15;
    this.scene.tweens.add({
      targets: this.icon,
      scaleX: targetScale, scaleY: targetScale,
      duration: 100,
      yoyo: true,
      ease: 'Bounce.easeOut',
    });
  }

  /**
   * Destroy with animation
   */
  remove() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0, scaleY: 0,
      alpha: 0,
      duration: 150,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.destroy();
      }
    });
  }
}
