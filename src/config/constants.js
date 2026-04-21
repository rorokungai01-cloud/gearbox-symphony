// ============================================
// constants.js — Game-wide constant values
// ============================================
// ⚠️ This file is PURE DATA — no imports allowed!

// --- Display ---
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// --- Grid ---
export const GRID_MAX_COLS = 8;
export const GRID_MAX_ROWS = 5;
export const CELL_SIZE = 108;
export const GRID_PADDING = 12;
export const GRID_OFFSET_X = 150;
export const GRID_OFFSET_Y = 210;

// --- Playhead ---
export const DEFAULT_BPM = 110;
export const MIN_BPM = 60;
export const MAX_BPM = 200;

// --- Scoring ---
export const STAR_THRESHOLDS = {
  three: 1.0,   // 100% match
  two: 0.7,     // 70%+ match (allows 3/4 to be 2 stars)
  one: 0.35,    // 35%+ match
};

// --- Part Types (IDs matching the asset keys)
export const PART_TYPES = {
  HAMMER: 'hammer',
  WRENCH: 'wrench',
  SPRING: 'spring',
  TUNINGFORK: 'tuningfork',
  GEAR: 'gear',
};

// UI Colors for different elements
export const COLORS = {
  BG: 0x1a1a24,
  BG_DEEP: 0x111118,
  GRID_LINE: 0x2b2b36,
  GRID_BG: 0x22222c,
  TEXT_LIGHT: '#e0e0e0',
  TEXT_DIM: '#888899',
  
  BRONZE: 0xcd7f32,
  COPPER: 0xb87333,
  GOLD: 0xffd700,
  WHITE: 0xffffff,
  BLACK: 0x000000,
  NEON_GREEN: 0x00ff88,
  WARM_ORANGE: 0xff6b35,

  // Part Specific Base Colors (used for UI borders/glows)
  HAMMER_COLOR: 0xffaa00,   // Orange/Gold
  WRENCH_COLOR: 0xaa5555,   // Dark Red (Heavy)
  SPRING_COLOR: 0x44aa44,   // Green
  TUNINGFORK_COLOR: 0x55aaff, // Light Blue (Clear)
  GEAR_COLOR: 0xaaaaaa,     // Silver/Grey
  RED: 0xff4444,
};

// --- Fonts ---
export const FONT_FAMILY = '"Press Start 2P", monospace';
export const FONT_FAMILY_UI = '"Outfit", sans-serif';

// --- Scene Keys ---
export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  LEVEL_SELECT: 'LevelSelectScene',
  GAME: 'GameScene',
  FREE_PLAY: 'FreePlayScene',
};

// --- Events (Phaser event names) ---
export const EVENTS = {
  BEAT: 'beat',
  PART_PLACED: 'part-placed',
  PART_REMOVED: 'part-removed',
  PLAYBACK_START: 'playback-start',
  PLAYBACK_STOP: 'playback-stop',
  SCORE_UPDATED: 'score-updated',
  LEVEL_COMPLETE: 'level-complete',
};
