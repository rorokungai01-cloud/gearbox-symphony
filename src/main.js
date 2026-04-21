// ============================================
// main.js — Entry point (creates Phaser.Game only)
// ============================================
import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

// ─── Block Phaser from setting hand cursor on interactive objects ───
// Phaser does canvas.style.cursor = 'pointer' on hover — we intercept it
// and replace with our custom SVG cursor instead.
const CURSOR_DEFAULT = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='5' fill='none' stroke='%23ffd700' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='1.5' fill='%23ffd700'/%3E%3Cline x1='16' y1='2' x2='16' y2='10' stroke='%23ffd700' stroke-width='1.5' stroke-linecap='round'/%3E%3Cline x1='16' y1='22' x2='16' y2='30' stroke='%23ffd700' stroke-width='1.5' stroke-linecap='round'/%3E%3Cline x1='2' y1='16' x2='10' y2='16' stroke='%23ffd700' stroke-width='1.5' stroke-linecap='round'/%3E%3Cline x1='22' y1='16' x2='30' y2='16' stroke='%23ffd700' stroke-width='1.5' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='4' r='2' fill='%23cd7f32' opacity='0.9'/%3E%3Ccircle cx='16' cy='28' r='2' fill='%23cd7f32' opacity='0.9'/%3E%3Ccircle cx='4' cy='16' r='2' fill='%23cd7f32' opacity='0.9'/%3E%3Ccircle cx='28' cy='16' r='2' fill='%23cd7f32' opacity='0.9'/%3E%3C/svg%3E\") 16 16, crosshair";
const CURSOR_GRAB  = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='7' fill='none' stroke='%23ff6b35' stroke-width='2.5'/%3E%3Ccircle cx='16' cy='16' r='2.5' fill='%23ff6b35'/%3E%3Cline x1='16' y1='2' x2='16' y2='8' stroke='%23ff6b35' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='16' y1='24' x2='16' y2='30' stroke='%23ff6b35' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='2' y1='16' x2='8' y2='16' stroke='%23ff6b35' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='24' y1='16' x2='30' y2='16' stroke='%23ff6b35' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\") 16 16, grabbing";

function interceptCanvasCursor(canvas) {
  let _cursor = CURSOR_DEFAULT;
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
  // Instead of patching style itself (risky), override via setProperty on the element
  // We'll poll and override whenever Phaser sets it to 'pointer' or 'default'
  const observer = new MutationObserver(() => {
    const cur = canvas.style.cursor;
    const isDragging = canvas.classList.contains('is-dragging');
    const wantedCursor = isDragging ? CURSOR_GRAB : CURSOR_DEFAULT;
    if (cur !== wantedCursor && !cur.startsWith('url')) {
      canvas.style.setProperty('cursor', wantedCursor, 'important');
    }
  });
  observer.observe(canvas, { attributes: true, attributeFilter: ['style'] });
}

// Create the game instance — the only thing this file does!
const game = new Phaser.Game(gameConfig);

// Intercept cursor after game canvas is created
game.events.once('ready', () => {
  const canvas = game.canvas;
  if (canvas) {
    canvas.style.setProperty('cursor', CURSOR_DEFAULT, 'important');
    interceptCanvasCursor(canvas);
  }
  
  // Wavedash SDK Init
  if (window.WavedashJS) {
    console.log("Initializing Wavedash SDK...");
    window.WavedashJS.init();
  }
});

