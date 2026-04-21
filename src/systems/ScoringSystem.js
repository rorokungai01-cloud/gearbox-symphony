// ============================================
// ScoringSystem.js — Pattern comparison & rating
// ============================================
import { STAR_THRESHOLDS } from '../config/constants.js';

export class ScoringSystem {
  /**
   * @param {object} levelData — { targetPattern, cols, rows }
   */
  constructor(levelData) {
    this.target = levelData.targetPattern;
    this.cols = levelData.cols;
    this.rows = levelData.rows;
  }

  /**
   * Compare player grid against target pattern
   * @param {(string|null)[][]} playerGrid — 2D array [row][col]
   * @returns {{ matchRatio: number, stars: number }}
   */
  evaluate(playerGrid) {
    let requiredParts = 0;
    let correctParts = 0;
    let placedParts = 0;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const targetPart = this.target[row]?.[col] || null;
        const playerPart = playerGrid[row]?.[col] || null;

        if (targetPart !== null) requiredParts++;
        if (playerPart !== null) placedParts++;
        
        if (targetPart !== null && targetPart === playerPart) {
          correctParts++;
        }
      }
    }

    // Penalize placing wrong parts (wrongPlacements)
    const wrongPlacements = placedParts - correctParts;
    // Base the percentage off required parts, expanding the denominator if they placed excess wrong parts.
    const denominator = Math.max(requiredParts, requiredParts + wrongPlacements * 0.5); 
    
    const matchRatio = requiredParts > 0 ? correctParts / denominator : 0;
    const stars = this._calculateStars(matchRatio);

    return { matchRatio, stars };
  }

  /**
   * Calculate star rating from match ratio
   */
  _calculateStars(ratio) {
    if (ratio >= STAR_THRESHOLDS.three) return 3;
    if (ratio >= STAR_THRESHOLDS.two) return 2;
    if (ratio >= STAR_THRESHOLDS.one) return 1;
    return 0;
  }
}
