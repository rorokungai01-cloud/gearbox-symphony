// ============================================
// LevelCompleteOverlay.js — Victory popup overlay
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY_UI, SCENES } from '../config/constants.js';
import LEVELS from '../config/levelData.js';
import { drawBeveledBorder } from '../utils/uiUtils.js';

export class LevelCompleteOverlay {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} levelId
   * @param {number} stars — 1, 2, or 3
   * @param {number} matchRatio — 0.0–1.0
   * @param {boolean} hasNextLevel
   */
  constructor(scene, config) {
    this.scene = scene;
    this.objects = [];

    this._create(config);
  }

  _create({ stars, timeMs, isNewBest, onNext, onMenu, onRetry }) {
    // Dim overlay
    const overlay = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setOrigin(0).setAlpha(0).setDepth(100);
    this.objects.push(overlay);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.65,
      duration: 300,
    });

    // Panel
    const panelW = 630;
    const panelH = 510;
    const px = (GAME_WIDTH - panelW) / 2;
    const py = (GAME_HEIGHT - panelH) / 2;

    const panelBorderG = this.scene.add.graphics({ x: px + panelW / 2, y: py + panelH / 2 })
      .setDepth(101)
      .setAlpha(0);
    drawBeveledBorder(panelBorderG, panelW, panelH, COLORS.GOLD, 1, 4.5, 9, COLORS.BG_DEEP, 1);
    this.objects.push(panelBorderG);

    this.scene.tweens.add({
      targets: panelBorderG,
      alpha: 1,
      duration: 400,
      delay: 100,
      ease: 'Back.easeOut',
    });

    const cx = px + panelW / 2;

    const title = this.scene.add.text(cx, py + 45, '⚙️ LEVEL COMPLETE! ⚙️', {
      fontSize: '33px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(102).setAlpha(0);
    this.objects.push(title);

    // Stars
    const starIcons = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const starText = this.scene.add.text(cx, py + 135, starIcons, {
      fontSize: '63px',
      padding: { top: 15, bottom: 15 }
    }).setOrigin(0.5).setDepth(102).setAlpha(0);
    this.objects.push(starText);

    // Time Text
    import('../utils/storageUtils.js').then(({ formatTime }) => {
      const timeStr = `Time: ${formatTime(timeMs)}`;
      const timeText = this.scene.add.text(cx, py + 225, timeStr, {
        fontSize: '27px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#e8e8e8',
      }).setOrigin(0.5).setDepth(102).setAlpha(0);
      this.objects.push(timeText);
      
      // New Best label
      if (isNewBest) {
        const bestLabel = this.scene.add.text(cx, py + 193, '(New Best!)', {
          fontSize: '21px',
          fontFamily: FONT_FAMILY_UI,
          fontStyle: 'bold',
          color: '#00ff88',
        }).setOrigin(0.5).setDepth(102).setAlpha(0);
        this.objects.push(bestLabel);
        
        // Gentle pulse
        this.scene.tweens.add({
          targets: bestLabel,
          alpha: 1,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 400,
          yoyo: true,
          repeat: -1,
          delay: 700
        });
      }

      this.scene.tweens.add({
        targets: timeText,
        alpha: 1,
        duration: 400,
        delay: 400,
      });
    });

    // Animate all static text in
    this.scene.tweens.add({
      targets: [title, starText],
      alpha: 1,
      duration: 400,
      delay: 300,
    });

    // Star bounce
    this.scene.tweens.add({
      targets: starText,
      scaleX: 1.2, scaleY: 1.2,
      duration: 200,
      delay: 500,
      yoyo: true,
      ease: 'Bounce.easeOut',
    });

    // Victory Particles (Juice!)
    if (!this.scene.textures.exists('particle_star')) {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffd700, 1);
      g.beginPath();
      g.moveTo(8, 0); g.lineTo(10, 6); g.lineTo(16, 8); g.lineTo(10, 10);
      g.lineTo(8, 16); g.lineTo(6, 10); g.lineTo(0, 8); g.lineTo(6, 6);
      g.closePath();
      g.fillPath();
      g.generateTexture('particle_star', 16, 16);
      g.destroy();
    }

    const emitter = this.scene.add.particles(0, 0, 'particle_star', {
      speed: { min: 200, max: 700 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 1500, max: 2500 },
      gravityY: 1200, // Heavier gravity falling down
      emitting: false,
      depth: 106, // Put it IN FRONT of all UI (100-105) so it doesn't get dimmed by the black overlay
      blendMode: 'ADD' // Glowing effect
    });
    emitter.setDepth(106); // Explicitly call setDepth on the Game Object!
    this.objects.push(emitter);

    // Explode particles exactly when stars bounce
    this.scene.time.delayedCall(500, () => {
      // Explode from the center of the screen
      emitter.explode(stars * 40, cx, py + 135); 
    });

    // Buttons
    const btnY = py + 292; // Shifted up slightly to fit pyramid structure

    if (onNext) {
      // Dominant 'Next' button at the top center (spans total width of Retry + Levels)
      this._createButton(cx, btnY, 420, 86, 'Next', COLORS.NEON_GREEN, () => {
        this.destroy();
        onNext();
      });

      // Secondary choices below it
      this._createButton(cx - 113, btnY + 105, 195, 57, 'Retry', COLORS.WARM_ORANGE, () => {
        this.destroy();
        if (onRetry) onRetry();
        else this.scene.scene.restart({ levelId: this.scene.levelData.id });
      });

      this._createButton(cx + 113, btnY + 105, 195, 57, 'Levels', 0xaaaaaa, () => {
        this.destroy();
        onMenu();
      });
    } else {
      // If it's the last level and there's no Next button, center the two remaining
      this._createButton(cx - 113, btnY + 38, 195, 57, 'Retry', COLORS.WARM_ORANGE, () => {
        this.destroy();
        if (onRetry) onRetry();
        else this.scene.scene.restart({ levelId: this.scene.levelData.id });
      });

      this._createButton(cx + 113, btnY + 38, 195, 57, 'Levels', 0xaaaaaa, () => {
        this.destroy();
        onMenu();
      });
    }
  }

  _createButton(x, y, w, h, text, color, callback) {
    const bg = this.scene.add.rectangle(x, y, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(102)
      .setAlpha(0);
    this.objects.push(bg);

    const borderG = this.scene.add.graphics({ x, y }).setDepth(102).setAlpha(0);
    drawBeveledBorder(borderG, w, h, color, 0.8, 2.25, 6, COLORS.GRID_BG, 1);
    this.objects.push(borderG);

    const label = this.scene.add.text(x, y, text, {
      fontSize: h > 60 ? '30px' : '20px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: '600',
      color: '#e8e8e8',
    }).setOrigin(0.5).setDepth(102).setAlpha(0);
    this.objects.push(label);

    // Fade in
    this.scene.tweens.add({
      targets: [bg, borderG, label],
      alpha: 1,
      duration: 300,
      delay: 600,
    });

    bg.on('pointerover', () => {
      drawBeveledBorder(borderG, w, h, color, 1, 3.75, 6, color, 0.2);
      if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
    });

    bg.on('pointerout', () => {
      drawBeveledBorder(borderG, w, h, color, 0.8, 2.25, 6, COLORS.GRID_BG, 1);
    });

    bg.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: [bg, borderG, label],
        scaleX: 0.93, scaleY: 0.93,
        duration: 60,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  destroy() {
    this.objects.forEach(obj => {
      if (obj && obj.destroy) obj.destroy();
    });
    this.objects = [];
  }
}
