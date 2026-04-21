// ============================================
// TargetPanel.js — Target pattern display panel
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, COLORS, FONT_FAMILY_UI, GRID_OFFSET_Y, CELL_SIZE, GRID_PADDING } from '../config/constants.js';
import { WORLDS } from '../config/levelData.js';
import { drawBeveledBorder } from '../utils/uiUtils.js';

export class TargetPanel extends Phaser.Events.EventEmitter {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} levelData
   */
  constructor(scene, levelData) {
    super();
    this.scene = scene;
    this.levelData = levelData;
    this.previewCells = [];

    this._create();
  }

  _create() {
    const width = 345;

    // Calculate grid outer width and exact height
    const { cols, rows } = this.levelData;
    const totalGridWidth = cols * (CELL_SIZE + GRID_PADDING) - GRID_PADDING;
    const totalGridHeight = rows * (CELL_SIZE + GRID_PADDING) - GRID_PADDING;
    
    const gap = 67.5; // Must match GridSystem gap
    const totalOuterWidth = (totalGridWidth + 54) + gap + width;

    // Dynamically align X based on the center of the screen
    const startX = (GAME_WIDTH - totalOuterWidth) / 2;
    const x = startX + (totalGridWidth + 54) + gap;

    this.centerX = x + width / 2;

    // We match the exact Y coordinate and Height of the Workbench (GridSystem)
    // GridSystem uses offsetY - 18 and bgHeight = totalHeight + 66.
    const y = GRID_OFFSET_Y - 18; 
    
    const maxWidth = width - 90;
    const miniGap = 6.75;

    // Enforce a minimum height so small levels (e.g. 1-row) don't overlap the UI
    const minRequiredHeight = this.levelData.id === 999 ? 480 : 385;

    // Lock the TargetPanel height EXACTLY to the Workbench panel height WITH a minimum bound
    const height = Math.max(minRequiredHeight, totalGridHeight + 66);
    this.boxBottom = y + height;

    // Provide enough padding for score elements (Free Play needs more space)
    const bottomPadding = this.levelData.id === 999 ? 250 : 155;
    const topSpace = 180; // Space for Title + Listen button

    const availableGridHeight = Math.max(50, height - topSpace - bottomPadding);
    
    const maxCellByWidth = (maxWidth - (cols - 1) * miniGap) / cols;
    const maxCellByHeight = (availableGridHeight - (rows - 1) * miniGap) / Math.max(1, rows);
    
    // Auto-scale the grid cells to fit perfectly within bounding space
    const miniCellSize = Math.max(10, Math.min(58, maxCellByWidth, maxCellByHeight));

    // Get world-specific color
    const worldColor = WORLDS.find(w => w.id === this.levelData.world)?.color || COLORS.BRONZE;

    // Panel background
    this.scene.add.rectangle(x + width/2, y + height/2, width, height, 0x000000, 0).setDepth(0);

    const borderG = this.scene.add.graphics({ x: x + width/2, y: y + height/2 }).setDepth(0);
    drawBeveledBorder(borderG, width, height, worldColor, 1.5, 3, 7, COLORS.BG_DEEP, 1);

    // Title
    this.scene.add.text(x + width / 2, y + 36, 'ORIGINAL BLUEPRINT', {
      fontSize: '24px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    // Listen button
    const listenBtn = this.scene.add.rectangle(x + width / 2, y + 112, 270, 68, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const listenBorderG = this.scene.add.graphics({ x: x + width / 2, y: y + 112 });
    drawBeveledBorder(listenBorderG, 270, 68, COLORS.NEON_GREEN, 0.8, 2.25, 6, COLORS.GRID_BG, 1);

    const listenText = this.scene.add.text(x + width / 2, y + 112, '🔊 Run Blueprint', {
      fontSize: '27px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#00ff88',
    }).setOrigin(0.5);

    listenBtn.on('pointerover', () => {
      drawBeveledBorder(listenBorderG, 270, 68, COLORS.NEON_GREEN, 1, 3.75, 6, COLORS.NEON_GREEN, 0.2);
      if (this.scene.audioEngine) this.scene.audioEngine.playUIHover();
    });
    
    listenBtn.on('pointerout', () => {
      drawBeveledBorder(listenBorderG, 270, 68, COLORS.NEON_GREEN, 0.8, 2.25, 6, COLORS.GRID_BG, 1);
    });

    listenBtn.on('pointerdown', () => {
      this.emit('listen');
      // Flash feedback
      this.scene.tweens.add({
        targets: [listenBtn, listenBorderG, listenText],
        scaleX: 0.95, scaleY: 0.95,
        duration: 60,
        yoyo: true,
      });
    });

    // Draw larger grid preview
    this._drawMiniGrid(x + 45, y + 180, width - 90, availableGridHeight);
  }

  _drawMiniGrid(x, y, maxWidth, maxHeight) {
    const pattern = this.levelData.targetPattern;
    const cols = this.levelData.cols;
    const rows = this.levelData.rows;
    
    const gap = 6.75;
    const maxCellByWidth = (maxWidth - (cols - 1) * gap) / cols;
    const maxCellByHeight = (maxHeight - (rows - 1) * gap) / Math.max(1, rows);
    const cellSize = Math.max(10, Math.min(58, maxCellByWidth, maxCellByHeight));
    
    // Calculate total grid width to center it within maxWidth
    const totalGridWidth = cols * cellSize + (cols - 1) * gap;
    const offsetX = x + (maxWidth - totalGridWidth) / 2;

    this.gridStartX = offsetX;
    this.gridStartY = y;
    this.cellSize = cellSize;
    this.gap = gap;

    for (let row = 0; row < rows; row++) {
      this.previewCells[row] = [];
      for (let col = 0; col < cols; col++) {
        const cx = offsetX + col * (cellSize + gap);
        const cy = y + row * (cellSize + gap);
        const part = pattern[row]?.[col];

        // Use generic color
        const color = part ? 0xa0a0b0 : 0x222233;
        const alpha = part ? 1 : 0.3;
        
        // Use a container for easy centering/scaling
        const cellContainer = this.scene.add.container(cx + cellSize / 2, cy + cellSize / 2);
        
        const rect = this.scene.add.rectangle(0, 0, cellSize, cellSize, color)
          .setOrigin(0.5)
          .setStrokeStyle(1, 0x444455);
          
        if (part) {
          rect.setStrokeStyle(1.5, 0xd0d0e0);
        } else {
          rect.setAlpha(0.3);
        }

        cellContainer.add(rect);
        this.previewCells[row][col] = { container: cellContainer, rect: rect, part: part, defaultColor: color };
      }
    }

    // Playhead Line
    const gridHeight = rows * cellSize + (rows - 1) * gap;
    this.playheadLine = this.scene.add.rectangle(
      offsetX, y - 4, 
      2, gridHeight + 8, 
      COLORS.NEON_GREEN
    )
    .setOrigin(0.5, 0)
    .setAlpha(0)
    .setDepth(10);
  }

  animateCell(col, row) {
    const cellData = this.previewCells[row]?.[col];
    if (cellData && cellData.part) {
      this.scene.tweens.add({
        targets: cellData.container,
        scaleX: 1.15, scaleY: 1.15,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
      // Flash color
      cellData.rect.setFillStyle(COLORS.NEON_GREEN);
      this.scene.time.delayedCall(120, () => {
        if (cellData.rect.active) {
          cellData.rect.setFillStyle(cellData.defaultColor);
        }
      });
    }
  }

  playAnimation(beatMs, cols) {
    if (this.playheadTween) this.playheadTween.stop();
    
    // Show line at start
    this.playheadLine.setAlpha(0.8);
    this.playheadLine.x = this.gridStartX - this.gap;

    const endX = this.gridStartX + cols * (this.cellSize + this.gap);
    const duration = cols * beatMs;

    this.playheadTween = this.scene.tweens.add({
      targets: this.playheadLine,
      x: endX,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.playheadLine,
          alpha: 0,
          duration: 200
        });
        // Clear reference so Pause/Resume logic ignores it instead of calling methods on a destroyed tween
        this.playheadTween = null;
      }
    });
  }
  stopAnimation() {
    if (this.playheadTween) {
      this.playheadTween.stop();
      this.playheadTween = null;
    }
    if (this.playheadLine) {
      this.playheadLine.setAlpha(0);
    }
  }
}
