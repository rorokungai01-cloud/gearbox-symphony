// ============================================
// FreePlayConfigOverlay.js — Difficulty settings before starting Free Play
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY_UI } from '../config/constants.js';
import { drawBeveledBorder } from '../utils/uiUtils.js';

export class FreePlayConfigOverlay {
  constructor(scene, onStart, onCancel) {
    this.scene = scene;
    this.objects = [];
    this.valueTexts = {}; // Store text objects to update them easily
    
    // Default values
    const defaults = {
      toolboxSize: 5,   // 3 to 5
      maxVertParts: 3,  // 3 to 5
      cols: 8,          // 4 to 10
      autoSave: true,
      showLiveScore: true // toggles live star display
    };

    this.config = { ...defaults };

    // Try to load auto-saved config
    try {
      const savedStr = localStorage.getItem('gearbox-freeplay-config');
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved && saved.autoSave === false) {
           // Remember that user turned off auto save
           this.config.autoSave = false;
        } else if (saved) {
           this.config = { ...this.config, ...saved };
        }
      }
    } catch(e) {}

    this._create(onStart, onCancel);
  }

  _create(onStart, onCancel) {
    // Dim overlay
    const overlay = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setOrigin(0).setAlpha(0).setDepth(100)
      .setInteractive(); // Block clicks to background
    this.objects.push(overlay);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.85,
      duration: 300,
    });

    // Panel
    const panelW = 740;
    const panelH = 680;
    const px = (GAME_WIDTH - panelW) / 2;
    const py = (GAME_HEIGHT - panelH) / 2;
    const cx = px + panelW / 2;

    const panelBorderG = this.scene.add.graphics({ x: cx, y: py + panelH / 2 })
      .setDepth(101)
      .setAlpha(0);
    drawBeveledBorder(panelBorderG, panelW, panelH, COLORS.GOLD, 1, 4.5, 9, COLORS.BG_DEEP, 1);
    this.objects.push(panelBorderG);

    this.scene.tweens.add({
      targets: panelBorderG,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    const title = this.scene.add.text(cx, py + 45, '⚙️ FREE PLAY SETTINGS ⚙️', {
      fontSize: '33px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(102).setAlpha(0);
    this.objects.push(title);

    this.scene.tweens.add({
      targets: title,
      alpha: 1,
      duration: 400,
      delay: 150,
    });

    // Create Options
    const startY = py + 120;
    const spacingY = 66;

    this._createOptionRow(px + 60, startY, 'Toolbox Size (Variety):', 'toolboxSize', 3, 5);
    this._createOptionRow(px + 60, startY + spacingY, 'Max Tools per Column:', 'maxVertParts', 2, 5);
    this._createOptionRow(px + 60, startY + spacingY * 2, 'Grid Width (Columns):', 'cols', 4, 10);
    
    // Live Stars Toggle
    this._createCheckboxRow(px + 60, startY + spacingY * 3, 'Show Live Stars Score:', 'showLiveScore', '(Turn off to guess score until test)');

    // Auto Save Checkbox
    this._createCheckboxRow(px + 60, startY + spacingY * 4.2, 'Auto Save Settings', 'autoSave');

    // Default Button (Centered)
    this._createSmallButton(cx, startY + spacingY * 5.4, 220, 54, 'DEFAULT', 0xaaaaaa, () => {
       this.config.toolboxSize = 5;
       this.config.maxVertParts = 3;
       this.config.cols = 8;
       this.config.autoSave = true;
       this.config.showLiveScore = true;
       this._updateDisplays();
    });

    // Main Buttons
    const btnY = startY + spacingY * 6.8;

    this._createButton(cx - 160, btnY, 280, 65, 'CANCEL', 0xff4444, () => {
      this.destroy();
      if (onCancel) onCancel();
    });

    this._createButton(cx + 160, btnY, 280, 65, 'START GAME', COLORS.NEON_GREEN, () => {
      // Save config if requested
      if (this.config.autoSave) {
          localStorage.setItem('gearbox-freeplay-config', JSON.stringify(this.config));
      } else {
          // Remember only that Auto Save is OFF, don't save other configs
          localStorage.setItem('gearbox-freeplay-config', JSON.stringify({ autoSave: false }));
      }

      this.destroy();
      if (onStart) onStart(this.config);
    });
  }

  _updateDisplays() {
      if (this.valueTexts['toolboxSize']) this.valueTexts['toolboxSize'].setText(this.config['toolboxSize'].toString());
      if (this.valueTexts['maxVertParts']) this.valueTexts['maxVertParts'].setText(this.config['maxVertParts'].toString());
      if (this.valueTexts['cols']) this.valueTexts['cols'].setText(this.config['cols'].toString());
      if (this.valueTexts['autoSave']) {
          this.valueTexts['autoSave'].setText(this.config['autoSave'] ? 'ON' : 'OFF');
          this.valueTexts['autoSave'].setColor(this.config['autoSave'] ? '#00ff88' : '#aaaaaa');
      }
      if (this.valueTexts['showLiveScore']) {
          this.valueTexts['showLiveScore'].setText(this.config['showLiveScore'] ? 'ON' : 'OFF');
          this.valueTexts['showLiveScore'].setColor(this.config['showLiveScore'] ? '#00ff88' : '#aaaaaa');
      }
      if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
  }

  _createOptionRow(x, y, labelText, configKey, min, max) {
    const label = this.scene.add.text(x, y, labelText, {
      fontSize: '24px',
      fontFamily: FONT_FAMILY_UI,
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(102);
    this.objects.push(label);

    const controlX = x + 440; // right aligned controls

    const valueText = this.scene.add.text(controlX, y, this.config[configKey].toString(), {
      fontSize: '32px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(102);
    this.objects.push(valueText);
    this.valueTexts[configKey] = valueText;

    // Left Arrow
    const btnLeft = this.scene.add.text(controlX - 70, y, '◀', {
      fontSize: '32px', color: '#aaaaaa'
    }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
    this.objects.push(btnLeft);

    btnLeft.on('pointerdown', () => {
      if (this.config[configKey] > min) {
        this.config[configKey]--;
        valueText.setText(this.config[configKey].toString());
        if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
      }
    });
    btnLeft.on('pointerover', () => btnLeft.setColor('#ffffff'));
    btnLeft.on('pointerout', () => btnLeft.setColor('#aaaaaa'));

    // Right Arrow
    const btnRight = this.scene.add.text(controlX + 70, y, '▶', {
      fontSize: '32px', color: '#aaaaaa'
    }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
    this.objects.push(btnRight);

    btnRight.on('pointerdown', () => {
      if (this.config[configKey] < max) {
        this.config[configKey]++;
        valueText.setText(this.config[configKey].toString());
        if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
      }
    });
    btnRight.on('pointerover', () => btnRight.setColor('#ffffff'));
    btnRight.on('pointerout', () => btnRight.setColor('#aaaaaa'));
  }

  _createCheckboxRow(x, y, labelText, configKey, subtext = null) {
    const label = this.scene.add.text(x, y, labelText, {
      fontSize: '24px',
      fontFamily: FONT_FAMILY_UI,
      color: '#ccccdd',
    }).setOrigin(0, 0.5).setDepth(102);
    this.objects.push(label);

    if (subtext) {
        label.setY(y - 8);
        const subLabel = this.scene.add.text(x, y + 16, subtext, {
            fontSize: '14px',
            fontFamily: FONT_FAMILY_UI,
            color: '#888899',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(102);
        this.objects.push(subLabel);
    }

    const toggleWidth = 65;
    const toggleHeight = 40;
    
    // OFF button (centered under x + 440)
    const offX = x + 404; 
    const offBg = this.scene.add.rectangle(offX, y, toggleWidth, toggleHeight, 0x222233, 1)
        .setStrokeStyle(2, 0x555566)
        .setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
    const offText = this.scene.add.text(offX, y, 'OFF', { fontSize: '18px', fontFamily: FONT_FAMILY_UI, fontStyle: 'bold' }).setOrigin(0.5).setDepth(103);
    this.objects.push(offBg, offText);

    // ON button
    const onX = offX + toggleWidth + 8;
    const onBg = this.scene.add.rectangle(onX, y, toggleWidth, toggleHeight, 0x222233, 1)
        .setStrokeStyle(2, 0x555566)
        .setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });
    const onText = this.scene.add.text(onX, y, 'ON', { fontSize: '18px', fontFamily: FONT_FAMILY_UI, fontStyle: 'bold' }).setOrigin(0.5).setDepth(103);
    this.objects.push(onBg, onText);

    const updateUI = () => {
        const val = this.config[configKey];
        if (val) {
            onBg.setFillStyle(0x00331a, 1);
            onBg.setStrokeStyle(2, 0x00ff88);
            onText.setColor('#00ff88');

            offBg.setFillStyle(0x1a1a28, 1);
            offBg.setStrokeStyle(2, 0x444455);
            offText.setColor('#444455');
        } else {
            onBg.setFillStyle(0x1a1a28, 1);
            onBg.setStrokeStyle(2, 0x444455);
            onText.setColor('#444455');

            offBg.setFillStyle(0x331a1a, 1);
            offBg.setStrokeStyle(2, 0xff4444);
            offText.setColor('#ff4444');
        }
    };

    // Store a dummy object so _updateDisplays can trigger an update seamlessly
    this.valueTexts[configKey] = { setText: () => { updateUI(); }, setColor: () => {} };
    updateUI();

    offBg.on('pointerdown', () => {
        if (this.config[configKey] !== false) {
            this.config[configKey] = false;
            updateUI();
            if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
        }
    });
    
    onBg.on('pointerdown', () => {
        if (this.config[configKey] !== true) {
            this.config[configKey] = true;
            updateUI();
            if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
        }
    });
  }

  _createButton(x, y, w, h, text, color, callback) {
    const borderG = this.scene.add.graphics({ x, y }).setDepth(102);
    drawBeveledBorder(borderG, w, h, color, 1, 3, 6, 0x000000, 0.8);
    this.objects.push(borderG);

    const label = this.scene.add.text(x, y, text, {
      fontSize: '26px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5).setDepth(103);
    this.objects.push(label);

    const hit = this.scene.add.rectangle(x, y, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(104);
    this.objects.push(hit);

    hit.on('pointerover', () => {
      borderG.clear();
      drawBeveledBorder(borderG, w, h, 0xffffff, 1, 3, 6, color, 0.4);
      label.setColor('#ffffff');
      if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
    });

    hit.on('pointerout', () => {
      borderG.clear();
      drawBeveledBorder(borderG, w, h, color, 1, 3, 6, 0x000000, 0.8);
      label.setColor('#' + color.toString(16).padStart(6, '0'));
    });

    hit.on('pointerdown', () => {
      if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
      callback();
    });
  }

  _createSmallButton(x, y, w, h, text, color, callback) {
    const borderG = this.scene.add.graphics({ x, y }).setDepth(102);
    drawBeveledBorder(borderG, w, h, color, 1, 2, 4, 0x000000, 0.8);
    this.objects.push(borderG);

    const label = this.scene.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5).setDepth(103);
    this.objects.push(label);

    const hit = this.scene.add.rectangle(x, y, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(104);
    this.objects.push(hit);

    hit.on('pointerover', () => {
      borderG.clear();
      drawBeveledBorder(borderG, w, h, 0xffffff, 1, 2, 4, color, 0.4);
      label.setColor('#ffffff');
      if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
    });

    hit.on('pointerout', () => {
      borderG.clear();
      drawBeveledBorder(borderG, w, h, color, 1, 2, 4, 0x000000, 0.8);
      label.setColor('#' + color.toString(16).padStart(6, '0'));
    });

    hit.on('pointerdown', () => {
      if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
      callback();
    });
  }

  destroy() {
    this.objects.forEach(obj => obj.destroy());
    this.objects = [];
  }
}
