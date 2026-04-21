// ============================================
// ChimePart.js — Chime sound part
// ============================================
import { MachinePart } from './MachinePart.js';
import { PART_TYPES, COLORS } from '../config/constants.js';

export class TuningForkPart extends MachinePart {
  constructor(scene, x, y) {
    super(scene, x, y, PART_TYPES.TUNINGFORK, 'icon_tuningfork', 'Tuning Fork', COLORS.TUNINGFORK_COLOR);
  }
}
