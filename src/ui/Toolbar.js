// ============================================
// Toolbar.js — Part selection toolbar
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, COLORS, PART_TYPES, FONT_FAMILY_UI } from '../config/constants.js';
import { drawBeveledBorder } from '../utils/uiUtils.js';

const PART_BUTTONS = [
  { type: PART_TYPES.HAMMER,     icon: 'icon_hammer',     label: 'Hammer',      color: COLORS.HAMMER_COLOR },
  { type: PART_TYPES.WRENCH,     icon: 'icon_bellows',    label: 'Bellows',     color: COLORS.WRENCH_COLOR },
  { type: PART_TYPES.SPRING,     icon: 'icon_spring',     label: 'Spring',      color: COLORS.SPRING_COLOR },
  { type: PART_TYPES.GEAR,       icon: 'icon_gear',       label: 'Gear',        color: COLORS.GEAR_COLOR },
  { type: PART_TYPES.TUNINGFORK, icon: 'icon_tuningfork', label: 'Tuning Fork', color: COLORS.TUNINGFORK_COLOR },
  { type: 'eraser',              icon: 'vector_erase',    label: 'Erase',       color: COLORS.RED },
];

export class Toolbar extends Phaser.Events.EventEmitter {
  /**
   * @param {Phaser.Scene} scene
   * @param {string[]} availableParts — list of part type strings available for this level
   */
  constructor(scene, availableParts) {
    super();
    this.scene = scene;
    this.buttons = [];
    this.selectedType = null;

    this._create(availableParts);
  }

  _create(availableParts) {
    const y = 72;
    const btnSize = 120; // Larger button
    const gap = 24;

    // Filter to only available parts + always include eraser
    const visibleParts = PART_BUTTONS.filter(p =>
      availableParts.includes(p.type) || p.type === 'eraser'
    );

    const totalWidth = visibleParts.length * (btnSize + gap) - gap;
    let startX = (GAME_WIDTH / 2) - (totalWidth / 2) + btnSize / 2;

    // Toolbar label centered below the buttons
    this.scene.add.text(GAME_WIDTH / 2, y + 82, '— TOOLBOX —', {
      fontSize: '18px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 4
    }).setOrigin(0.5);

    visibleParts.forEach((partDef, index) => {
      const x = startX + index * (btnSize + gap);
      this._createButton(x, y, btnSize, partDef);
    });
  }

  _createButton(x, y, size, partDef) {
    const bg = this.scene.add.rectangle(x, y, size, size, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(0);

    const borderG = this.scene.add.graphics({ x, y }).setDepth(0);
    drawBeveledBorder(borderG, size, size, 0x444455, 1.5, 3, 6, COLORS.GRID_BG, 1);

    let icon;
    if (partDef.icon.startsWith('icon_')) {
      icon = this.scene.add.image(x, y - 12, partDef.icon).setOrigin(0.5);
      const scale = Math.min(81 / icon.width, 81 / icon.height);
      icon.setScale(scale);
    } else if (partDef.icon === 'vector_erase') {
      // Soft red glow backdrop
      this.scene.add.circle(x, y - 12, 27, COLORS.RED, 0.15).setDepth(1);
      
      icon = this.scene.add.graphics({ x: x, y: y - 12 }).setDepth(2);
      
      // Outer sleek ring
      icon.lineStyle(4.5, COLORS.RED, 0.9);
      icon.strokeCircle(0, 0, 24);

      // Clean inner X
      icon.lineStyle(6, COLORS.RED, 1);
      icon.beginPath();
      icon.moveTo(-10.5, -10.5);
      icon.lineTo(10.5, 10.5);
      icon.moveTo(10.5, -10.5);
      icon.lineTo(-10.5, 10.5);
      icon.strokePath();
    } else {
      icon = this.scene.add.text(x, y - 9, partDef.icon, {
        fontSize: '42px',
      }).setOrigin(0.5);
    }

    // Render text larger and scale down for much crisper anti-aliasing
    const label = this.scene.add.text(x, y + 39, partDef.label, {
      fontSize: '30px',
      fontFamily: FONT_FAMILY_UI,
      color: '#888899',
    }).setOrigin(0.5).setScale(0.5);

    const btnData = { bg, borderG, icon, label, partDef, size };
    this.buttons.push(btnData);

    bg.on('pointerdown', () => {
      if (this.scene.audioEngine) this.scene.audioEngine.playUIClick();
      this._selectButton(btnData);
    });

    bg.on('pointerover', () => {
      if (this.selectedType !== partDef.type) {
        drawBeveledBorder(borderG, size, size, partDef.color, 1, 2.5, 4, COLORS.GRID_BG, 1);
        if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
      }
    });

    bg.on('pointerout', () => {
      if (this.selectedType !== partDef.type) {
        drawBeveledBorder(borderG, size, size, 0x444455, 1, 2, 4, COLORS.GRID_BG, 1);
      }
    });
  }

  _selectButton(btnData) {
    this.selectedType = btnData.partDef.type;
    this.emit('select', this.selectedType);

    this.buttons.forEach(b => {
      if (b === btnData) {
        drawBeveledBorder(b.borderG, b.size, b.size, b.partDef.color, 1, 3, 4, b.partDef.color, 0.15);
        b.label.setColor('#ffffff');
      } else {
        drawBeveledBorder(b.borderG, b.size, b.size, 0x444455, 1, 2, 4, COLORS.GRID_BG, 1);
        b.label.setColor('#888899');
      }
    });
  }
}
