export type GameScreen =
  | 'menu'
  | 'options'
  | 'select'
  | 'instructions'
  | 'playing'
  | 'gameover';

export type AbilityId = 'smash' | 'roundhouse' | 'doubleJump' | 'treasure';

export interface AbilityDef {
  id: AbilityId;
  kind: 'active' | 'passive';
  name: string;
  description: string;
  cooldown: number;
}

export interface FigureStyle {
  skin: string;
  hair: string;
  outfit: string;
  outfitDark: string;
  trim: string;
  pants: string;
  build: number;
  headgear: 'none' | 'bandana' | 'goggles' | 'hat';
  hairStyle: 'short' | 'tousled' | 'ponytail' | 'braid';
  outerwear: 'vest' | 'cardigan' | 'jacket';
  accessory: 'none' | 'satchel' | 'holster';
}

export interface CharacterDef {
  id: string;
  name: string;
  role: string;
  color: string;
  accent: string;
  speedMod: number;
  magnetMod: number;
  luckMod: number;
  blurb: string;
  locked: boolean;
  ability: AbilityDef;
  style: FigureStyle;
}

export interface RunResult {
  score: number;
  distance: number;
  rings: number;
  topSpeed: number;
  maxCombo: number;
  characterId: string;
}

export interface HighScoreEntry {
  id: string;
  player_name: string;
  score: number;
  distance: number;
  character_id: string;
  created_at: string;
}

export const LANE_COUNT = 4;

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'bravestone',
    name: 'Smolder Bravestone',
    role: 'Strongman Explorer',
    color: '#f97316',
    accent: '#fdba74',
    speedMod: 1.15,
    magnetMod: 1.0,
    luckMod: 1.0,
    blurb: 'A mountain of muscle who clears the path with raw force.',
    locked: false,
    ability: {
      id: 'smash',
      kind: 'active',
      name: 'Power Smash',
      description: 'Shatters every spiked ball and boulder in your lane ahead.',
      cooldown: 6,
    },
    style: {
      skin: '#b87a4b',
      hair: '#2a1b12',
      outfit: '#c2410c',
      outfitDark: '#7c2d12',
      trim: '#fde68a',
      pants: '#44403c',
      build: 1.2,
      headgear: 'bandana',
      hairStyle: 'short',
      outerwear: 'vest',
      accessory: 'none',
    },
  },
  {
    id: 'finbar',
    name: 'Mouse Finbar',
    role: 'Nimble Sidekick',
    color: '#84cc16',
    accent: '#d9f99d',
    speedMod: 0.92,
    magnetMod: 1.7,
    luckMod: 1.3,
    blurb: 'Small, quick and always one step ahead of the danger.',
    locked: false,
    ability: {
      id: 'doubleJump',
      kind: 'passive',
      name: 'Quick Feet',
      description: 'Double jump: leap a second time while airborne.',
      cooldown: 0,
    },
    style: {
      skin: '#e7b98f',
      hair: '#5b3a1e',
      outfit: '#4d7c0f',
      outfitDark: '#365314',
      trim: '#fef08a',
      pants: '#334155',
      build: 0.86,
      headgear: 'goggles',
      hairStyle: 'tousled',
      outerwear: 'cardigan',
      accessory: 'none',
    },
  },
  {
    id: 'roundhouse',
    name: 'Ruby Roundhouse',
    role: 'Martial Arts Pilot',
    color: '#ec4899',
    accent: '#f472b6',
    speedMod: 1.05,
    magnetMod: 1.2,
    luckMod: 1.1,
    blurb: 'Fast on her feet, lethal with a spinning kick.',
    locked: false,
    ability: {
      id: 'roundhouse',
      kind: 'active',
      name: 'Roundhouse Kick',
      description: 'Brief invincibility while sweeping hazards from nearby lanes.',
      cooldown: 12,
    },
    style: {
      skin: '#f2c6a0',
      hair: '#b5452a',
      outfit: '#be185d',
      outfitDark: '#831843',
      trim: '#fbcfe8',
      pants: '#57534e',
      build: 1.0,
      headgear: 'none',
      hairStyle: 'ponytail',
      outerwear: 'jacket',
      accessory: 'holster',
    },
  },
  {
    id: 'oberon',
    name: 'Shelly Oberon',
    role: 'Jungle Cartographer',
    color: '#14b8a6',
    accent: '#5eead4',
    speedMod: 1.0,
    magnetMod: 1.1,
    luckMod: 1.8,
    blurb: 'Reads the jungle like a map and never misses a treasure.',
    locked: true,
    ability: {
      id: 'treasure',
      kind: 'passive',
      name: 'Treasure Sense',
      description: 'Rings are pulled in from further away and worth 50% more.',
      cooldown: 0,
    },
    style: {
      skin: '#d8a07a',
      hair: '#1f1b16',
      outfit: '#0f766e',
      outfitDark: '#134e4a',
      trim: '#fde68a',
      pants: '#8a6d3b',
      build: 0.92,
      headgear: 'hat',
      hairStyle: 'braid',
      outerwear: 'jacket',
      accessory: 'satchel',
    },
  },
];

export function isCharacterUnlocked(char: CharacterDef, bestScore: number): boolean {
  if (!char.locked) return true;
  return bestScore >= 5000;
}
