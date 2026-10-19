import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSpeed,
  calculateObstacleSpacing,
  calculateReactionTimeMs,
  updateChaseDistance,
  calculateScore,
  checkAABBCollision,
  DEFAULT_DIFFICULTY_CONFIG,
} from './difficulty.ts';

test('calculateSpeed returns base speed at distance 0', () => {
  const speed = calculateSpeed(0);
  assert.equal(speed, DEFAULT_DIFFICULTY_CONFIG.baseSpeed);
});

test('calculateSpeed ramps up monotonically with distance and never exceeds maxSpeed', () => {
  const s0 = calculateSpeed(0);
  const s500 = calculateSpeed(500);
  const s1500 = calculateSpeed(1500);
  const s5000 = calculateSpeed(5000);
  const s100000 = calculateSpeed(100000);

  assert.ok(s500 > s0, 'Speed at 500m should exceed 0m');
  assert.ok(s1500 > s500, 'Speed at 1500m should exceed 500m');
  assert.ok(s5000 > s1500, 'Speed at 5000m should exceed 1500m');
  assert.ok(s100000 <= DEFAULT_DIFFICULTY_CONFIG.maxSpeed, 'Speed must not exceed maxSpeed');
  assert.equal(Math.round(s100000), DEFAULT_DIFFICULTY_CONFIG.maxSpeed);
});

test('calculateObstacleSpacing respects min reaction window', () => {
  const spacingAtStart = calculateObstacleSpacing(0);
  const spacingAtFar = calculateObstacleSpacing(5000);
  assert.ok(spacingAtStart >= spacingAtFar, 'Spacing should decrease as distance increases');

  const speedAtFar = calculateSpeed(5000);
  const reactionTimeAtFarMs = calculateReactionTimeMs(spacingAtFar, speedAtFar);
  assert.ok(
    reactionTimeAtFarMs >= DEFAULT_DIFFICULTY_CONFIG.minReactionWindowSeconds * 1000 - 1,
    'Obstacle spacing must allow at least min reaction window'
  );
});

test('updateChaseDistance recovers distance over clean run', () => {
  const initialDist = 50;
  const result = updateChaseDistance(initialDist, 2.0, false);
  assert.equal(result.newDistance, 50 + 2.0 * DEFAULT_DIFFICULTY_CONFIG.chaseRecoveryRatePerSec);
  assert.equal(result.isApprehended, false);
  assert.equal(result.threatLevel, 'alert');
});

test('updateChaseDistance penalizes player on stumble and enters critical/caught state', () => {
  const startDist = 30;
  const stumbleResult = updateChaseDistance(startDist, 0.016, true);
  assert.equal(stumbleResult.newDistance, 0);
  assert.equal(stumbleResult.isApprehended, true);

  const safeDist = 80;
  const safeStumble = updateChaseDistance(safeDist, 0.016, true);
  assert.equal(safeStumble.newDistance, 80 - DEFAULT_DIFFICULTY_CONFIG.stumblePenalty);
  assert.equal(safeStumble.threatLevel, 'alert');
});

test('calculateScore computes correctly with multipliers', () => {
  const score1 = calculateScore(100, 10, 1);
  // (100 * 2) + (10 * 15) = 200 + 150 = 350
  assert.equal(score1, 350);

  const score2 = calculateScore(100, 10, 2);
  assert.equal(score2, 700);
});

test('checkAABBCollision detects overlapping boxes and rejects non-overlapping', () => {
  const player = { minX: -0.5, maxX: 0.5, minY: 0, maxY: 1.8, minZ: -0.5, maxZ: 0.5 };
  const obstacleHit = { minX: -0.3, maxX: 0.7, minY: 0, maxY: 1.0, minZ: 0.2, maxZ: 1.2 };
  const obstacleMiss = { minX: 2.0, maxX: 3.0, minY: 0, maxY: 1.0, minZ: 0, maxZ: 1.0 };

  assert.equal(checkAABBCollision(player, obstacleHit), true);
  assert.equal(checkAABBCollision(player, obstacleMiss), false);
});
