/**
 * Pure mathematical functions governing game difficulty, speed scaling,
 * obstacle density, and the dynamic police + K9 chase system.
 */

export interface DifficultyConfig {
  baseSpeed: number; // m/s
  maxSpeed: number; // m/s
  speedRampHalfDistance: number; // meters to reach ~63% of speed boost
  minSpawnSpacing: number; // minimum meters between obstacles
  maxSpawnSpacing: number; // starting meters between obstacles
  minReactionWindowSeconds: number; // guarantees human-playable reaction time
  chaseRecoveryRatePerSec: number; // units recovered per second of clean running
  stumblePenalty: number; // immediate distance lost on hurdle bump
  criticalThreatThreshold: number; // threshold for siren vignette
}

export const DEFAULT_DIFFICULTY_CONFIG: DifficultyConfig = {
  baseSpeed: 12.0,
  maxSpeed: 26.0,
  speedRampHalfDistance: 1500,
  minSpawnSpacing: 10.0,
  maxSpawnSpacing: 24.0,
  minReactionWindowSeconds: 0.38,
  chaseRecoveryRatePerSec: 4.0,
  stumblePenalty: 35.0,
  criticalThreatThreshold: 35.0,
};

/**
 * Calculates player speed as an asymptotic curve:
 * v(d) = v_base + (v_max - v_base) * (1 - exp(-d / k))
 */
export function calculateSpeed(
  distanceMeters: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY_CONFIG
): number {
  if (distanceMeters <= 0) return config.baseSpeed;
  const progress = 1 - Math.exp(-distanceMeters / config.speedRampHalfDistance);
  const speed = config.baseSpeed + (config.maxSpeed - config.baseSpeed) * progress;
  return Math.min(speed, config.maxSpeed);
}

/**
 * Calculates obstacle spawn spacing based on distance.
 * Spacing shrinks as distance increases, but is clamped by minReactionWindow.
 */
export function calculateObstacleSpacing(
  distanceMeters: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY_CONFIG
): number {
  const currentSpeed = calculateSpeed(distanceMeters, config);
  const minSafeDistance = currentSpeed * config.minReactionWindowSeconds;

  const t = Math.min(distanceMeters / 3000, 1.0);
  const rawSpacing = config.maxSpawnSpacing - (config.maxSpawnSpacing - config.minSpawnSpacing) * t;

  return Math.max(rawSpacing, minSafeDistance);
}

/**
 * Calculates human reaction window in milliseconds for an obstacle ahead.
 */
export function calculateReactionTimeMs(
  distanceToObstacleMeters: number,
  currentSpeed: number
): number {
  if (currentSpeed <= 0) return 9999;
  return (distanceToObstacleMeters / currentSpeed) * 1000;
}

/**
 * Updates police + K9 chase distance lead [0 to 100].
 * - When running cleanly without stumbles, the player gains distance lead.
 * - When stumbling or hitting a hurdle edge, player loses distance.
 * - If distance drops to 0, player is apprehended.
 */
export function updateChaseDistance(
  currentChaseDist: number,
  deltaSec: number,
  stumbledThisFrame: boolean,
  config: DifficultyConfig = DEFAULT_DIFFICULTY_CONFIG
): { newDistance: number; isApprehended: boolean; threatLevel: 'safe' | 'alert' | 'critical' } {
  let updated = currentChaseDist;

  if (stumbledThisFrame) {
    updated -= config.stumblePenalty;
  } else {
    updated += config.chaseRecoveryRatePerSec * deltaSec;
  }

  // Clamp within bounds [0, 100]
  updated = Math.max(0, Math.min(100, updated));

  const isApprehended = updated <= 0;
  let threatLevel: 'safe' | 'alert' | 'critical' = 'safe';
  if (updated < config.criticalThreatThreshold) {
    threatLevel = 'critical';
  } else if (updated < 70) {
    threatLevel = 'alert';
  }

  return {
    newDistance: updated,
    isApprehended,
    threatLevel,
  };
}

/**
 * Calculates final score given distance, coins, and active multiplier.
 */
export function calculateScore(distance: number, coins: number, multiplier: number = 1): number {
  const distanceScore = Math.floor(distance) * 2;
  const coinScore = coins * 15;
  return Math.floor((distanceScore + coinScore) * Math.max(1, multiplier));
}

/**
 * Checks AABB collision between player bounding box and obstacle bounding box.
 */
export interface BoundingBox3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export function checkAABBCollision(a: BoundingBox3D, b: BoundingBox3D): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY &&
    a.minZ <= b.maxZ &&
    a.maxZ >= b.minZ
  );
}
