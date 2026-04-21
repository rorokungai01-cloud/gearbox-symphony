// ============================================
// BootScene.js — Loading screen + asset preload
// ============================================
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SCENES, FONT_FAMILY_UI } from '../config/constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload() {
    this._createLoadingBar();

    // Load menu background video RAW to bypass IDM
    this.load.binary('bg_menu_video_raw', 'video/bg_menu.dat');

    // Load world background videos RAW
    this.load.binary('bg_world1_video_raw', 'video/bg_world1.dat');
    this.load.binary('bg_world2_video_raw', 'video/bg_world2.dat');
    this.load.binary('bg_world3_video_raw', 'video/bg_world3.dat');

    // Load world background images (fallback if video fails)
    this.load.image('bg_menu', 'images/backgrounds/bg_menu.jpg');
    this.load.image('bg_world1', 'images/backgrounds/bg_world1.jpg');
    this.load.image('bg_world2', 'images/backgrounds/bg_world2.jpg');
    this.load.image('bg_world3', 'images/backgrounds/bg_world3.jpg');

    // UI and Logos
    this.load.image('logo', 'images/ui/logo.png');

    // Load Part UI Icons
    this.load.image('icon_hammer', 'images/ui/icon_hammer.png');
    this.load.image('icon_bellows', 'images/ui/icon_bellows.png');
    this.load.image('icon_spring', 'images/ui/icon_spring.png');
    this.load.image('icon_tuningfork', 'images/ui/icon_tuningfork.png');
    this.load.image('icon_gear', 'images/ui/icon_gear.png');
    this.load.image('icon_erase', 'images/ui/icon_erase.png');

    // UI Buttons
    this.load.image('btn_main', 'images/ui/btn_main.png');
    this.load.image('btn_test', 'images/ui/btn_test.png');
    this.load.image('btn_undo', 'images/ui/btn_undo.png');
    this.load.image('btn_clear', 'images/ui/btn_clear.png');

    // Load BGM audio as raw binary to completely bypass IDM interception
    this.load.binary('bgm_menu_raw', 'audio/bgm_menu.dat');
    this.load.binary('bgm_world1_raw', 'audio/bg_world1.dat');
    this.load.binary('bgm_world2_raw', 'audio/bg_world2.dat');
    this.load.binary('bgm_world3_raw', 'audio/bg_world3.dat');

    // Load Google Fonts via WebFontLoader pattern
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
  }

  create() {
    this._generateTextures();

    // Enable high-quality texture filtering (Mipmapping) for downscaled icons
    const uiKeys = ['btn_main', 'btn_test', 'btn_clear', 'btn_undo'];
    const iconKeys = ['icon_hammer', 'icon_bellows', 'icon_spring', 'icon_tuningfork', 'icon_gear'];
    iconKeys.forEach(key => {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.TRILINEAR);
      }
    });

    // Wait for web fonts to load, then go straight to menu
    if (typeof WebFont !== 'undefined') {
      WebFont.load({
        google: { families: ['Outfit:400,600,700,800', 'Press+Start+2P'] },
        active: () => this._startMenu(),
        inactive: () => this._startMenu(), // Start anyway if fonts fail
      });
    } else {
      this._startMenu();
    }
  }

  _generateTextures() {
    const g = this.add.graphics();
    
    // Soft glowing circle for steam/glow
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 16, 16);
    g.generateTexture('particle_glow', 32, 32);
    g.clear();
    
    // Tiny square for mechanical sparks
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('particle_spark', 4, 4);
    
    g.destroy();
  }

  _createLoadingBar() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Title text
    this.add.text(cx, cy - 60, '⚙️ GEARBOX SYMPHONY ⚙️', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffd700',
    }).setOrigin(0.5);

    // Loading text
    const loadText = this.add.text(cx, cy + 10, 'Loading...', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#e8e8e8',
    }).setOrigin(0.5);

    // Progress bar background
    const barBg = this.add.rectangle(cx, cy + 50, 300, 20, 0x2c2c3e).setOrigin(0.5);
    barBg.setStrokeStyle(2, COLORS.BRONZE);

    // Progress bar fill
    const barFill = this.add.rectangle(cx - 148, cy + 50, 0, 16, COLORS.GOLD).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      barFill.width = 296 * value;
      loadText.setText(`Loading... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadText.setText('Ready!');
    });
  }

  _startMenu() {
    this.scene.start(SCENES.MENU);
  }
}
