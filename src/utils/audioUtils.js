// ============================================
// audioUtils.js — Note frequencies & helpers
// ============================================

// Standard note frequencies (Hz) — octave 4
export const NOTE_FREQUENCIES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
};

// Map grid row index to a note (row 0 = highest pitch)
const ROW_NOTES = ['B4', 'A4', 'G4', 'E4', 'C4'];

/**
 * Get the frequency for a given grid row
 * @param {number} row — Row index (0 = top = highest)
 * @returns {number} Frequency in Hz
 */
export function getFrequencyForRow(row) {
  const note = ROW_NOTES[row] || 'C4';
  return NOTE_FREQUENCIES[note];
}

/**
 * Convert BPM to milliseconds per beat
 * @param {number} bpm
 * @returns {number} ms per beat
 */
export function bpmToMs(bpm) {
  return (60 / bpm) * 1000;
}
