// ============================================
// DrumPart.js — Drum sound part
// ============================================
import { MachinePart } from './MachinePart.js';
import { PART_TYPES, COLORS } from '../config/constants.js';

export class WrenchPart extends MachinePart {
  constructor(scene, x, y) {
    super(scene, x, y, PART_TYPES.WRENCH, 'icon_bellows', 'Bellows', COLORS.WRENCH_COLOR);
  }
}
