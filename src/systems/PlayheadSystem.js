// ============================================
// PlayheadSystem.js — Playhead movement & timing
// ============================================
import Phaser from 'phaser';
import { COLORS, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE, GRID_PADDING } from '../config/constants.js';
import { bpmToMs } from '../utils/audioUtils.js';

export class PlayheadSystem extends Phaser.Events.EventEmitter {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} levelData — { cols, rows, bpm }
   */
  constructor(scene, levelData, offsetX) {
    super();
    this.scene = scene;
    this.cols = levelData.cols;
    this.rows = levelData.rows;
    this.bpm = 110; // 110 is the global DEFAULT_BPM
    this.offsetX = offsetX;

    this.currentCol = 0;
    this.lastBeatTime = 0;
    this.isRunning = false;

    this._createVisual();
  }

  _createVisual() {
    const height = this.rows * (CELL_SIZE + GRID_PADDING) + 30;
    const x = this.offsetX;
    const y = GRID_OFFSET_Y - 15;

    // Playhead bar — glowing vertical line
    this.bar = this.scene.add.rectangle(x, y, 6, height, COLORS.NEON_GREEN)
      .setOrigin(0.5, 0)
      .setAlpha(0);

    // Glow effect behind the bar
    this.glow = this.scene.add.rectangle(x, y, 30, height, COLORS.NEON_GREEN)
      .setOrigin(0.5, 0)
      .setAlpha(0);
  }

  start() {
    this.currentCol = 0;
    this.startTime = 0;
    this.colProgress = 0;
    this.floatCol = 0;
    this.isRunning = true;
    this.bar.setAlpha(0.9);
    this.glow.setAlpha(0.15);
    // Position at very left edge immediately
    this._updateVisualPosition(0);
  }

  stop() {
    this.isRunning = false;
    this.bar.setAlpha(0);
    this.glow.setAlpha(0);
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  get beatDuration() {
    return bpmToMs(this.bpm);
  }

  update(time, delta) {
    if (!this.isRunning) return;

    if (this.startTime === 0) {
      this.startTime = time;
      this.currentCol = 0;
      this.colProgress = 0;
      this.floatCol = 0;
      this.emit('beat', this.currentCol);
      this._updateVisualPosition(0);
      return;
    }

    const beatInterval = bpmToMs(this.bpm);
    const step = delta / beatInterval;
    
    this.colProgress += step;
    this.floatCol += step;

    if (this.colProgress >= 1.0) {
      this.colProgress -= 1.0;
      this.currentCol++;
      if (this.currentCol < this.cols) {
        this.emit('beat', this.currentCol);
      } else {
        this._updateVisualPosition(this.cols);
        this.emit('complete');
        return;
      }
    }

    this._updateVisualPosition(this.floatCol);
  }

  _updateVisualPosition(floatCol) {
    // Start at the left edge of the 0th column and move right continuously
    const targetX = this.offsetX + floatCol * (CELL_SIZE + GRID_PADDING);
    this.bar.x = targetX;
    this.glow.x = targetX;
  }
}
