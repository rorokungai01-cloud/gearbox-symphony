// ============================================
// colorUtils.js — Color conversion helpers
// ============================================

/**
 * Convert hex int (0xRRGGBB) to CSS hex string (#RRGGBB)
 */
export function hexIntToString(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

/**
 * Lighten a hex color by a percentage (0-1)
 */
export function lightenColor(hex, amount) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;

  const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
  const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
  const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

  return (newR << 16) | (newG << 8) | newB;
}

/**
 * Darken a hex color by a percentage (0-1)
 */
export function darkenColor(hex, amount) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;

  const newR = Math.floor(r * (1 - amount));
  const newG = Math.floor(g * (1 - amount));
  const newB = Math.floor(b * (1 - amount));

  return (newR << 16) | (newG << 8) | newB;
}
