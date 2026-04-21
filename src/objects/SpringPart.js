// ============================================
// PistonPart.js — Piston sound part
// ============================================
import { MachinePart } from './MachinePart.js';
import { PART_TYPES, COLORS } from '../config/constants.js';

export class SpringPart extends MachinePart {
  constructor(scene, x, y) {
    super(scene, x, y, PART_TYPES.SPRING, 'icon_spring', 'Spring', COLORS.SPRING_COLOR);
  }
}
