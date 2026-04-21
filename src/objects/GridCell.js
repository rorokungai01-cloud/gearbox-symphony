// ============================================
// GridCell.js — Single cell in the grid
// ============================================
import Phaser from 'phaser';
import { CELL_SIZE, COLORS, PART_TYPES } from '../config/constants.js';

import { HammerPart } from './HammerPart.js';
import { WrenchPart } from './WrenchPart.js';
import { SpringPart } from './SpringPart.js';
import { TuningForkPart } from './TuningForkPart.js';
import { GearPart } from './GearPart.js';

export class GridCell extends Phaser.Events.EventEmitter {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x — pixel X position (top-left)
   * @param {number} y — pixel Y position (top-left)
   * @param {number} col — grid column index
   * @param {number} row — grid row index
   * @param {object} gridSystem — reference to parent grid system
   */
  constructor(scene, x, y, col, row, gridSystem) {
    super();
    this.scene = scene;
    this.gridSystem = gridSystem;
    this.x = x;
    this.y = y;
    this.col = col;
    this.row = row;
    
    this.partType = null;
    this.partObject = null; // Instance of MachinePart subclass

    // Cell background
    this.bg = scene.add.rectangle(x, y, CELL_SIZE, CELL_SIZE, COLORS.GRID_BG)
      .setOrigin(0)
      .setStrokeStyle(1.5, COLORS.GRID_LINE)
      .setInteractive({ useHandCursor: true });

    // Event handlers — distinguish click vs drag
    this.isDragging = false;
    this.dragThreshold = 200; // ms: holds longer than this = drag

    this.bg.on('pointerdown', (pointer) => {
      this.isDragging = false;
      this._downX = pointer.x;
      this._downY = pointer.y;
      this._pointerDown = true;
    });

    // Start drag as soon as pointer moves more than 6px while held
    this.scene.input.on('pointermove', (pointer) => {
      if (!this._pointerDown || this.isDragging || !this.partType) return;
      const dx = pointer.x - this._downX;
      const dy = pointer.y - this._downY;
      if (Math.sqrt(dx * dx + dy * dy) > 6) {
        this.isDragging = true;
        this._pointerDown = false;
        this.emit('dragStart', this.col, this.row, this.partType);
      }
    });

    this.bg.on('pointerup', () => {
      this._pointerDown = false;
      // Normal click only if this cell wasn't being dragged AND no other cell is currently being dragged and dropped here
      if (!this.isDragging && (!this.gridSystem || !this.gridSystem.dragSource)) {
        this.emit('click', col, row);
      }
      this.isDragging = false;
    });

    this.bg.on('pointerover', () => {
      if (!this.partObject) {
        const hoverType = this.gridSystem?.hoverPartType;
        if (hoverType && hoverType !== 'eraser') {
          const color = this.gridSystem.getPartColor(hoverType);
          this.bg.setFillStyle(color).setAlpha(0.2);
          this.bg.setStrokeStyle(1, color);
        } else {
          this.bg.setFillStyle(0x3a3a4e);
        }
      }
    });

    this.bg.on('pointerout', () => {
      if (this.partType) {
        this.bg.setStrokeStyle(4.5, this.partObject.partColor);
      } else {
        this.bg.setFillStyle(COLORS.GRID_BG).setAlpha(1);
        this.bg.setStrokeStyle(1.5, COLORS.GRID_LINE);
      }
    });
  }

  /**
   * Set a part in this cell by instantiating the specific subclass
   */
  setPart(partType) {
    // If there's already a part, clear it first
    if (this.partObject) {
      this.clearPart();
    }

    this.partType = partType;

    switch (partType) {
      case PART_TYPES.HAMMER:
        this.partObject = new HammerPart(this.scene, this.x, this.y);
        break;
      case PART_TYPES.WRENCH:
        this.partObject = new WrenchPart(this.scene, this.x, this.y);
        break;
      case PART_TYPES.SPRING:
        this.partObject = new SpringPart(this.scene, this.x, this.y);
        break;
      case PART_TYPES.TUNINGFORK:
        this.partObject = new TuningForkPart(this.scene, this.x, this.y);
        break;
      case PART_TYPES.GEAR:
        this.partObject = new GearPart(this.scene, this.x, this.y);
        break;
      default:
        return; // Invalid part type
    }

    // Update cell background to match part color
    if (this.partObject) {
      this.bg.setFillStyle(this.partObject.partColor).setAlpha(0.3);
      this.bg.setStrokeStyle(3, this.partObject.partColor);
    }
  }

  /**
   * Remove the part from this cell
   */
  clearPart() {
    if (this.partObject) {
      this.partObject.remove(); // plays exit animation and destroys itself
      this.partObject = null;
    }
    
    this.partType = null;
    this.bg.setFillStyle(COLORS.GRID_BG).setAlpha(1);
    this.bg.setStrokeStyle(1.5, COLORS.GRID_LINE);
  }

  /**
   * Trigger visual animation when the playhead activates this cell
   */
  triggerAnimation() {
    // Flash white briefly
    this.scene.tweens.add({
      targets: this.bg,
      alpha: 1,
      duration: 80,
      yoyo: true,
    });

    // Delegate part animation to the subclass instance
    if (this.partObject) {
      this.partObject.animateTrigger();
    }
  }
}
