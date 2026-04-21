// ============================================
// TransportBar.js — Play/Stop/Clear/BPM controls
// ============================================
// Layout: FINISH (wide, prominent, top row)
//         TEST | UNDO | CLEAR   BPM (bottom row)
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY_UI, MIN_BPM, MAX_BPM } from '../config/constants.js';
import { clamp } from '../utils/mathUtils.js';

export class TransportBar extends Phaser.Events.EventEmitter {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} initialBpm
   */
  constructor(scene, _ignoredInitialBpm) {
    super();
    this.scene = scene;
    this.speed = 100; // 100% Default Speed
    this.isPlaying = false;

    this._create();
  }

  _create() {
    const centerX = GAME_WIDTH / 2;
    const topY = GAME_HEIGHT - 142; // Shifted up slightly for taller button
    const bottomY = GAME_HEIGHT - 57;

    // ─── TOP ROW: FINISH (wide, prominent) ───
    this.finishBtn = this._createFinishBtn(centerX, topY, () => {
      if (!this.isPlaying) {
        // Screen shake for heavy mechanical impact (Duration ms, Intensity)
        this.scene.cameras.main.shake(150, 0.006);
        this.emit('finish');
      }
    });

    // ─── BOTTOM ROW: TEST | UNDO | CLEAR ───
    const smallBtnWidth = 225;
    const gap = 24;
    const totalSmallWidth = 3 * smallBtnWidth + 2 * gap;
    const startX = centerX - totalSmallWidth / 2 + smallBtnWidth / 2;

    this.playBtn = this._createSmallBtn(startX, bottomY, '🔍 TEST RUN', COLORS.NEON_GREEN, smallBtnWidth, () => {
      if (!this.isPlaying) {
        this.emit('play');
      }
    });

    this.undoBtn = this._createSmallBtn(startX + smallBtnWidth + gap, bottomY, '↩ UNDO', 0x7788aa, smallBtnWidth, () => {
      this.emit('undo');
    });

    this._createSmallBtn(startX + 2 * (smallBtnWidth + gap), bottomY, '✕ CLEAR', COLORS.WARM_ORANGE, smallBtnWidth, () => {
      this.isPlaying = false;
      this.setPlayingState(false);
      this.emit('stop');
      this.emit('clear');
    });

    // ─── BPM control (right side, aligned with bottom row) ───
    this._createBpmControl(centerX + totalSmallWidth / 2 + 225, bottomY);
  }

  /**
   * Create the large, prominent FINISH button
   */
  _createFinishBtn(x, y, callback) {
    const btnWidth = 435;
    const btnHeight = 90; // Adjusted per user request

    // Background Image
    const bg = this.scene.add.image(x, y, 'btn_main')
      .setDisplaySize(btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true })
      .setDepth(10)
      .setAlpha(0.9);

    bg.on('pointerover', () => {
      bg.setAlpha(1);
      bg.setTint(0xffffff); // Use a bright white overlay (effectively full brightness)
      // Optional: Phaser 3.60+ precise glow fx (if WebGL enabled)
      if (bg.preFX) bg.postFX.addGlow(0xffd700, 4, 0, false, 0.1, 10);
      
      if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
    });

    bg.on('pointerout', () => {
      bg.setAlpha(0.9);
      bg.clearTint();
      if (bg.preFX) bg.postFX.clear();
    });

    bg.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: bg,
        scaleX: bg.scaleX * 0.96, 
        scaleY: bg.scaleY * 0.92,
        duration: 60,
        yoyo: true,
        onComplete: callback,
      });
    });

    return { bg }; 
  }

  /**
   * Create a small utility button (TEST, UNDO, CLEAR) — Premium Style
   */
  _createSmallBtn(x, y, text, color, width, callback) {
    const btnHeight = 68;

    let imageKey = 'btn_test';
    if (text.includes('UNDO')) imageKey = 'btn_undo';
    if (text.includes('CLEAR')) imageKey = 'btn_clear';

    // Main button background
    const bg = this.scene.add.image(x, y, imageKey)
      .setDisplaySize(width, btnHeight)
      .setInteractive({ useHandCursor: true })
      .setDepth(10)
      .setAlpha(0.9);

    bg.on('pointerover', () => {
      bg.setAlpha(1);
      bg.setTint(0xffffff);
      if (bg.preFX) bg.postFX.addGlow(color, 4, 0, false, 0.1, 10);
      
      if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
    });

    bg.on('pointerout', () => {
      bg.setAlpha(0.9);
      bg.clearTint();
      if (bg.preFX) bg.postFX.clear();
    });

    bg.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: bg,
        scaleX: bg.scaleX * 0.94, 
        scaleY: bg.scaleY * 0.90,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });

    return { bg };
  }

  _createBpmControl(x, y) {
    // Speed label
    this.bpmText = this.scene.add.text(x, y, `SPEED: ${this.speed}%`, {
      fontSize: '27px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(10);

    // Speed down
    const downBtn = this.scene.add.text(x - 110, y, '◀', {
      fontSize: '36px', color: '#666677',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    downBtn.on('pointerover', () => downBtn.setColor('#ffd700'));
    downBtn.on('pointerout', () => downBtn.setColor('#666677'));
    downBtn.on('pointerdown', () => {
      if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
      this.speed = clamp(this.speed - 10, 50, 150);
      this.bpmText.setText(`SPEED: ${this.speed}%`);
      this.emit('speedChange', this.speed);
    });

    // Speed up
    const upBtn = this.scene.add.text(x + 110, y, '▶', {
      fontSize: '36px', color: '#666677',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    upBtn.on('pointerover', () => upBtn.setColor('#ffd700'));
    upBtn.on('pointerout', () => upBtn.setColor('#666677'));
    upBtn.on('pointerdown', () => {
      if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
      this.speed = clamp(this.speed + 10, 50, 150);
      this.bpmText.setText(`SPEED: ${this.speed}%`);
      this.emit('speedChange', this.speed);
    });
  }

  setPlayingState(isPlaying) {
    this.isPlaying = isPlaying;
    
    // Dim buttons during playback
    if (this.isPlaying) {
      this.playBtn.bg.setAlpha(0.4);
      this.finishBtn.bg.setAlpha(0.4);
      if (this.finishBtn.glow) this.finishBtn.glow.setVisible(false);
    } else {
      this.playBtn.bg.setAlpha(0.9);
      this.finishBtn.bg.setAlpha(0.9);
      if (this.finishBtn.glow) this.finishBtn.glow.setVisible(true);
    }
  }
}
