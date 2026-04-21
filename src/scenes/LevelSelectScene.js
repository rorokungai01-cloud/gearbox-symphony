// ============================================
// LevelSelectScene.js — World & Level selection
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SCENES, FONT_FAMILY_UI } from '../config/constants.js';
import { BackgroundGears } from '../effects/BackgroundGears.js';
import { SteamEffect } from '../effects/SteamEffect.js';
import LEVELS, { WORLDS } from '../config/levelData.js';
import { loadProgress, formatTime } from '../utils/storageUtils.js';
import { AudioEngine } from '../systems/AudioEngine.js';
import { createMuteButton } from '../ui/MuteButton.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.LEVEL_SELECT });
  }

  init(data) {
    this.selectedWorld = data?.worldId || 1;
  }

  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.BG_DARK).setOrigin(0).setDepth(-2);
    this.bgGears = new BackgroundGears(this, this.selectedWorld);
    this.steam = new SteamEffect(this);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.audioEngine = new AudioEngine();
    
    this.audioEngine.playWorldBGM(this, this.selectedWorld, 0.25);

    const save = loadProgress();

    // Title
    this.add.text(GAME_WIDTH / 2, 45, 'SELECT LEVEL', {
      fontSize: '42px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    // World tabs
    this._createWorldTabs(save);

    // Level grid for selected world
    this._createLevelGrid(save);

    // Back button
    this._createBackButton();
    
    // Global mute button
    createMuteButton(this, this.audioEngine);
  }

  update(time) {
    if (this.bgGears) this.bgGears.update(time);
  }

  _createWorldTabs(save) {
    const tabY = 112;
    const tabWidth = 330;
    const gap = 18;
    const totalWidth = WORLDS.length * (tabWidth + gap) - gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + tabWidth / 2;

    WORLDS.forEach((world, i) => {
      const x = startX + i * (tabWidth + gap);
      const isSelected = world.id === this.selectedWorld;

      // Always unlock tabs so players can preview upcoming world BGM and visuals
      const isUnlocked = true;

      const bgAlpha = isSelected ? 0.2 : 1;
      const bgFill = isSelected ? world.color : (isUnlocked ? COLORS.GRID_BG : 0x1a1a28);

      const bg = this.add.rectangle(x, tabY, tabWidth, 60, 0x000000, 0).setDepth(0);

      const borderG = this.add.graphics({ x, y: tabY }).setDepth(0);
      const unselectedColor = isUnlocked ? 0x555566 : 0x333344;
      const currentColor = isSelected ? world.color : unselectedColor;
      
      this._drawBeveledBorder(borderG, tabWidth, 60, currentColor, isSelected ? 1 : 0.6, isSelected ? 3 : 2.25, 4.5, bgFill, bgAlpha);

      const label = this.add.text(x, tabY, `${world.icon} Floor ${world.id}`, {
        fontSize: '19px',
        fontFamily: FONT_FAMILY_UI,
        fontStyle: 'bold',
        color: isSelected ? '#ffffff' : (isUnlocked ? '#aaaabb' : '#444455'),
      }).setOrigin(0.5);

      if (isUnlocked && !isSelected) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
          this._drawBeveledBorder(borderG, tabWidth, 60, world.color, 1, 3, 4.5, bgFill, bgAlpha);
          if (this.audioEngine) this.audioEngine.playUIHover();
        });
        bg.on('pointerout', () => {
          this._drawBeveledBorder(borderG, tabWidth, 60, unselectedColor, 0.6, 2.25, 4.5, bgFill, bgAlpha);
        });
        bg.on('pointerdown', () => {
          this._transitionTo(SCENES.LEVEL_SELECT, { worldId: world.id });
        });
      }
    });
  }

  _createLevelGrid(save) {
    const world = WORLDS.find(w => w.id === this.selectedWorld);
    if (!world) return;

    const [firstId, lastId] = world.levels;
    const worldLevels = LEVELS.filter(l => l.id >= firstId && l.id <= lastId);
    const unlockedLevel = save.unlockedLevel || 1;

    // World name
    this.add.text(GAME_WIDTH / 2, 180, world.name, {
      fontSize: '30px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: '600',
      color: '#' + world.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);

    // Grid: 5 cols × 2 rows
    const gridCols = 5;
    const size = 165;
    const gapX = 202;
    const gapY = 248;
    const totalWidth = gridCols * gapX - (gapX - size);
    const startX = (GAME_WIDTH - totalWidth) / 2 + size / 2;
    const startY = 300;

    // Track floor totals
    let totalStars = 0;
    const maxStars = worldLevels.length * 3;
    let allThreeStars = true;
    let totalTimeMs = 0;

    worldLevels.forEach((level, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const x = startX + col * gapX;
      const y = startY + row * gapY;
      const isUnlocked = level.id <= unlockedLevel;
      const stars = save.stars[level.id] || 0;
      const bestTimeMs = save.bestTimes?.[level.id];

      totalStars += stars;
      if (stars < 3) allThreeStars = false;
      if (bestTimeMs && stars === 3) totalTimeMs += bestTimeMs;

      this._createLevelButton(x, y, size, level, isUnlocked, stars, bestTimeMs, world.color);
    });

    // === Floor Summary ===
    this._createFloorSummary(world, totalStars, maxStars, allThreeStars, totalTimeMs);
  }

  _createLevelButton(x, y, size, level, isUnlocked, stars, bestTimeMs, worldColor) {
    const color = isUnlocked ? COLORS.GRID_BG : 0x1a1a28;
    const strokeColor = isUnlocked ? worldColor : 0x333344;
    const borderAlpha = isUnlocked ? 0.8 : 0.4;

    const bg = this.add.rectangle(x, y, size, size, 0x000000, 0).setDepth(0);
    
    const borderG = this.add.graphics({ x, y }).setDepth(0);
    this._drawBeveledBorder(borderG, size, size, strokeColor, borderAlpha, 1.5, 4, color, 1);

    // Level number
    this.add.text(x, y - 27, `${level.id}`, {
      fontSize: '42px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: isUnlocked ? '#ffd700' : '#444455',
    }).setOrigin(0.5);

    // Stars formatting (Always show stars to avoid empty cards)
    const starIcons = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    this.add.text(x, y + 25, starIcons, {
      fontSize: '24px', 
      padding: { top: 10, bottom: 10 },
      alpha: stars > 0 ? 1 : 0.3 // Dim empty stars
    }).setOrigin(0.5);

    // Best Time 
    if (stars === 3 && bestTimeMs) {
      this.add.text(x, y + 60, `⏱ ${formatTime(bestTimeMs)}`, {
        fontSize: '15px',
        fontFamily: 'monospace',
        color: '#00ff88'
      }).setOrigin(0.5);
    } else {
      this.add.text(x, y + 60, 'NO RECORD', {
        fontSize: '15px',
        fontFamily: FONT_FAMILY_UI,
        fontStyle: 'bold',
        color: stars > 0 ? '#ff4444' : '#666677' // Red if they played but didn't perfect, Dim if unplayed
      }).setOrigin(0.5);
    }

    // Level name
    this.add.text(x, y + 102, level.name, {
      fontSize: '17px',
      fontFamily: FONT_FAMILY_UI,
      color: isUnlocked ? '#e8e8e8' : '#333344',
      align: 'center',
      wordWrap: { width: size + 30 }
    }).setOrigin(0.5);

    // Lock icon
    if (!isUnlocked) {
      this.add.text(x, y - 27, '🔒', { 
        fontSize: '48px',
        padding: { top: 12, bottom: 12 }
      }).setOrigin(0.5);
    }

    // Click handler
    if (isUnlocked) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        this._drawBeveledBorder(borderG, size, size, COLORS.GOLD, 1, 2.5, 4, color, 1);
        if (this.audioEngine) this.audioEngine.playUIHover();
      });
      bg.on('pointerout', () => {
        this._drawBeveledBorder(borderG, size, size, strokeColor, borderAlpha, 1.5, 4, color, 1);
      });
      bg.on('pointerdown', () => {
        this._transitionTo(SCENES.GAME, { levelId: level.id });
      });
    }
  }

  _createFloorSummary(world, totalStars, maxStars, allThreeStars, totalTimeMs) {
    const startY = 570; // Adjusted for frame
    const cx = GAME_WIDTH / 2;
    const boxW = 540;
    const boxH = 150;

    // Draw the summary container using the unified beveled frame style
    const bgG = this.add.graphics({ x: cx, y: startY + boxH / 2 });
    this._drawBeveledBorder(bgG, boxW, boxH, world.color, 0.8, 2, 4, 0x0f0f15, 0.85);

    this.add.text(cx, startY + 38, `${world.name} Summary`, {
      fontSize: '27px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'bold',
      color: '#' + world.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);

    this.add.text(cx, startY + 83, `Stars: ${totalStars} / ${maxStars}`, {
      fontSize: '21px',
      fontFamily: FONT_FAMILY_UI,
      color: '#ffd700',
    }).setOrigin(0.5);

    let timeText = 'No Record';
    let timeColor = '#ff4444';

    if (allThreeStars) {
      timeText = formatTime(totalTimeMs);
      timeColor = '#00ff88';
    }

    this.add.text(cx, startY + 120, `Total Time: ${timeText}`, {
      fontSize: '21px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: timeColor,
    }).setOrigin(0.5);
  }

  _createBackButton() {
    const x = GAME_WIDTH - 38;
    const y = 52;
    
    const bg = this.add.rectangle(x, y, 60, 60, 0x1a1a2e, 0.85)
      .setStrokeStyle(1.5, 0x555566)
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    const icon = this.add.text(x - 30, y, '✕', {
      fontSize: '36px',
      fontFamily: FONT_FAMILY_UI,
      color: '#ccccdd',
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x333344, 0.9);
      bg.setStrokeStyle(1.5, 0xff4444);
      icon.setColor('#ffffff');
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a1a2e, 0.85);
      bg.setStrokeStyle(1.5, 0x555566);
      icon.setColor('#ccccdd');
    });

    bg.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, icon], scaleX: 0.9, scaleY: 0.9, duration: 50, yoyo: true });
      this._transitionTo(SCENES.MENU);
    });
  }

  _drawBeveledBorder(graphics, width, height, color, alpha, thickness, gap = 8, fillColor = null, fillAlpha = 0) {
    graphics.clear();
    const cut = 12; // Angled corner size

    const drawChamfer = (g, inset) => {
      const hW = width / 2 - inset;
      const hH = height / 2 - inset;
      const c = Math.max(0, cut - inset);
      
      g.beginPath();
      g.moveTo(-hW + c, -hH);
      g.lineTo(hW - c, -hH);
      g.lineTo(hW, -hH + c);
      g.lineTo(hW, hH - c);
      g.lineTo(hW - c, hH);
      g.lineTo(-hW + c, hH);
      g.lineTo(-hW, hH - c);
      g.lineTo(-hW, -hH + c);
      g.closePath();
    };

    // Fill background
    if (fillColor !== null) {
      drawChamfer(graphics, 0);
      graphics.fillStyle(fillColor, fillAlpha);
      graphics.fillPath();
    }

    // Outer Thick Metallic Border
    drawChamfer(graphics, 0);
    graphics.lineStyle(thickness + 1.5, 0x000000, 0.8 * alpha);
    graphics.strokePath();
    drawChamfer(graphics, 0);
    graphics.lineStyle(thickness, color, alpha);
    graphics.strokePath();

    // Inner bevel seam
    drawChamfer(graphics, gap);
    graphics.lineStyle(2, 0x000000, 0.9 * alpha);
    graphics.strokePath();
    
    drawChamfer(graphics, gap + 1);
    graphics.lineStyle(1.5, color, alpha * 0.4);
    graphics.strokePath();

    // Steampunk Screws
    const drawScrew = (sx, sy) => {
      graphics.fillStyle(0x000000, 0.9 * alpha);
      graphics.fillCircle(sx, sy, 4.5);
      graphics.fillStyle(color, alpha * 0.7);
      graphics.fillCircle(sx, sy, 3);
      graphics.lineStyle(1.5, 0x000000, 0.9 * alpha);
      graphics.lineBetween(sx - 2, sy - 2, sx + 2, sy + 2);
    };

    const hW = width / 2;
    const hH = height / 2;
    const pad = 14;
    drawScrew(-hW + pad, -hH + pad);
    drawScrew(hW - pad, -hH + pad);
    drawScrew(-hW + pad, hH - pad);
    drawScrew(hW - pad, hH - pad);
  }

  _transitionTo(sceneKey, data) {
    this.audioEngine.resume();
    this.audioEngine.playUIClick();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey, data);
    });
  }
}
