// ============================================
// BackgroundGears.js — Rotating gears decoration
// ============================================
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/constants.js';

export class BackgroundGears {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} worldId
   */
  constructor(scene, worldId = 1) {
    this.scene = scene;
    this.gears = [];

    const videoDataKey = `bg_world${worldId}_video_raw`;
    const imageKey = `bg_world${worldId}`;

    // Try video first (binary blob bypasses IDM)
    if (this.scene.cache.binary.exists(videoDataKey)) {
      const buffer = this.scene.cache.binary.get(videoDataKey);
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      this.bgVideo = this.scene.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2)
        .loadURL(url)
        .setOrigin(0.5)
        .setScale(GAME_WIDTH / 1920) // Manually scale 1920x1080 video to 1280x720
        .setDepth(-1)
        .setAlpha(0.3)
        .setLoop(true)
        .setMute(true);
      
      this.bgVideo.play();

      // Revoke the object URL to free memory once the video object is destroyed
      this.bgVideo.on('destroy', () => {
        URL.revokeObjectURL(url);
      });
    } else if (this.scene.textures.exists(imageKey)) {
      // Fallback to image
      this.bgImage = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, imageKey)
        .setOrigin(0.5)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(-1)
        .setAlpha(0.25);
    }

    this._createGears();
  }

  _createGears() {
    // Create several decorative gears at various positions
    const gearConfigs = [
      { x: 75,                y: 120,                radius: 90,  teeth: 12, speed: 0.2,  alpha: 0.06 },
      { x: GAME_WIDTH - 120,  y: GAME_HEIGHT - 150, radius: 120, teeth: 16, speed: -0.15, alpha: 0.05 },
      { x: GAME_WIDTH - 60,   y: 90,                radius: 60,  teeth: 8,  speed: 0.3,  alpha: 0.04 },
      { x: 120,               y: GAME_HEIGHT - 90,  radius: 75,  teeth: 10, speed: -0.25, alpha: 0.05 },
      { x: GAME_WIDTH / 2,    y: GAME_HEIGHT - 45,  radius: 150, teeth: 20, speed: 0.1,  alpha: 0.03 },
    ];

    gearConfigs.forEach(cfg => {
      const gear = this._drawGear(cfg);
      this.gears.push({ graphic: gear, speed: cfg.speed });
    });
  }

  _drawGear(cfg) {
    const g = this.scene.add.graphics();
    g.setAlpha(cfg.alpha);
    g.setPosition(cfg.x, cfg.y);

    g.lineStyle(2, COLORS.BRONZE);

    // Draw gear shape
    const { radius, teeth } = cfg;
    const innerRadius = radius * 0.75;
    const toothHeight = radius * 0.25;

    g.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * Math.PI * 2;
      const r = (i % 2 === 0) ? radius : innerRadius;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.strokePath();

    // Center circle
    g.strokeCircle(0, 0, radius * 0.3);
    g.strokeCircle(0, 0, radius * 0.1);

    return g;
  }

  update(time) {
    const t = time * 0.001; // Convert to seconds
    this.gears.forEach(gear => {
      gear.graphic.setRotation(t * gear.speed);
    });
  }
}
