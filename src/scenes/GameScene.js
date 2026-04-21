// ============================================
// GameScene.js — Main gameplay scene
// ============================================
// This is the CENTRAL HUB that creates and connects all systems.
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SCENES, FONT_FAMILY_UI } from '../config/constants.js';
import LEVELS from '../config/levelData.js';
import { GridSystem } from '../systems/GridSystem.js';
import { PlayheadSystem } from '../systems/PlayheadSystem.js';
import { AudioEngine } from '../systems/AudioEngine.js';
import { ScoringSystem } from '../systems/ScoringSystem.js';
import { Toolbar } from '../ui/Toolbar.js';
import { TransportBar } from '../ui/TransportBar.js';
import { TargetPanel } from '../ui/TargetPanel.js';
import { StarDisplay } from '../ui/StarDisplay.js';
import { LevelCompleteOverlay } from '../ui/LevelCompleteOverlay.js';
import { MatchHighlighter } from '../ui/MatchHighlighter.js';
import { BackgroundGears } from '../effects/BackgroundGears.js';
import { SteamEffect } from '../effects/SteamEffect.js';
import { TutorialOverlay } from '../ui/TutorialOverlay.js';
import { createMuteButton } from '../ui/MuteButton.js';
import { PauseOverlay } from '../ui/PauseOverlay.js';
import { loadProgress, saveProgress, formatTime, saveBestTime } from '../utils/storageUtils.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME });
  }

  init(data) {
    this.levelId = data.levelId || 1;
    this.levelData = LEVELS.find(l => l.id === this.levelId);
    this.isPlaying = false;
    this.selectedPart = null;
    this.loopCount = 0;
    this.isPaused = false;
    this.levelCompleted = false;
    this.levelTime = 0;
    this.evaluateMode = false;
  }

  create() {
    // Background
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK).setOrigin(0).setDepth(-2);
    this.bgGears = new BackgroundGears(this, this.levelData.world);
    this.steam = new SteamEffect(this);

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Title bar
    this._createHeader();

    // Initialize systems
    this.audioEngine = new AudioEngine();
    this.gridSystem = new GridSystem(this, this.levelData);
    this.playheadSystem = new PlayheadSystem(this, this.levelData, this.gridSystem.offsetX);
    this.scoringSystem = new ScoringSystem(this.levelData);

    // Drop BGM volume to 20% while playing (perceived 20% is ~0.05 linear)
    this.audioEngine.playWorldBGM(this, this.levelData.world, 0.05);

    // Initialize UI
    this.toolbar = new Toolbar(this, this.levelData.availableParts);
    this.transportBar = new TransportBar(this, this.levelData.bpm);
    this.targetPanel = new TargetPanel(this, this.levelData);
    
    // Position score and timer right below the TargetBlueprint box
    const bpCenter = this.targetPanel.centerX;
    const scoreY = this.targetPanel.boxBottom - 50; // 50px padding from bottom border
    this.starDisplay = new StarDisplay(this, bpCenter, scoreY);
    this.matchHighlighter = new MatchHighlighter(this, this.gridSystem.offsetX, this.gridSystem.cellsOffsetY);

    // Reposition the timer to be right under the mini grid
    if (this.timerText) {
      this.timerText.setPosition(bpCenter, this.targetPanel.boxBottom - 125);
      this.timerText.setOrigin(0.5);
      this.timerText.setFontSize('38px');
      this.timerText.setDepth(10); // Ensure it renders ABOVE the Blueprint background
    }
    
    // Pause Overlay
    this.pauseOverlay = new PauseOverlay(this, {
      onResume: () => this._togglePause(),
      onRestart: () => {
        // Clear grid and restart the clock
        this.gridSystem.clearAll();
        if (this.isPlaying) {
          this.isPlaying = false;
          this.playheadSystem.stop();
          this.transportBar.setPlayingState(false);
          this.evaluateMode = false;
        }
        this.levelTime = 0;
        if (this.timerText) this.timerText.setText('00:00.00');
        this._togglePause();
        
        // Auto-play the target pattern again after restarting
        this.time.delayedCall(300, () => {
          this._playTargetPattern();
        });
      },
      onLevelSelect: () => {
        this.isPaused = false; // Unpause before transitioning
        this._transitionTo(SCENES.LEVEL_SELECT, { worldId: this.levelData.world });
      },
      onMainMenu: () => {
        this.isPaused = false;
        this._transitionTo(SCENES.MENU);
      }
    });

    // Connect systems via events
    this._setupEventHandlers();
    
    // Global mute button
    createMuteButton(this, this.audioEngine);

    // Show tutorial on Level 1
    if (this.levelId === 1) {
      new TutorialOverlay(this, () => {
        // Tutorial closed, wait a tiny bit then auto-play pattern
        this.time.delayedCall(500, () => {
          this._playTargetPattern();
        });
      });
    } else {
      // Auto-play pattern initially (reduced delay to start faster)
      this.time.delayedCall(300, () => {
        this._playTargetPattern();
      });
    }
  }

  update(time, delta) {
    if (this.isPaused || this.levelCompleted) return;

    if (this.bgGears) this.bgGears.update(time);

    // Update level timer only if not currently evaluating a submission
    if (!this.evaluateMode) {
      this.levelTime += delta;
      this.timerText.setText(formatTime(this.levelTime));
    }

    if (this.isPlaying) {
      this.playheadSystem.update(time, delta);
    }
  }

  _createHeader() {
    // Machine name
    this.add.text(45, 30, `Machine ${this.levelData.id}: ${this.levelData.name}`, {
      fontSize: '33px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    });

    // Speedrun Timer Text
    this.timerText = this.add.text(GAME_WIDTH - 38, 112, '00:00.00', {
      fontSize: '36px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#888899',
    }).setOrigin(1, 0);

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
        this.tweens.add({ targets: [bg, icon], scaleX: 0.9, scaleY: 0.9, duration: 50, yoyo: true });
        callback();
      });
      
      return { bg, icon };
    };

    // Create Back and Pause buttons
    createSmallBtn(GAME_WIDTH - 38, 52, '✕', () => this._transitionTo(SCENES.LEVEL_SELECT, { worldId: this.levelData.world }), 0xff4444, '36px');
    createSmallBtn(GAME_WIDTH - 113, 52, '❚❚', () => this._togglePause(), 0x44aaff, '27px');
  }

  _togglePause() {
    if (this.levelCompleted) return;
    
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
      
      // Halt target pattern (Blueprint) playback schedule
      if (this.targetTimers) {
        this.targetTimers.forEach(t => t.paused = true);
      }
      if (this.targetPanel && this.targetPanel.playheadTween && this.targetPanel.playheadTween.isPlaying()) {
        this.targetPanel.playheadTween.pause();
      }
    } else {
      this.audioEngine.playUIClick();
      this.pauseOverlay.hide();
      
      // Resume target pattern (Blueprint) playback schedule
      if (this.targetTimers) {
        this.targetTimers.forEach(t => t.paused = false);
      }
      if (this.targetPanel && this.targetPanel.playheadTween && this.targetPanel.playheadTween.isPaused()) {
        this.targetPanel.playheadTween.resume();
      }
    }
  }

  _transitionTo(sceneKey, data) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey, data);
    });
  }

  _transitionToNextLevel() {
    const nextLevelIndex = LEVELS.findIndex(l => l.id === this.levelId) + 1;
    if (nextLevelIndex < LEVELS.length) {
      const nextLevelId = LEVELS[nextLevelIndex].id;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.restart({ levelId: nextLevelId });
      });
    } else {
      // Finished all levels
      this._transitionTo(SCENES.LEVEL_SELECT, { worldId: this.levelData.world });
    }
  }

  _setupEventHandlers() {
    // Keyboard ESC for Pause
    this.input.keyboard.on('keydown-ESC', () => this._togglePause());

    // Toolbar → selected part changes
    this.toolbar.on('select', (partType) => {
      this.selectedPart = partType;
    });

    // Grid cell clicked → place, remove, or preview part
    this.gridSystem.on('cellClick', (col, row) => {
      if (this.levelCompleted || this.isPlaying) return;
      this.audioEngine.resume(); // Safari precaution

      const cell = this.gridSystem.cells[row]?.[col];

      if (this.selectedPart === 'eraser') {
        this.audioEngine.playUIClick();
        this.gridSystem.removePart(col, row);
      } else if (this.selectedPart) {
        // Place new part
        this.gridSystem.placePart(col, row, this.selectedPart);
        this.audioEngine.playSound(this.selectedPart, row);
        
        // Brief pop animation for the placed part
        this.gridSystem.animatePart(col, row);
      } else if (cell && cell.partType) {
        // Preview part sound if no tool is selected or clicking an existing part
        this.audioEngine.playSound(cell.partType, row);
        this.gridSystem.animatePart(col, row);
      }

      // Live scoring feedback while editing
      this._updateLiveScore();
    });

    // Handle dragged parts
    this.gridSystem.on('cellMove', (srcCol, srcRow, destCol, destRow) => {
      if (this.levelCompleted || this.isPlaying) return;
      
      if (this.gridSystem.movePart(srcCol, srcRow, destCol, destRow)) {
        const destCell = this.gridSystem.cells[destRow]?.[destCol];
        if (destCell && destCell.partType) {
           this.audioEngine.playSound(destCell.partType, destRow);
           this.gridSystem.animatePart(destCol, destRow);
        }
        this._updateLiveScore();
      }
    });

    // Transport → undo
    this.transportBar.on('undo', () => {
      if (this.levelCompleted || this.isPlaying) return;
      if (this.gridSystem.undo()) {
        this.audioEngine.playUIClick();
        this._updateLiveScore();
      }
    });

    // Transport → just play one loop to test
    this.transportBar.on('play', () => {
      this._stopTargetPattern();
      if (this.isPlaying) return;
      this.evaluateMode = false;
      this.audioEngine.resume();
      this.audioEngine.playUIClick();
      this.isPlaying = true;
      this.gridSystem.setLocked(true);
      this.loopCount = 0;
      this.playheadSystem.start();
    });

    // Transport → play one loop and confirm score
    this.transportBar.on('finish', () => {
      this._stopTargetPattern();
      if (this.isPlaying) return;
      this.evaluateMode = true;
      this.audioEngine.resume();
      this.audioEngine.playUIClick();
      this.isPlaying = true;
      this.gridSystem.setLocked(true);
      this.loopCount = 0;
      this.playheadSystem.start();
    });

    this.transportBar.on('clear', () => {
      this.audioEngine.playUIClick();
      this.gridSystem.clearAll();
      this.starDisplay.setStars(0);
      this.matchHighlighter.clear();
      this.levelCompleted = false;
    });

    this.transportBar.on('speedChange', (speedPercent) => {
      import('../config/constants.js').then(({ DEFAULT_BPM }) => {
        // Enforce actual 110 BPM logic from constants
        const actualBpm = Math.round(DEFAULT_BPM * (speedPercent / 100));
        this.playheadSystem.setBpm(actualBpm);
        this._updateTargetTimeScale();
      });
    });

    // Playhead beats → trigger sounds
    this.playheadSystem.on('beat', (col) => {
      const parts = this.gridSystem.getPartsAtColumn(col);
      parts.forEach(({ partType, row }) => {
        this.audioEngine.playSound(partType, row);
        this.gridSystem.animatePart(col, row);
      });

    });

    this.playheadSystem.on('complete', () => {
      this.loopCount++;
      
      // Stop the playhead right after the last beat finishes
      this.isPlaying = false;
      this.gridSystem.setLocked(false);
      this.playheadSystem.stop();
      this.transportBar.setPlayingState(false);
      
      // Wait a tiny bit (300ms) for the last sound to ring out before showing feedback
      this.time.delayedCall(300, () => {
        if (this.evaluateMode) {
          this._evaluateScore();
        } else {
          // Test mode: show match indicators without scoring
          this._showTestFeedback();
        }
      });
    });

    // Target panel listen button
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
    const playerGrid = this.gridSystem.getGridState();
    const result = this.scoringSystem.evaluate(playerGrid);
    this.starDisplay.setStars(result.stars);
  }

  /**
   * Show match/mismatch feedback after Test loop (no scoring, no level-complete)
   */
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
    if (this.levelCompleted) return;

    const playerGrid = this.gridSystem.getGridState();
    const result = this.scoringSystem.evaluate(playerGrid);
    this.starDisplay.setStars(result.stars);

    // Show match indicators
    this.matchHighlighter.show(
      playerGrid,
      this.levelData.targetPattern,
      this.levelData.rows,
      this.levelData.cols
    );

    if (result.stars >= 2) {
      this.levelCompleted = true;
      this.isPlaying = false;
      this.playheadSystem.stop();
      this.transportBar.setPlayingState(false);
      this.audioEngine.playUISuccess();

      this._onLevelPassed(result.stars, result.matchRatio);
    } else {
      // If we didn't pass, stop the loop and visually indicate it didn't pass
      this.isPlaying = false;
      this.evaluateMode = false; // Unfreeze timer
      this.playheadSystem.stop();
      this.transportBar.setPlayingState(false);
      // Wait for the sounds to finish then maybe clear the highlights
      this.time.delayedCall(1000, () => {
        if (!this.isPlaying) this.matchHighlighter.clear();
      });
    }
  }

  _onLevelPassed(stars, matchRatio) {
    // Stop playhead & audio
    this.isPlaying = false;
    this.playheadSystem.stop();
    this.transportBar.setPlayingState(false);
    
    // Save standard stars progress
    const saveData = loadProgress();
    saveData.stars[this.levelId] = Math.max(saveData.stars[this.levelId] || 0, stars);
    
    // Unlock next level if criteria met (no lock limits here)
    if (stars >= 2) {
      saveData.unlockedLevel = Math.max(saveData.unlockedLevel, this.levelId + 1);
    }
    saveProgress(saveData);
    
    // Save Best Time separately
    const isNewBestTime = saveBestTime(this.levelId, this.levelTime);

    // Show completion overlay with stars and time
    import('../ui/LevelCompleteOverlay.js').then(({ LevelCompleteOverlay }) => {
      new LevelCompleteOverlay(this, {
        stars,
        timeMs: this.levelTime,
        isNewBest: isNewBestTime,
        onNext: () => this._transitionToNextLevel(),
        onMenu: () => this._transitionTo(SCENES.LEVEL_SELECT, { worldId: this.levelData.world })
      });
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
    this._stopTargetPattern();



    const pattern = this.levelData.targetPattern;
    // ALWAYS base initial generation on constant global 100% speed (110 BPM)
    const baseBpm = 110; // Replaces this.levelData.bpm to enforce uniform 100% speed
    const baseBeatMs = (60 / baseBpm) * 1000;

    // Trigger visual playhead on target panel with true base duration
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
    
    // Apply current UI speed modifier instantly
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
}
