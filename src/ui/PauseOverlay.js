import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY_UI, SCENES } from '../config/constants.js';
import { drawBeveledBorder } from '../utils/uiUtils.js';

export class PauseOverlay {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} callbacks { onResume, onRestart, onLevelSelect, onMainMenu }
   */
  constructor(scene, callbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.isActive = false;

    this.container = this.scene.add.container(0, 0).setDepth(100);
    this.container.setVisible(false);

    this._createUI();
  }

  _createUI() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark overlay with slight blur feel
    const bg = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setOrigin(0)
      .setInteractive(); // Block clicks from falling through

    // Modal background - made taller to fit 4 buttons
    const h = this.callbacks.onLevelSelect ? 630 : 540;
    const modalBorderG = this.scene.add.graphics({ x: cx, y: cy });
    drawBeveledBorder(modalBorderG, 600, h, COLORS.BRONZE, 1, 4.5, 9, 0x1a1a24, 1);

    // Title
    const titleText = this.scene.add.text(cx, cy - 210, 'PAUSED', {
      fontSize: '63px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5).setShadow(0, 3, '#000000', 6);

    let currentY = cy - 75;

    // ─── Buttons ───
    const resumeBtn = this._createBtn(cx, currentY, 'RESUME', COLORS.NEON_GREEN, () => {
      this.hide();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });
    currentY += 90;
    
    const restartBtn = this._createBtn(cx, currentY, 'RESTART', COLORS.WARM_ORANGE, () => {
      this.hide();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });
    currentY += 90;

    this.container.add([
      bg, modalBorderG, titleText, 
      resumeBtn.bg, resumeBtn.borderG, resumeBtn.label, 
      restartBtn.bg, restartBtn.borderG, restartBtn.label
    ]);

    if (this.callbacks.onLevelSelect) {
      const levelBtn = this._createBtn(cx, currentY, 'FLOOR SELECT', 0x7788aa, () => {
        this.hide();
        this.callbacks.onLevelSelect();
      });
      this.container.add([levelBtn.bg, levelBtn.borderG, levelBtn.label]);
      currentY += 90;
    }

    const exitBtn = this._createBtn(cx, currentY, 'MAIN MENU', COLORS.RED, () => {
      this.hide();
      if (this.callbacks.onMainMenu) this.callbacks.onMainMenu();
    });

    this.container.add([
      exitBtn.bg, exitBtn.borderG, exitBtn.label
    ]);
  }

  _createBtn(x, y, text, color, callback) {
    const w = 360;
    const h = 75;

    const bg = this.scene.add.rectangle(x, y, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const borderG = this.scene.add.graphics({ x, y });
    drawBeveledBorder(borderG, w, h, color, 0.8, 2.25, 6, 0x222233, 1);

    const label = this.scene.add.text(x, y, text, {
      fontSize: '27px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#e8e8e8',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      drawBeveledBorder(borderG, w, h, color, 1, 3.75, 6, color, 0.2);
      if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
    });
    
    bg.on('pointerout', () => {
      drawBeveledBorder(borderG, w, h, color, 0.8, 2.25, 6, 0x222233, 1);
    });

    bg.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: [bg, borderG, label],
        scaleX: 0.95, scaleY: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: callback
      });
    });

    return { bg, label, borderG };
  }

  show() {
    if (this.isActive) return;
    this.isActive = true;
    
    this.container.setVisible(true);
    this.container.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
  }

  hide() {
    if (!this.isActive) return;
    
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this.isActive = false;
        this.container.setVisible(false);
      }
    });
  }
}
