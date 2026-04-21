// ============================================
// TutorialOverlay.js — How to play instructions
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY_UI } from '../config/constants.js';

export class TutorialOverlay {
  /**
   * @param {Phaser.Scene} scene
   * @param {Function} onComplete
   */
  constructor(scene, onComplete) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.objects = [];
    this.currentStep = 0;

    this.steps = [
      {
        title: 'STEP 1: THE BLUEPRINT',
        text: 'Listen to the Original Blueprint on the right panel.\nYour goal is to recreate it.',
        highlight: { x: GAME_WIDTH - 225, y: 375, w: 300, h: 300 }
      },
      {
        title: 'STEP 2: BUILD YOUR MACHINE',
        text: 'Select parts from the Toolbox and place them\non the Workbench to build your machine.',
        highlight: { x: 750, y: 150, w: 900, h: 120 }
      },
      {
        title: 'STEP 3: RUN THE GEARBOX',
        text: 'Press POWER ON. The green playhead triggers parts\nas it moves. Earn at least 2 Stars to clear the level!',
        highlight: { x: GAME_WIDTH / 2, y: 1035, w: 600, h: 90 }
      }
    ];

    this._create();
  }

  _create() {
    this.overlay = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setOrigin(0).setAlpha(0.7).setDepth(200).setInteractive();
    this.objects.push(this.overlay);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.box = this.scene.add.rectangle(cx, cy, 750, 375, COLORS.BG_DEEP)
      .setStrokeStyle(4.5, COLORS.GOLD).setDepth(201);
    this.objects.push(this.box);

    this.titleText = this.scene.add.text(cx, cy - 105, '', {
      fontSize: '33px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(202);
    this.objects.push(this.titleText);

    this.descText = this.scene.add.text(cx, cy, '', {
      fontSize: '24px',
      fontFamily: FONT_FAMILY_UI,
      color: '#e8e8e8',
      align: 'center',
      lineSpacing: 15
    }).setOrigin(0.5).setDepth(202);
    this.objects.push(this.descText);

    this.btnBg = this.scene.add.rectangle(cx, cy + 120, 210, 60, COLORS.GRID_BG)
      .setStrokeStyle(3, COLORS.NEON_GREEN).setDepth(202).setInteractive({ useHandCursor: true });
    this.objects.push(this.btnBg);

    this.btnText = this.scene.add.text(cx, cy + 120, 'NEXT ▶', {
      fontSize: '24px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#00ff88'
    }).setOrigin(0.5).setDepth(202);
    this.objects.push(this.btnText);

    this.btnBg.on('pointerover', () => this.btnBg.setFillStyle(COLORS.NEON_GREEN, 0.2));
    this.btnBg.on('pointerout', () => this.btnBg.setFillStyle(COLORS.GRID_BG));
    this.btnBg.on('pointerdown', () => this._nextStep());

    this._showStep(0);
  }

  _showStep(index) {
    if (index >= this.steps.length) {
      if (this.onComplete) this.onComplete();
      this.destroy();
      return;
    }

    const step = this.steps[index];
    this.titleText.setText(step.title);
    this.descText.setText(step.text);
    
    if (index === this.steps.length - 1) {
      this.btnText.setText('START ⚙️');
    }

    // A spotlight could be implemented here using a mask
  }

  _nextStep() {
    if (this.scene.audioEngine) {
      this.scene.audioEngine.resume();
      this.scene.audioEngine.playUIClick();
    }
    this.currentStep++;
    this._showStep(this.currentStep);
  }

  destroy() {
    this.objects.forEach(obj => obj.destroy());
    this.objects = [];
  }
}
