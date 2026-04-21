// ============================================
// GearPart.js — Gear sound part
// ============================================
import { MachinePart } from './MachinePart.js';
import { PART_TYPES, COLORS } from '../config/constants.js';

export class GearPart extends MachinePart {
  constructor(scene, x, y) {
    super(scene, x, y, PART_TYPES.GEAR, 'icon_gear', 'Gear', COLORS.GEAR_COLOR);
  }
}
