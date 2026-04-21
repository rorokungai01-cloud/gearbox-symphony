// ============================================
// GridSystem.js — Grid creation & management
// ============================================
import Phaser from 'phaser';
import { CELL_SIZE, GRID_PADDING, GRID_OFFSET_X, GRID_OFFSET_Y, COLORS, FONT_FAMILY_UI, GAME_WIDTH } from '../config/constants.js';
import { drawBeveledBorder } from '../utils/uiUtils.js';
import { GridCell } from '../objects/GridCell.js';
import { emitSparks } from '../effects/SparkEffect.js';
import { WORLDS } from '../config/levelData.js';

export class GridSystem extends Phaser.Events.EventEmitter {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} levelData — { cols, rows, ... }
   */
  constructor(scene, levelData) {
    super();
    this.scene = scene;
    this.levelData = levelData;
    this.cols = levelData.cols;
    this.rows = levelData.rows;

    /** @type {GridCell[][]} 2D array [row][col] */
    this.cells = [];
    
    // Stack for undo functionality
    this.actionHistory = [];

    this.isLocked = false; // Prevents interactions when true

    this._createGrid();
  }

  _createGrid() {
    const totalWidth = this.cols * (CELL_SIZE + GRID_PADDING) - GRID_PADDING;
    const totalHeight = this.rows * (CELL_SIZE + GRID_PADDING) - GRID_PADDING;

    const width = 345; // Blueprint width
    const gap = 45; // Gap between panels
    const totalOuterWidth = (totalWidth + 36) + gap + width;
    
    // Dynamically center both panels collectively on the screen
    const startX = (GAME_WIDTH - totalOuterWidth) / 2;
    const offsetX = startX + 18; // Adjusted for the -18 padding
    this.offsetX = offsetX;
    const offsetY = GRID_OFFSET_Y;

    // Get world-specific color
    const worldColor = WORLDS.find(w => w.id === this.levelData.world)?.color || COLORS.BRONZE;

    // Grid background
    const bgWidth = totalWidth + 36;
    const bgHeight = totalHeight + 36 + 30;
    
    // Transparent interaction plane
    this.scene.add.rectangle(
      offsetX - 18 + bgWidth/2,
      offsetY - 18 + bgHeight/2,
      bgWidth,
      bgHeight,
      0x000000, 0
    ).setDepth(0);

    const borderG = this.scene.add.graphics({
      x: offsetX - 18 + bgWidth/2,
      y: offsetY - 18 + bgHeight/2
    }).setDepth(0);

    drawBeveledBorder(borderG, bgWidth, bgHeight, worldColor, 1.5, 3, 7, COLORS.BG_DEEP, 1);

    // Title label (inside the box now)
    this.scene.add.text(offsetX + (totalWidth / 2), offsetY + 10, 'WORKBENCH', {
      fontSize: '20px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Offset the Y value of the actual grid cells to make room for the title
    const cellsOffsetY = offsetY + 30;
    this.cellsOffsetY = cellsOffsetY;
    // Store for drag hit-testing (closures below need this)
    const dragOffsetX = offsetX;
    const dragOffsetY = cellsOffsetY;

    // Drag state
    this.dragSource = null; // { col, row, partType }

    for (let row = 0; row < this.rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.cols; col++) {
        const x = offsetX + col * (CELL_SIZE + GRID_PADDING);
        const y = cellsOffsetY + row * (CELL_SIZE + GRID_PADDING);

        const cell = new GridCell(this.scene, x, y, col, row, this);
        this.cells[row][col] = cell;

        // Forward click events
        cell.on('click', () => {
          if (this.isLocked) return;
          this.emit('cellClick', col, row);
        });

        // Drag start: store source cell info
        cell.on('dragStart', (srcCol, srcRow, partType) => {
          if (this.isLocked) return;
          this.dragSource = { col: srcCol, row: srcRow, partType };
          this.lastHoverCell = null;

          // Dim source cell to show it's being moved
          cell.bg.setStrokeStyle(2, COLORS.GOLD);
          cell.bg.setAlpha(0.5);

          // Get the part object to follow mouse
          if (cell.partObject) {
            this.draggedPartContainer = cell.partObject;
            this.draggedPartContainer.setDepth(200);

            // Switch to grab cursor
            const canvas = this.scene.game.canvas;
            if (canvas) canvas.classList.add('is-dragging');

            // Smooth lift: scale up + add alpha shadow beneath
            this.scene.tweens.killTweensOf(this.draggedPartContainer);
            this.scene.tweens.add({
              targets: this.draggedPartContainer,
              scaleX: 1.3,
              scaleY: 1.3,
              alpha: 0.95,
              duration: 120,
              ease: 'Back.easeOut'
            });

            // Store original position
            this.draggedPartContainer.origX = this.draggedPartContainer.x;
            this.draggedPartContainer.origY = this.draggedPartContainer.y;
          }
        });
      }
    }

    // Ghost highlight rectangle — shows target drop zone
    this._ghostCell = this.scene.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE)
      .setOrigin(0)
      .setStrokeStyle(2, COLORS.GOLD)
      .setFillStyle(COLORS.GOLD, 0.12)
      .setDepth(150)
      .setVisible(false);

    // Follow pointer while dragging — icon centers on cursor
    const ICON_OFFSET = 36; // CELL_SIZE / 2
    const cellSizeWithPad = CELL_SIZE + GRID_PADDING;

    this.scene.input.on('pointermove', (pointer) => {
      if (this.dragSource && this.draggedPartContainer && this.draggedPartContainer.active) {
        // Snap container to cursor
        this.draggedPartContainer.x = pointer.x - ICON_OFFSET;
        this.draggedPartContainer.y = pointer.y - ICON_OFFSET;

        // Calculate hovered cell — use dragOffsetY (cellsOffsetY) so rows align with actual cell positions
        const hoverCol = Math.floor((pointer.x - dragOffsetX) / cellSizeWithPad);
        const hoverRow = Math.floor((pointer.y - dragOffsetY) / cellSizeWithPad);
        const inGrid = hoverCol >= 0 && hoverCol < this.cols && hoverRow >= 0 && hoverRow < this.rows;
        const isDifferentCell = !this.dragSource || hoverCol !== this.dragSource.col || hoverRow !== this.dragSource.row;

        if (inGrid && isDifferentCell) {
          // Show ghost highlight on target cell — position matches actual cell grid
          const ghostX = dragOffsetX + hoverCol * cellSizeWithPad;
          const ghostY = dragOffsetY + hoverRow * cellSizeWithPad;
          this._ghostCell.setPosition(ghostX, ghostY).setVisible(true);
        } else {
          this._ghostCell.setVisible(false);
        }
      } else {
        this._ghostCell.setVisible(false);
      }
    });

    // Global pointer up for dropping
    this.scene.input.on('pointerup', (pointer) => {
      // Restore default cursor
      const canvas = this.scene.game.canvas;
      if (canvas) canvas.classList.remove('is-dragging');
      this._ghostCell.setVisible(false);

      if (this.dragSource) {
        const src = this.dragSource;
        this.dragSource = null;

        const container = this.draggedPartContainer;
        this.draggedPartContainer = null;

        // Restore source cell appearance
        const srcCell = this._getCell(src.col, src.row);
        if (srcCell) {
          if (srcCell.partObject) {
            srcCell.bg.setAlpha(0.3);
            srcCell.bg.setStrokeStyle(2, srcCell.partObject.partColor);
          } else {
            srcCell.bg.setAlpha(1);
            srcCell.bg.setStrokeStyle(1, COLORS.GRID_LINE);
          }
        }

        const dropCol = Math.floor((pointer.x - dragOffsetX) / cellSizeWithPad);
        const dropRow = Math.floor((pointer.y - dragOffsetY) / cellSizeWithPad);

        let moved = false;
        if (dropCol >= 0 && dropCol < this.cols && dropRow >= 0 && dropRow < this.rows) {
          if (src.col !== dropCol || src.row !== dropRow) {
            this.emit('cellMove', src.col, src.row, dropCol, dropRow);
            moved = true;
          }
        }

        // If drop failed, animate back to origin with a bouncy snap
        if (!moved && container && container.active) {
          this.scene.tweens.killTweensOf(container);
          this.scene.tweens.add({
            targets: container,
            x: container.origX,
            y: container.origY,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 250,
            ease: 'Back.easeOut',
            onComplete: () => {
              if (container.active) container.setDepth(1);
            }
          });
        }
      }
    });
  }

  setLocked(locked) {
    this.isLocked = locked;
    
    // If locked while dragging, abort the drag safely
    if (locked && this.dragSource) {
      if (this.draggedPartContainer && this.draggedPartContainer.active) {
        this.draggedPartContainer.x = this.draggedPartContainer.origX;
        this.draggedPartContainer.y = this.draggedPartContainer.origY;
        this.draggedPartContainer.setDepth(1);
        this.draggedPartContainer.setScale(1);
        this.draggedPartContainer.setAlpha(1);
      }
      const srcCell = this._getCell(this.dragSource.col, this.dragSource.row);
      if (srcCell) {
        if (srcCell.partObject) {
          srcCell.bg.setAlpha(0.3);
          srcCell.bg.setStrokeStyle(2, srcCell.partObject.partColor);
        } else {
          srcCell.bg.setAlpha(1);
          srcCell.bg.setStrokeStyle(1, COLORS.GRID_LINE);
        }
      }
      this.dragSource = null;
      this.draggedPartContainer = null;
      this._ghostCell.setVisible(false);
      const canvas = this.scene.game.canvas;
      if (canvas) canvas.classList.remove('is-dragging');
    }
  }

  /**
   * Place a part in a cell
   */
  placePart(col, row, partType, record = true) {
    const cell = this._getCell(col, row);
    if (cell) {
      const wasEmpty = !cell.partType;
      const prevPart = cell.partType;
      
      // Don't do anything if placing the same part
      if (!wasEmpty && prevPart === partType) return;
      
      cell.setPart(partType);
      
      if (record) {
        this.actionHistory.push({ type: 'place', col, row, newPart: partType, prevPart });
      }
      
      if (wasEmpty) {
        const x = this.getColumnX(col);
        const y = GRID_OFFSET_Y + row * (CELL_SIZE + GRID_PADDING) + CELL_SIZE / 2;
        emitSparks(this.scene, x, y, COLORS.GOLD);
      }
    }
  }

  /**
   * Remove a part from a cell
   */
  removePart(col, row, record = true) {
    const cell = this._getCell(col, row);
    if (cell && cell.partType) {
      const prevPart = cell.partType;
      cell.clearPart();
      
      if (record) {
        this.actionHistory.push({ type: 'remove', col, row, prevPart });
      }
    }
  }

  /**
   * Move a part from src cell to dest cell
   */
  movePart(srcCol, srcRow, destCol, destRow) {
    const srcCell = this._getCell(srcCol, srcRow);
    const destCell = this._getCell(destCol, destRow);
    
    if (srcCell && srcCell.partType && destCell) {
      const partToMove = srcCell.partType;
      const prevDestPart = destCell.partType;
      
      srcCell.clearPart();
      destCell.setPart(partToMove);

      // If the destination had a part, place it in the source cell to swap them
      if (prevDestPart) {
        srcCell.setPart(prevDestPart);
      }
      
      this.actionHistory.push({
        type: 'move',
        srcCol, srcRow,
        destCol, destRow,
        movedPart: partToMove,
        prevDestPart: prevDestPart
      });
      
      return true;
    }
    return false;
  }

  /**
   * Undo the last placement, removal or move
   */
  undo() {
    if (this.actionHistory.length === 0) return false;
    
    const action = this.actionHistory.pop();
    
    if (action.type === 'place') {
      // Revert place (if there was a sub-part, restore it, else remove)
      if (action.prevPart) {
        this.placePart(action.col, action.row, action.prevPart, false);
      } else {
        this.removePart(action.col, action.row, false);
      }
    } else if (action.type === 'remove') {
      // Revert remove
      this.placePart(action.col, action.row, action.prevPart, false);
    } else if (action.type === 'move') {
      // Revert move
      // Clear the destination cell (and restore what was there if anything)
      if (action.prevDestPart) {
        this.placePart(action.destCol, action.destRow, action.prevDestPart, false);
      } else {
        this.removePart(action.destCol, action.destRow, false);
      }
      // Put the moved part back to the source
      this.placePart(action.srcCol, action.srcRow, action.movedPart, false);
    }
    
    return true;
  }

  /**
   * Keep track of currently selected part for hover effects
   */
  setHoverPart(partType) {
    this.hoverPartType = partType;
  }

  getPartColor(partType) {
    const map = {
      hammer: COLORS.HAMMER_COLOR,
      wrench: COLORS.WRENCH_COLOR,
      spring: COLORS.SPRING_COLOR,
      tuningfork: COLORS.TUNINGFORK_COLOR,
      gear: COLORS.GEAR_COLOR,
    };
    return map[partType] || COLORS.WHITE;
  }

  /**
   * Get all parts at a specific column (for playhead beat trigger)
   * @returns {Array<{partType: string, row: number}>}
   */
  getPartsAtColumn(col) {
    const result = [];
    for (let row = 0; row < this.rows; row++) {
      const cell = this.cells[row]?.[col];
      if (cell && cell.partType) {
        result.push({ partType: cell.partType, row });
      }
    }
    return result;
  }

  /**
   * Animate a part at col, row (when triggered by playhead)
   */
  animatePart(col, row) {
    const cell = this._getCell(col, row);
    if (cell) {
      cell.triggerAnimation();
      
      // Spark on trigger
      const x = this.getColumnX(col);
      const y = this.cellsOffsetY + row * (CELL_SIZE + GRID_PADDING) + CELL_SIZE / 2;
      emitSparks(this.scene, x, y, COLORS.WARM_ORANGE);
    }
  }

  /**
   * Get the full grid state as 2D array
   * @returns {(string|null)[][]}
   */
  getGridState() {
    return this.cells.map(rowArr =>
      rowArr.map(cell => cell.partType)
    );
  }

  /**
   * Clear all parts from the grid
   */
  clearAll() {
    this.actionHistory = []; // Reset history on clear
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.cells[row][col].clearPart();
      }
    }
  }

  /**
   * Get the pixel X position of a column (for playhead positioning)
   */
  getColumnX(col) {
    return this.offsetX + col * (CELL_SIZE + GRID_PADDING) + CELL_SIZE / 2;
  }

  /**
   * Get the Y extents of the grid (for playhead height)
   */
  getGridBounds() {
    return {
      top: this.cellsOffsetY - 8,
      bottom: this.cellsOffsetY + this.rows * (CELL_SIZE + GRID_PADDING) + 4,
      left: this.offsetX - 8,
      right: this.offsetX + this.cols * (CELL_SIZE + GRID_PADDING),
    };
  }

  _getCell(col, row) {
    return this.cells[row]?.[col] || null;
  }
}
