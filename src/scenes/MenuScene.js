// ============================================
// MenuScene.js — Main menu screen (Premium)
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SCENES, FONT_FAMILY_UI } from '../config/constants.js';
import { BackgroundGears } from '../effects/BackgroundGears.js';
import { SteamEffect } from '../effects/SteamEffect.js';
import { AudioEngine } from '../systems/AudioEngine.js';
import { loadProgress } from '../utils/storageUtils.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
  }

  create() {
    this.bgmPlaying = false; // Reset play state when returning from other scenes

    // Solid dark base
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a14)
      .setOrigin(0).setDepth(-2);

    // Menu background: try video first, fall back to image
    if (this.cache.binary.exists('bg_menu_video_raw')) {
      const buffer = this.cache.binary.get('bg_menu_video_raw');
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      this.bgVideo = this.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2)
        .loadURL(url)
        .setOrigin(0.5)
        .setScale(GAME_WIDTH / 1920) // Manually scale 1920x1080 video to 1280x720
        .setDepth(-1)
        .setAlpha(0.4)
        .setLoop(true)
        .setMute(true);
      
      this.bgVideo.play();
    } else if (this.textures.exists('bg_menu')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_menu')
        .setOrigin(0.5)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(-1)
        .setAlpha(0.35);
    }

    // Animated gears overlay (very subtle)
    this.bgGears = new BackgroundGears(this, 0); // worldId 0 = no bg image
    this.steam = new SteamEffect(this);

    // Fade in
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Audio
    this.audioEngine = new AudioEngine();

    // Play BGM from file if loaded, otherwise use procedural
    this.audioEngine.playWorldBGM(this, 'menu', 0.75);

    // ─── Vignette overlay (dark edges) ───
    this._createVignette();

    // ─── Title with glow ───
    this._createTitle();

    // ─── Menu buttons ───
    this._createButtons();


    // ─── Floating particles ───
    this._createFloatingParticles();
  }

  update(time) {
    if (this.bgGears) this.bgGears.update(time);
  }

  _createVignette() {
    // Dark gradient edges for cinematic feel
    const g = this.add.graphics().setDepth(50);
    // Top edge
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    g.fillRect(0, 0, GAME_WIDTH, 120);
    // Bottom edge
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.8, 0.8);
    g.fillRect(0, GAME_HEIGHT - 120, GAME_WIDTH, 120);
  }

  _createTitle() {
    const cx = GAME_WIDTH / 2;
    const cy = 290; // Moved down further

    // Drop shadow
    const dropShadow = this.add.image(cx, cy + 6, 'logo')
      .setTint(0x000000)
      .setAlpha(0.1)
      .setOrigin(0.5)
      .setDepth(0);

    // Wide diffuse neon bloom
    const glowTitle = this.add.image(cx, cy, 'logo')
      .setTint(0xffaa00)
      .setAlpha(0.2)
      .setOrigin(0.5)
      .setDepth(1);

    // Hot neon core (additive blend)
    const coreGlow = this.add.image(cx, cy, 'logo')
      .setTint(0xffffff)
      .setAlpha(0.1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setOrigin(0.5)
      .setDepth(2);

    // Main crisp image on top
    const title = this.add.image(cx, cy, 'logo')
      .setOrigin(0.5)
      .setAlpha(0.4)
      .setDepth(3);

    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, 430, 'S Y M P H O N Y', {
      fontSize: '42px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: '600',
      color: '#cd7f32',
      letterSpacing: 12,
    }).setOrigin(0.5).setDepth(2)
      .setShadow(0, 3, '#000000', 9);

    // Decorative line
    const lineW = 390;
    const lineY = 460;
    const lineG = this.add.graphics().setDepth(2);
    lineG.lineStyle(1.5, 0xcd7f32, 0.5);
    lineG.lineBetween(GAME_WIDTH / 2 - lineW / 2, lineY, GAME_WIDTH / 2 + lineW / 2, lineY);
    // Small diamond in the center
    lineG.fillStyle(0xcd7f32, 0.6);
    lineG.fillRect(cx - 4.5, lineY - 4.5, 9, 9);

    // Tagline
    const tagline = this.add.text(GAME_WIDTH / 2, 480, 'Build machines that make music', {
      fontSize: '21px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: 'italic',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(2);

    // Gentle float animation on title
    this.tweens.add({
      targets: [title, glowTitle, coreGlow, dropShadow], // Bind only logo layers together
      y: '+=15', // Increased movement range
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Primary aura pulse
    this.tweens.add({
      targets: glowTitle,
      alpha: 0.25, // Reduce max alpha to keep it semi-transparent
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Core neon fast flicker
    this.tweens.add({
      targets: coreGlow,
      alpha: 0.15, // Keep max glow low
      duration: 1100, // Faster, desynced
      yoyo: true,
      repeat: -1,
      ease: 'Bounce.easeOut', // slightly glitchy/erratic neon tube feel
    });
  }

  _createButtons() {
    const save = loadProgress();
    const isFreePlayUnlocked = (save.unlockedLevel || 1) >= 11;

    const btnConfigs = [
      { y: 615, text: 'ADVENTURE', subtext: null, icon: '', action: () => this._transitionTo(SCENES.LEVEL_SELECT), color: 0xcd7f32 }, // Bronze
      { 
        y: 712, 
        text: isFreePlayUnlocked ? 'FREE PLAY' : 'FREE PLAY [LOCKED]', 
        subtext: isFreePlayUnlocked ? null : '(Clear Floor 2 to unlock)',
        icon: '', 
        action: isFreePlayUnlocked ? () => this._showFreePlayConfig() : () => { 
            this.cameras.main.shake(200, 0.005); 
            if (this.audioEngine && this.audioEngine.playError) this.audioEngine.playError();
            else if (this.audioEngine && this.audioEngine.playUIClick) this.audioEngine.playUIClick();
        }, 
        color: isFreePlayUnlocked ? 0x00e5ff : 0x555566 // Cyan or Gray
      },
    ];

    btnConfigs.forEach((config, i) => {
      this._createButton(GAME_WIDTH / 2, config.y, config.text, config.color, config.action, i, config.subtext);
    });
  }

  _showFreePlayConfig() {
    this.audioEngine.playUIClick();
    import('../ui/FreePlayConfigOverlay.js').then(({ FreePlayConfigOverlay }) => {
      new FreePlayConfigOverlay(this, 
        (config) => {
          this._transitionTo(SCENES.FREE_PLAY, { config });
        },
        () => {
          // just close
        }
      );
    });
  }

  _createButton(x, y, text, color, callback, index, subtext = null) {
    const btnWidth = 450;
    const btnHeight = 72;

    // A subtle ambient glow
    const glow = this.add.rectangle(x, y, btnWidth + 18, btnHeight + 18, color, 0.08)
      .setDepth(9);

    // Transparent interactive hit area (background rendering moved to borderG)
    const bg = this.add.rectangle(x, y, btnWidth, btnHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

      // Custom Graphics Border System
    const borderG = this.add.graphics({ x, y }).setDepth(10);
    
    const drawBorder = (isHover) => {
      borderG.clear();
      const alpha = isHover ? 1 : 0.6;
      const thickness = isHover ? 3 : 2;
      
      const hW = btnWidth / 2;
      const hH = btnHeight / 2;
      const cut = 14; // Angled corner size

      // Outline Beveled Frame Path
      borderG.beginPath();
      borderG.moveTo(-hW + cut, -hH);
      borderG.lineTo(hW - cut, -hH);
      borderG.lineTo(hW, -hH + cut);
      borderG.lineTo(hW, hH - cut);
      borderG.lineTo(hW - cut, hH);
      borderG.lineTo(-hW + cut, hH);
      borderG.lineTo(-hW, hH - cut);
      borderG.lineTo(-hW, -hH + cut);
      borderG.closePath();

      // Background Fill (Solid dark rusty/iron feel)
      borderG.fillStyle(isHover ? color : 0x111111, isHover ? 0.2 : 0.75);
      borderG.fillPath();

      // Outer Thick Metallic Border
      borderG.lineStyle(thickness + 1.5, 0x000000, 0.8);
      borderG.strokePath();
      borderG.lineStyle(thickness, color, alpha);
      borderG.strokePath();

      // Inner Plate Seam (Bevel illusion)
      const gap = 8;
      borderG.lineStyle(2, 0x000000, 0.9);
      borderG.strokeRect(-hW + gap, -hH + gap, btnWidth - gap * 2, btnHeight - gap * 2);
      borderG.lineStyle(1.5, color, isHover ? 0.8 : 0.25);
      borderG.strokeRect(-hW + gap + 1, -hH + gap + 1, btnWidth - gap * 2 - 2, btnHeight - gap * 2 - 2);

      // Steampunk Screws in 4 Corners
      const drawScrew = (sx, sy) => {
        borderG.fillStyle(0x000000, 0.9);
        borderG.fillCircle(sx, sy, 5.5); // Base hole
        borderG.fillStyle(color, isHover ? 0.9 : 0.35);
        borderG.fillCircle(sx, sy, 4); // Screw head
        borderG.lineStyle(1.5, 0x000000, 0.9);
        borderG.lineBetween(sx - 2.5, sy - 2.5, sx + 2.5, sy + 2.5); // Screw slot cut
      };

      const pad = 18;
      drawScrew(-hW + pad, -hH + pad);
      drawScrew(hW - pad, -hH + pad);
      drawScrew(-hW + pad, hH - pad);
      drawScrew(hW - pad, hH - pad);

      // Side Piping Details
      const pipeW = 50;
      borderG.lineStyle(2, color, isHover ? 0.6 : 0.15);
      borderG.lineBetween(-hW + 35, 0, -hW + 35 + pipeW, 0);
      borderG.lineBetween(hW - 35, 0, hW - 35 - pipeW, 0);
    };

    drawBorder(false);

    // Text Label
    const label = this.add.text(x, y, text, {
      fontSize: '26px',
      fontFamily: FONT_FAMILY_UI,
      fontStyle: '800',
      color: '#ffffff',
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(11)
      .setShadow(0, 3, '#000000', 4, true, true); // Permanent hard drop shadow for 3D engraved look
    
    label.setAlpha(0.85);

    let subLabel = null;
    if (subtext) {
      label.setY(y - 12);
      subLabel = this.add.text(x, y + 16, subtext, {
        fontSize: '15px',
        fontFamily: FONT_FAMILY_UI,
        fontStyle: 'bold',
        color: '#aaaaaa',
        letterSpacing: 1,
      }).setOrigin(0.5).setDepth(11);
      subLabel.setAlpha(0.85);
    }

    // Initial Fade In
    bg.setAlpha(0);
    label.setAlpha(0);
    if (subLabel) subLabel.setAlpha(0);
    glow.setAlpha(0);
    borderG.setAlpha(0);
    
    // Fade in each element to its correct default opacity
    const delay = 600 + index * 150;
    this.tweens.add({ targets: [bg, borderG], alpha: 1, duration: 400, delay, ease: 'Power2' });
    this.tweens.add({ targets: label, alpha: 0.85, duration: 400, delay, ease: 'Power2' });
    if (subLabel) this.tweens.add({ targets: subLabel, alpha: 0.85, duration: 400, delay, ease: 'Power2' });
    this.tweens.add({ targets: glow, alpha: 0.08, duration: 400, delay, ease: 'Power2' });

    // Hover State
    bg.on('pointerover', () => {
      glow.setAlpha(0.25);
      label.setAlpha(1);
      label.setShadow(0, 0, '#ffffff', 8, false, true); // Glow on hover
      drawBorder(true);
      if (this.audioEngine) this.audioEngine.playUIHover();
    });

    bg.on('pointerout', () => {
      glow.setAlpha(0.08);
      label.setAlpha(0.85);
      label.setShadow(0, 3, '#000000', 4, true, true); // Revert to engraved shadow
      drawBorder(false);
    });

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: subLabel ? [bg, label, subLabel, glow, borderG] : [bg, label, glow, borderG],
        scaleX: 0.96, scaleY: 0.92,
        duration: 80,
        yoyo: true,
        onComplete: callback,
      });
    });

    return { bg, label };
  }

  _createFloatingParticles() {
    // Gentle golden dust particles floating up
    if (!this.textures.exists('particle_glow')) return;

    const particles = this.add.particles(0, 0, 'particle_glow', {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: GAME_HEIGHT + 10, max: GAME_HEIGHT + 30 },
      lifespan: 6000,
      speedY: { min: -15, max: -30 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.08, end: 0 },
      alpha: { start: 0.3, end: 0 },
      tint: 0xffd700,
      frequency: 300,
      quantity: 1,
    }).setDepth(3);
  }

  _transitionTo(sceneKey) {
    this.audioEngine.resume();
    this.audioEngine.playUIClick();

    // Stop BGM with fade
    if (this.customBgmGain) {
      // Fade out manually since we bypassed Phaser SoundManager
      this.customBgmGain.gain.linearRampToValueAtTime(0, this.sound.context.currentTime + 0.3);
      setTimeout(() => {
        if (this.customBgmSource) {
          try { this.customBgmSource.stop(); } catch (e) {}
        }
      }, 300);
    }

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (arguments.length > 1) {
        this.scene.start(sceneKey, arguments[1]);
      } else {
        this.scene.start(sceneKey);
      }
    });
  }
}
