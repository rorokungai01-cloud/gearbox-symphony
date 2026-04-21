// ============================================
// FreePlayScene.js — Endless random puzzles
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SCENES, FONT_FAMILY_UI, PART_TYPES } from '../config/constants.js';
import { GridSystem } from '../systems/GridSystem.js';
import { PlayheadSystem } from '../systems/PlayheadSystem.js';
import { ScoringSystem } from '../systems/ScoringSystem.js';
import { AudioEngine } from '../systems/AudioEngine.js';
import { Toolbar } from '../ui/Toolbar.js';
import { TargetPanel } from '../ui/TargetPanel.js';
import { TransportBar } from '../ui/TransportBar.js';
import { StarDisplay } from '../ui/StarDisplay.js';
import { MatchHighlighter } from '../ui/MatchHighlighter.js';
import { PauseOverlay } from '../ui/PauseOverlay.js';
import { BackgroundGears } from '../effects/BackgroundGears.js';
import { SteamEffect } from '../effects/SteamEffect.js';
import { WORLDS } from '../config/levelData.js';
import { formatTime } from '../utils/storageUtils.js';

export class FreePlayScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.FREE_PLAY });
  }

  init(data) {
    this.isPlaying = false;
    this.selectedPart = null;
    this.evaluateMode = false;
    this.isPaused = false;
    this.roundTime = 0;
    this.totalTime = data?.totalTime || 0;
    this.roundCount = data?.roundCount || 1;
    this.totalStars = data?.totalStars || 0;

    // Config defaults
    this.freePlayConfig = data?.config || {
      toolboxSize: 5,
      maxVertParts: 3,
      cols: 8
    };
  }

  create() {
    // Generate initial level data
    this._generatePuzzle();

    // Setup backgrounds
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK).setOrigin(0).setDepth(-2);
    this.bgGears = new BackgroundGears(this, this.levelData.world);
    this.steam = new SteamEffect(this);

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Initialize systems
    this.audioEngine = new AudioEngine();
    this.gridSystem = new GridSystem(this, this.levelData);
    this.playheadSystem = new PlayheadSystem(this, this.levelData, this.gridSystem.offsetX);
    this.scoringSystem = new ScoringSystem(this.levelData);

    // Start BGM
    this.audioEngine.playWorldBGM(this, this.levelData.world, 0.05);

    // Initialize UI
    this.toolbar = new Toolbar(this, this.activePartsList);
    this.transportBar = new TransportBar(this, this.levelData.bpm);
    this.targetPanel = new TargetPanel(this, this.levelData);
    
    // Position score below Blueprint box
    const bpCenter = this.targetPanel.centerX;
    const scoreY = this.targetPanel.boxBottom - 115; // Move up further to clear the bottom bezel

    // Total Timer Text (positioned over the target panel's score section as the MAIN big timer)
    this.totalTimeText = this.add.text(bpCenter, this.targetPanel.boxBottom - 215, `Total: ${formatTime(this.totalTime)}`, {
      fontSize: '36px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);

    // Round Timer Text (positioned just below total timer as secondary)
    this.timerText = this.add.text(bpCenter, this.targetPanel.boxBottom - 180, 'Round: 00:00.00', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);

    this.starDisplay = new StarDisplay(this, bpCenter, scoreY);
    this.matchHighlighter = new MatchHighlighter(this, this.gridSystem.offsetX, this.gridSystem.cellsOffsetY);

    // Total stars counter (placed under the Blueprint's star display, snugly in the box)
    this.totalStarsText = this.add.text(bpCenter, scoreY + 45, `⭐ Total Stars: ${this.totalStars}`, {
      fontSize: '22px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5, 0).setDepth(11);

    // Pause Overlay
    this.pauseOverlay = new PauseOverlay(this, {
      onResume: () => this._togglePause(),
      onRestart: () => {
          this.roundTime = 0;
          if (this.timerText) this.timerText.setText('Round: 00:00.00');
          this.scene.restart({ 
            roundCount: this.roundCount, 
            totalStars: this.totalStars, 
            totalTime: this.totalTime,
            config: this.freePlayConfig
          });
      },
      onMainMenu: () => this._transitionTo(SCENES.MENU)
    });

    // Create Header last so buttons render on top of panels
    this._createHeader();

    // Auto-play pattern initially (reduced delay to start faster)
    this.time.delayedCall(300, () => {
      this._playTargetPattern();
    });

    this._setupEvents();
  }

  update(time, delta) {
    if (this.isPaused) return;
    
    if (this.bgGears) this.bgGears.update(time);

    if (!this.evaluateMode) {
      this.roundTime += delta;
      this.totalTime += delta;
      this.timerText.setText(`Round: ${formatTime(this.roundTime)}`);
      this.totalTimeText.setText(`Total: ${formatTime(this.totalTime)}`);
    }

    if (this.isPlaying) {
      this.playheadSystem.update(time, delta);
    }
  }

  _generatePuzzle() {
    const cols = this.freePlayConfig.cols;
    const rows = 5; // Fixed height
    const bpm = 140;
    const worldId = Phaser.Math.Between(1, 3);
    
    // Generate pattern
    const pattern = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    // Select the permitted parts from the global list
    const allPartsList = Object.values(PART_TYPES);
    Phaser.Utils.Array.Shuffle(allPartsList);
    const partsList = allPartsList.slice(0, this.freePlayConfig.toolboxSize);
    
    // Track what we placed to ensure variety
    const usedParts = new Set();
    
    this.activePartsList = partsList;
    
    // Fill pattern column by column
    for (let c = 0; c < cols; c++) {
      // Pick parts based on maxVertParts config, but limit to toolboxSize and rows
      const maxPossible = Math.min(this.freePlayConfig.maxVertParts, partsList.length, rows);
      let minPossible = Math.min(2, maxPossible);
      // Ensure we don't have empty columns
      if (minPossible < 1) minPossible = 1;
      
      const numParts = Phaser.Math.Between(minPossible, maxPossible);
      
      // Pick unique random rows
      const rowIndices = [0, 1, 2, 3, 4];
      Phaser.Utils.Array.Shuffle(rowIndices);
      const selectedRows = rowIndices.slice(0, numParts);
      
      // Pick unique random parts (prevent duplicate parts in same column)
      const availableParts = [...partsList];
      Phaser.Utils.Array.Shuffle(availableParts);
      const selectedParts = availableParts.slice(0, numParts);
      
      // Place them
      for (let i = 0; i < numParts; i++) {
        const r = selectedRows[i];
        const part = selectedParts[i];
        pattern[r][c] = part;
        usedParts.add(part);
      }
    }
    
    // Post-generation validation
    // Ensure all 5 part types exist at least once in the entire puzzle
    partsList.forEach(part => {
      if (!usedParts.has(part)) {
        // Find a column that has < 3 parts and doesn't already have this part
        const validCols = [];
        for (let c = 0; c < cols; c++) {
           let partsInCol = 0;
           let hasPart = false;
           for(let r = 0; r < rows; r++) {
               if (pattern[r][c] !== null) partsInCol++;
               if (pattern[r][c] === part) hasPart = true;
           }
           if (partsInCol < 3 && !hasPart) validCols.push(c);
        }
        
        if (validCols.length > 0) {
            const chosenCol = Phaser.Utils.Array.GetRandom(validCols);
            // find empty row in that column
            const emptyRows = [];
            for (let r = 0; r < rows; r++) if (pattern[r][chosenCol] === null) emptyRows.push(r);
            if (emptyRows.length > 0) {
                const chosenRow = Phaser.Utils.Array.GetRandom(emptyRows);
                pattern[chosenRow][chosenCol] = part;
                usedParts.add(part);
            }
        } else {
            // Fallback (extremely rare)
            const randRow = Phaser.Math.Between(0, rows - 1);
            const randCol = Phaser.Math.Between(0, cols - 1);
            pattern[randRow][randCol] = part;
            usedParts.add(part);
        }
      }
    });

    this.levelData = {
      id: 999, // Custom ID
      name: `Random Configuration`,
      world: worldId,
      cols: cols,
      rows: rows,
      bpm: bpm,
      availableParts: Object.values(PART_TYPES),
      targetPattern: pattern
    };
  }

  _createHeader() {
    // Top bar background removed to prevent overlapping with Toolbar

    const world = WORLDS.find(w => w.id === this.levelData.world);
    
    this.roundText = this.add.text(45, 45, `🎲 FREE PLAY - ROUND ${this.roundCount}`, {
       fontSize: '33px',
       fontFamily: FONT_FAMILY_UI,
       fontStyle: 'bold',
       color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(11);

    this.worldText = this.add.text(45, 78, `Sector: ${world.name}`, {
       fontSize: '18px',
       fontFamily: FONT_FAMILY_UI,
       color: '#' + world.color.toString(16).padStart(6, '0'),
    }).setOrigin(0, 0).setDepth(11);


    // Helper for top-right small buttons
    const createSmallBtn = (x, y, iconStr, callback, hoverColor, fontSize) => {
      const bg = this.add.rectangle(x, y, 60, 60, 0x1a1a2e, 0.85)
        .setStrokeStyle(1.5, 0x555566)
        .setOrigin(1, 0.5)
        .setInteractive({ useHandCursor: true });

      const icon = this.add.text(x - 30, y, iconStr, {
        fontSize: fontSize,
        fontFamily: FONT_FAMILY_UI,
        color: '#ccccdd',
      }).setOrigin(0.5);

      bg.on('pointerover', () => {
        bg.setFillStyle(0x333344, 0.9);
        bg.setStrokeStyle(1.5, hoverColor);
        icon.setColor('#ffffff');
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x1a1a2e, 0.85);
        bg.setStrokeStyle(1.5, 0x555566);
        icon.setColor('#ccccdd');
      });

      bg.on('pointerdown', () => {
        if (!this.isPaused || iconStr === '▶' || iconStr === '❚❚') {
            this.tweens.add({ targets: [bg, icon], scaleX: 0.9, scaleY: 0.9, duration: 50, yoyo: true });
            callback();
        }
      });
      
      return { bg, icon };
    };

    // Create Back and Pause buttons
    createSmallBtn(GAME_WIDTH - 38, 52, '✕', () => this._transitionTo(SCENES.MENU), 0xff4444, '36px');
    createSmallBtn(GAME_WIDTH - 113, 52, '❚❚', () => this._togglePause(), 0x44aaff, '27px');
  }

  _togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.audioEngine.playUIClick();
      this.pauseOverlay.show();
      // Abort workbench playhead if running, resetting to edit mode
      if (this.isPlaying) {
        this.isPlaying = false;
        this.playheadSystem.stop();
        this.transportBar.setPlayingState(false);
        this.evaluateMode = false;
        if (this.gridSystem) this.gridSystem.setLocked(false);
      }
      if (this.targetTimers) {
        this.targetTimers.forEach(t => t.paused = true);
      }
      if (this.targetPanel && this.targetPanel.playheadTween && this.targetPanel.playheadTween.isPlaying()) {
        this.targetPanel.playheadTween.pause();
      }
    } else {
      this.audioEngine.playUIClick();
      // Only resume if we were actually playing before pause
      if (this.isPlaying) this.playheadSystem.start();
      
      if (this.targetTimers) {
        this.targetTimers.forEach(t => t.paused = false);
      }
      if (this.targetPanel && this.targetPanel.playheadTween && this.targetPanel.playheadTween.isPaused()) {
        this.targetPanel.playheadTween.resume();
      }
    }
  }

  _setupEvents() {
    this.toolbar.on('select', (partType) => {
      this.selectedPart = partType;
    });

    this.gridSystem.on('cellClick', (col, row) => {
      if (this.isPlaying) return;
      this.audioEngine.resume();
      
      const cell = this.gridSystem.cells[row][col];
      
      if (this.selectedPart === 'eraser') {
        if (!cell.partType) return;
        this.audioEngine.playUIClick();
        this.gridSystem.removePart(col, row);
      } else if (this.selectedPart) {
        this.gridSystem.placePart(col, row, this.selectedPart);
        this.audioEngine.playSound(cell.partType, row);
        this.gridSystem.animatePart(col, row);
      }
      
      this._updateLiveScore();
    });

    this.gridSystem.on('cellMove', (srcCol, srcRow, destCol, destRow) => {
      if (this.isPlaying) return;
      if (this.gridSystem.movePart(srcCol, srcRow, destCol, destRow)) {
        const destCell = this.gridSystem.cells[destRow]?.[destCol];
        if (destCell && destCell.partType) {
           this.audioEngine.playSound(destCell.partType, destRow);
           this.gridSystem.animatePart(destCol, destRow);
        }
        this._updateLiveScore();
      }
    });

    this.transportBar.on('undo', () => {
      if (this.isPlaying) return;
      if (this.gridSystem.undo()) {
        this.audioEngine.playUIClick();
        this._updateLiveScore();
      }
    });

    this.transportBar.on('play', () => {
      this._stopTargetPattern();
      if (this.isPlaying) return;
      this.evaluateMode = false;
      this.audioEngine.resume();
      this.audioEngine.playUIClick();
      this.isPlaying = true;
      this.gridSystem.setLocked(true);
      this.playheadSystem.start();
    });

    this.transportBar.on('finish', () => {
      this._stopTargetPattern();
      if (this.isPlaying) return;
      this.evaluateMode = true;
      this.audioEngine.resume();
      this.audioEngine.playUIClick();
      this.isPlaying = true;
      this.gridSystem.setLocked(true);
      this.playheadSystem.start();
    });

    this.transportBar.on('clear', () => {
      this.audioEngine.playUIClick();
      this.gridSystem.clearAll();
      this._updateLiveScore();
      this.matchHighlighter.clear();
    });

    this.transportBar.on('speedChange', (speedPercent) => {
      const baseBpm = 110; // Enforce universal base speed
      const actualBpm = Math.round(baseBpm * (speedPercent / 100));
      this.playheadSystem.setBpm(actualBpm);
      this._updateTargetTimeScale();
    });

    this.playheadSystem.on('beat', (col) => {
      const parts = this.gridSystem.getPartsAtColumn(col);
      parts.forEach(({ partType, row }) => {
        this.audioEngine.playSound(partType, row);
        this.gridSystem.animatePart(col, row);
      });
    });

    this.playheadSystem.on('complete', () => {
      this.isPlaying = false;
      this.gridSystem.setLocked(false);
      this.playheadSystem.stop();
      this.transportBar.setPlayingState(false);
      
      this.time.delayedCall(300, () => {
        if (this.evaluateMode) {
          this._evaluateScore();
        } else {
          this._showTestFeedback();
        }
      });
    });

    this.targetPanel.on('listen', () => {
      this.audioEngine.resume();
      this.audioEngine.playUIClick();
      this._playTargetPattern();
    });
  }

  /**
   * Live score update while editing (no popup, just stars)
   */
  _updateLiveScore() {
    if (this.freePlayConfig && this.freePlayConfig.showLiveScore === false) {
      this.starDisplay.setStars(0);
      return;
    }
    const playerGrid = this.gridSystem.getGridState();
    const result = this.scoringSystem.evaluate(playerGrid);
    this.starDisplay.setStars(result.stars);
  }

  _showTestFeedback() {
    const playerGrid = this.gridSystem.getGridState();
    const result = this.scoringSystem.evaluate(playerGrid);
    this.starDisplay.setStars(result.stars);

    this.matchHighlighter.show(
      playerGrid,
      this.levelData.targetPattern,
      this.levelData.rows,
      this.levelData.cols
    );
  }

  _evaluateScore() {
    const playerGrid = this.gridSystem.getGridState();
    const result = this.scoringSystem.evaluate(playerGrid);
    this.starDisplay.setStars(result.stars);

    this.matchHighlighter.show(
      playerGrid,
      this.levelData.targetPattern,
      this.levelData.rows,
      this.levelData.cols
    );

    if (result.stars >= 2) {
      this.audioEngine.playUISuccess();
      this.totalStars += result.stars;
      this._onRoundPassed();
    } else {
      this.evaluateMode = false;
      this.time.delayedCall(1000, () => {
        if (!this.isPlaying) this.matchHighlighter.clear();
      });
    }
  }

  _onRoundPassed() {
    this.isPlaying = false;
    this.playheadSystem.stop();
    this.transportBar.setPlayingState(false);
    
    // Show summary overlay instead of plain text
    import('../ui/LevelCompleteOverlay.js').then(({ LevelCompleteOverlay }) => {
      new LevelCompleteOverlay(this, {
        stars: this.starDisplay.stars,
        timeMs: this.roundTime,
        isNewBest: false,
        onNext: () => this._startNextRound(),
        onRetry: () => {
          // Explicit Retry logic for FreePlay: restart the same scene but reset time
          this.scene.restart({
            roundCount: this.roundCount,
            totalStars: this.totalStars - this.starDisplay.stars,
            totalTime: this.totalTime,
            config: this.freePlayConfig
          });
        },
        onMenu: () => this._transitionTo(SCENES.MENU)
      });
    });
  }

  _startNextRound() {
    this.roundCount++;
    this.scene.restart({
        roundCount: this.roundCount,
        totalStars: this.totalStars,
        totalTime: this.totalTime,
        config: this.freePlayConfig
    });
  }

  _stopTargetPattern() {
    if (this.targetTimers) {
      this.targetTimers.forEach(timer => timer.remove(false));
    }
    this.targetTimers = [];
    if (this.targetPanel && this.targetPanel.stopAnimation) {
      this.targetPanel.stopAnimation();
    }
  }

  _playTargetPattern() {
    this._stopTargetPattern();    const pattern = this.levelData.targetPattern;
    const baseBpm = 110;
    const baseBeatMs = (60 / baseBpm) * 1000;

    this.targetPanel.playAnimation(baseBeatMs, this.levelData.cols);

    for (let col = 0; col < this.levelData.cols; col++) {
      for (let row = 0; row < this.levelData.rows; row++) {
        const part = pattern[row]?.[col];
        if (part) {
          const timer = this.time.delayedCall(col * baseBeatMs, () => {
            this.audioEngine.playSound(part, row);
            this.targetPanel.animateCell(col, row);
          });
          this.targetTimers.push(timer);
        }
      }
    }
    
    this._updateTargetTimeScale();
  }

  _updateTargetTimeScale() {
    const scale = this.transportBar ? (this.transportBar.speed / 100) : 1;
    if (this.targetTimers) {
      this.targetTimers.forEach(t => {
        if (t && !t.hasDispatched) t.timeScale = scale;
      });
    }
    if (this.targetPanel && this.targetPanel.playheadTween) {
      this.targetPanel.playheadTween.timeScale = scale;
    }
  }

  _transitionTo(sceneKey) {
    this.audioEngine.resume();
    this.audioEngine.playUIClick();
    this.audioEngine.stopBGM();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey);
    });
  }
}
