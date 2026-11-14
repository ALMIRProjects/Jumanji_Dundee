export type PowerType = 'magnet' | 'shield' | 'multiplier' | 'boost';
export type HazardKind = 'spike' | 'boulder' | 'rhino';
export type EntityKind = 'ring' | 'powerup' | HazardKind;

export const SMASH_DURATION = 0.35;
export const KICK_DURATION = 0.5;

export interface Entity {
  id: number;
  kind: EntityKind;
  lane: number;
  z: number;
  spin: number;
  power?: PowerType;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  size: number;
}

export interface PowerStatus {
  type: PowerType;
  remaining: number;
  total: number;
}

export interface PlayerState {
  lane: number;
  targetLane: number;
  y: number;
  vy: number;
  jumping: boolean;
  jumpsLeft: number;
  runCycle: number;
  tilt: number;
  invuln: number;
  smashTimer: number;
  kickTimer: number;
  stumble: number;
}

export interface GameState {
  running: boolean;
  paused: boolean;
  gameOverFlag: boolean;
  startCountdown: number;
  elapsed: number;
  score: number;
  bonusScore: number;
  rings: number;
  distance: number;
  speed: number;
  topSpeed: number;
  combo: number;
  maxCombo: number;
  comboTimer: number;
  lives: number;
  powers: PowerStatus[];
  player: PlayerState;
  abilityCooldown: number;
  entities: Entity[];
  particles: Particle[];
  floats: FloatingText[];
  screenShake: number;
  hitFlash: number;
  distanceTraveled: number;
  nextSpawnZ: number;
  entityCounter: number;
}

export interface HudSnapshot {
  score: number;
  rings: number;
  distance: number;
  combo: number;
  lives: number;
  powers: PowerStatus[];
  abilityReady: boolean;
  abilityProgress: number;
}

export function createGameState(startSpeed: number, extraJumps: number): GameState {
  return {
    running: false,
    paused: false,
    gameOverFlag: false,
    startCountdown: 3.2,
    elapsed: 0,
    score: 0,
    bonusScore: 0,
    rings: 0,
    distance: 0,
    speed: startSpeed,
    topSpeed: startSpeed,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    lives: 3,
    powers: [],
    player: {
      lane: 1.5,
      targetLane: 1.5,
      y: 0,
      vy: 0,
      jumping: false,
      jumpsLeft: extraJumps,
      runCycle: 0,
      tilt: 0,
      invuln: 0,
      smashTimer: 0,
      kickTimer: 0,
      stumble: 0,
    },
    abilityCooldown: 0,
    entities: [],
    particles: [],
    floats: [],
    screenShake: 0,
    hitFlash: 0,
    distanceTraveled: 0,
    nextSpawnZ: 0.4,
    entityCounter: 0,
  };
}
