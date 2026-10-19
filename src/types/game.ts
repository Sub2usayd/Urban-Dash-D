export type CharacterId =
  | 'malik'
  | 'maya'
  | 'mateo'
  | 'amina'
  | 'ren'
  | 'elena'
  | 'tariq'
  | 'jax'
  | 'zoe'
  | 'nova';

export type BiomeId =
  | 'city'
  | 'desert'
  | 'forest'
  | 'mountain'
  | 'snow'
  | 'storm'
  | 'cyber';

export type PowerUpType = 'magnet' | 'sneakers' | 'multiplier' | 'shield';

export interface CharacterData {
  id: CharacterId;
  name: string;
  codename: string;
  title: string;
  archetype: string;
  gender: 'male' | 'female' | 'non-binary' | 'synthetic';
  ethnicityOrOrigin: string;
  visualStyle: {
    hairStyle: string;
    upperWear: string;
    lowerWear: string;
    footwear: string;
    accessories: string[];
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    skinTone: string;
  };
  animationSignature: string;
  unlockType: 'starter' | 'coins' | 'distance';
  unlockThreshold: number; // 0 for starter, coins amount or meters
  perkDescription: string;
  triBudget: number; // e.g. 1400 - 1800 tris
  lore: string;
}

export interface BiomeObstacle {
  id: string;
  name: string;
  type: 'hurdle' | 'overhead' | 'fullLane' | 'dynamic';
  actionRequired: 'jump' | 'slide' | 'laneSwitch';
  description: string;
  polyCount: number;
}

export interface BiomeData {
  id: BiomeId;
  name: string;
  tagline: string;
  description: string;
  visualAtmosphere: {
    timeOfDay: string;
    skyColor: string;
    fogColor: string;
    fogDensity: number;
    groundColor: string;
    accentGlow: string;
    weatherEffect?: 'none' | 'rain' | 'snow' | 'dust' | 'heatHaze' | 'cyberGlow';
  };
  keyProps: string[];
  obstacles: BiomeObstacle[];
  audioTheme: {
    genre: string;
    tempoBpm: number;
    instruments: string;
    ambienceNotes: string;
  };
}

export interface PlayerInputState {
  lane: -1 | 0 | 1;
  isJumping: boolean;
  isSliding: boolean;
}

export interface ActivePowerUps {
  magnet: number; // time remaining in seconds
  sneakers: number;
  multiplier: number;
  shield: boolean;
}

export interface GameMetrics {
  distance: number; // meters
  coins: number;
  score: number;
  speed: number; // m/s
  chaseDistance: number; // 0 (caught) to 100 (safe lead)
  multiplier: number;
  biome: BiomeId;
  characterId: CharacterId;
  stumbledCount: number;
  isGameOver: boolean;
  isPaused: boolean;
  causeOfDeath?: string;
}
