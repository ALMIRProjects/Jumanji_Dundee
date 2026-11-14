import { LANE_COUNT } from './types';

export const HORIZON_FRAC = 0.38;
export const GROUND_FRAC = 0.92;
export const PLAYER_Z = 0.04;
const LANE_SPACING = 0.2;

export interface Projection {
  x: number;
  y: number;
  s: number;
}

export function projectPoint(w: number, h: number, lane: number, z: number, yOff = 0): Projection {
  const s = 1 / (1 + z * 14);
  const horizonY = h * HORIZON_FRAC;
  const groundY = h * GROUND_FRAC;
  const y = horizonY + (groundY - horizonY) * s - yOff * h * s;
  const x = w / 2 + (lane - (LANE_COUNT - 1) / 2) * w * LANE_SPACING * s;
  return { x, y, s };
}

export function figureUnit(w: number, h: number, s: number): number {
  return Math.min(h * 0.034, w * 0.05) * s;
}
