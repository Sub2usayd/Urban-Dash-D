import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CharacterId, BiomeId, PowerUpType, GameMetrics } from '../types/game';
import { BIOMES } from '../data/biomes';
import {
  buildRunnerMesh,
  buildOfficerMesh,
  buildK9Mesh,
  buildObstacleMesh,
  buildCoinMesh,
  buildPowerUpMesh,
  CharacterMeshGroup,
  OfficerMeshGroup,
  K9MeshGroup,
} from '../game/meshBuilders';
import {
  calculateSpeed,
  calculateObstacleSpacing,
  updateChaseDistance,
  checkAABBCollision,
} from '../game/difficulty';
import { soundEngine } from '../audio/soundEngine';

interface GameCanvasProps {
  characterId: CharacterId;
  biomeId: BiomeId;
  isPlaying: boolean;
  isPaused: boolean;
  onGameOver: (metrics: GameMetrics) => void;
  onUpdateMetrics: (metrics: Partial<GameMetrics>) => void;
}

const LANES = [-2.8, 0, 2.8]; // Left, Center, Right in meters
const CHUNK_LENGTH = 24.0;
const TOTAL_CHUNKS = 7;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  characterId,
  biomeId,
  isPlaying,
  isPaused,
  onGameOver,
  onUpdateMetrics,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store mutable state in refs so 60fps render loop never triggers React re-renders or unmounts
  const stateRef = useRef({
    isPlaying,
    isPaused,
    characterId,
    biomeId,
    onGameOver,
    onUpdateMetrics,
    playerLane: 1, // 0 = Left (-2.8), 1 = Center (0), 2 = Right (2.8)
    targetX: 0,
    currentX: 0,
    currentY: 0,
    vy: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    distance: 0,
    coins: 0,
    chaseDistance: 85, // 0 to 100
    stumbledCount: 0,
    stumbleFlashTimer: 0,
    activePowerUps: {
      magnet: 0,
      sneakers: 0,
      multiplier: 0,
      shield: false,
    },
    cameraShake: 0,
  });

  // Keep refs in sync with props
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.isPaused = isPaused;
    stateRef.current.characterId = characterId;
    stateRef.current.biomeId = biomeId;
    stateRef.current.onGameOver = onGameOver;
    stateRef.current.onUpdateMetrics = onUpdateMetrics;
  }, [isPlaying, isPaused, characterId, biomeId, onGameOver, onUpdateMetrics]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Detect headless test environments
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const currentBiome = BIOMES.find((b) => b.id === stateRef.current.biomeId) || BIOMES[0];
    scene.background = new THREE.Color(currentBiome.visualAtmosphere.skyColor);
    scene.fog = new THREE.Fog(
      currentBiome.visualAtmosphere.fogColor,
      20,
      120
    );

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 180);
    camera.position.set(0, 3.8, 6.2);
    camera.lookAt(0, 1.4, -4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Deliberate Lighting Setup (Warm directional key + Cool hemisphere fill)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.75);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(8, 16, 10);
    dirLight.castShadow = !isHeadless;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 45;
    dirLight.shadow.camera.left = -12;
    dirLight.shadow.camera.right = 12;
    dirLight.shadow.camera.top = 12;
    dirLight.shadow.camera.bottom = -12;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 3. Player Character Mesh
    let playerGroup = buildRunnerMesh(stateRef.current.characterId);
    scene.add(playerGroup);

    // 4. Officer Higgins & Buster the K9 (Persistent Pursuers)
    const officerGroup = buildOfficerMesh();
    scene.add(officerGroup);

    const k9Group = buildK9Mesh();
    scene.add(k9Group);

    // 5. Procedural Track Chunks & Obstacles Pool
    const trackChunks: THREE.Group[] = [];
    const roadMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(currentBiome.visualAtmosphere.groundColor),
      roughness: 0.8,
      metalness: 0.1,
    });
    const roadGeo = new THREE.PlaneGeometry(8.4, CHUNK_LENGTH);
    roadGeo.rotateX(-Math.PI / 2);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const lineGeo = new THREE.PlaneGeometry(0.12, CHUNK_LENGTH);
    lineGeo.rotateX(-Math.PI / 2);

    // Initialize track chunks
    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      const chunk = new THREE.Group();
      chunk.position.z = -i * CHUNK_LENGTH;

      // Road plane
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.position.y = 0;
      road.receiveShadow = !isHeadless;
      chunk.add(road);

      // Lane dividers
      const lineLeft = new THREE.Mesh(lineGeo, lineMat);
      lineLeft.position.set(-1.4, 0.01, 0);
      const lineRight = new THREE.Mesh(lineGeo, lineMat);
      lineRight.position.set(1.4, 0.01, 0);
      chunk.add(lineLeft, lineRight);

      // Scenery props on left and right borders
      addBiomeSceneryToChunk(chunk, currentBiome.id);

      scene.add(chunk);
      trackChunks.push(chunk);
    }

    // Dynamic Active Obstacles & Pickups arrays
    interface ActiveEntity {
      mesh: THREE.Group;
      type: 'hurdle' | 'overhead' | 'fullLane' | 'coin' | 'powerup';
      powerUpType?: PowerUpType;
      lane: number;
      z: number;
      collected?: boolean;
    }

    const activeEntities: ActiveEntity[] = [];

    // Helper to spawn obstacles / coins ahead
    let nextObstacleZ = -30.0;
    function spawnRow(atZ: number) {
      const bId = stateRef.current.biomeId;
      const spacing = calculateObstacleSpacing(stateRef.current.distance);

      // Decide row contents
      const roll = Math.random();
      if (roll < 0.65) {
        // Spawn 1 or 2 obstacles in lanes
        const blockedLanes = [Math.floor(Math.random() * 3)];
        if (Math.random() < 0.35 && stateRef.current.distance > 800) {
          // Block a second lane, keeping at least 1 lane open
          const otherLanes = [0, 1, 2].filter((l) => !blockedLanes.includes(l));
          blockedLanes.push(otherLanes[Math.floor(Math.random() * otherLanes.length)]);
        }

        const obstacleTypes: Array<'hurdle' | 'overhead' | 'fullLane'> = ['hurdle', 'overhead', 'fullLane'];

        blockedLanes.forEach((laneIdx) => {
          const obsType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
          const obsMesh = buildObstacleMesh(obsType, bId);
          obsMesh.position.set(LANES[laneIdx], 0, atZ);
          scene.add(obsMesh);

          activeEntities.push({
            mesh: obsMesh,
            type: obsType,
            lane: laneIdx,
            z: atZ,
          });
        });

        // Spawn coins in the unblocked lane
        const openLanes = [0, 1, 2].filter((l) => !blockedLanes.includes(l));
        if (openLanes.length > 0 && Math.random() < 0.7) {
          const coinLane = openLanes[0];
          for (let c = 0; c < 3; c++) {
            const coinMesh = buildCoinMesh();
            const coinZ = atZ - (c - 1) * 2.2;
            coinMesh.position.set(LANES[coinLane], 0.9, coinZ);
            scene.add(coinMesh);
            activeEntities.push({
              mesh: coinMesh,
              type: 'coin',
              lane: coinLane,
              z: coinZ,
            });
          }
        }
      } else {
        // Spawn Coins Arc or PowerUp
        if (Math.random() < 0.3) {
          // PowerUp
          const pTypes: PowerUpType[] = ['magnet', 'sneakers', 'multiplier', 'shield'];
          const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
          const pMesh = buildPowerUpMesh(pType);
          const pLane = Math.floor(Math.random() * 3);
          pMesh.position.set(LANES[pLane], 1.0, atZ);
          scene.add(pMesh);
          activeEntities.push({
            mesh: pMesh,
            type: 'powerup',
            powerUpType: pType,
            lane: pLane,
            z: atZ,
          });
        } else {
          // 4-coin straight run
          const laneIdx = Math.floor(Math.random() * 3);
          for (let c = 0; c < 4; c++) {
            const coinMesh = buildCoinMesh();
            const coinZ = atZ - c * 2.2;
            coinMesh.position.set(LANES[laneIdx], 0.9, coinZ);
            scene.add(coinMesh);
            activeEntities.push({
              mesh: coinMesh,
              type: 'coin',
              lane: laneIdx,
              z: coinZ,
            });
          }
        }
      }

      nextObstacleZ = atZ - spacing;
    }

    // Seed initial obstacle rows
    while (nextObstacleZ > -150) {
      spawnRow(nextObstacleZ);
    }

    // 6. Input Handling (Keyboard + Swipes)
    function handleLaneSwitch(delta: -1 | 1) {
      if (!stateRef.current.isPlaying || stateRef.current.isPaused) return;
      const newLane = Math.max(0, Math.min(2, stateRef.current.playerLane + delta));
      if (newLane !== stateRef.current.playerLane) {
        stateRef.current.playerLane = newLane;
        stateRef.current.targetX = LANES[newLane];
        soundEngine.playLaneSwitch();
      }
    }

    function handleJump() {
      if (!stateRef.current.isPlaying || stateRef.current.isPaused) return;
      if (!stateRef.current.isJumping) {
        stateRef.current.isJumping = true;
        const jumpVelocity = stateRef.current.activePowerUps.sneakers > 0 ? 17.5 : 14.5;
        stateRef.current.vy = jumpVelocity;
        stateRef.current.isSliding = false;
        soundEngine.playJump();
      }
    }

    function handleSlide() {
      if (!stateRef.current.isPlaying || stateRef.current.isPaused) return;
      if (stateRef.current.isJumping) {
        // Fast dive from air into slide
        stateRef.current.vy = -28.0;
      }
      stateRef.current.isSliding = true;
      stateRef.current.slideTimer = 0.72; // seconds
      soundEngine.playSlide();
    }

    // Keyboard bindings
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleLaneSwitch(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleLaneSwitch(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        handleJump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleSlide();
      }
    }

    window.addEventListener('keydown', onKeyDown);

    // Touch Swipe handling
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dt = performance.now() - touchStartTime;

      if (dt > 350) return; // Ignore long drags

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < 25 && absY < 25) return; // Deadzone

      if (absX > absY) {
        // Horizontal swipe
        if (dx > 0) handleLaneSwitch(1);
        else handleLaneSwitch(-1);
      } else {
        // Vertical swipe
        if (dy < 0) handleJump();
        else handleSlide();
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    // 7. Animation Loop with Clamped dt
    let lastTime = performance.now();
    let animationFrameId: number;
    let animClock = 0;
    let lastMetricUpdate = 0;
    let barkTimer = 0;
    let sirenTimer = 0;

    function animate(now: number) {
      animationFrameId = requestAnimationFrame(animate);

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamped dt to prevent tunneling

      if (!stateRef.current.isPlaying || stateRef.current.isPaused) {
        renderer.render(scene, camera);
        return;
      }

      animClock += dt;
      const s = stateRef.current;

      // Calculate speed based on distance
      const speed = calculateSpeed(s.distance);
      const moveZ = speed * dt;
      s.distance += moveZ;

      // Decay powerups
      if (s.activePowerUps.magnet > 0) s.activePowerUps.magnet = Math.max(0, s.activePowerUps.magnet - dt);
      if (s.activePowerUps.sneakers > 0) s.activePowerUps.sneakers = Math.max(0, s.activePowerUps.sneakers - dt);
      if (s.activePowerUps.multiplier > 0) s.activePowerUps.multiplier = Math.max(0, s.activePowerUps.multiplier - dt);

      // Update Player X (Snappy lane lerp)
      s.currentX += (s.targetX - s.currentX) * (1 - Math.exp(-22 * dt));

      // Update Player Y (Jump / Gravity)
      if (s.isJumping) {
        s.currentY += s.vy * dt;
        s.vy -= 42.0 * dt; // Gravity
        if (s.currentY <= 0) {
          s.currentY = 0;
          s.isJumping = false;
          s.vy = 0;
        }
      }

      // Update Player Slide
      if (s.isSliding) {
        s.slideTimer -= dt;
        if (s.slideTimer <= 0) {
          s.isSliding = false;
        }
      }

      // Update Player Mesh Position & Scale
      playerGroup.position.set(s.currentX, s.currentY, 0);

      if (s.isSliding) {
        playerGroup.scale.set(1.15, 0.45, 1.15); // Squash for slide
        playerGroup.rotation.x = -0.4;
      } else if (s.isJumping) {
        playerGroup.scale.set(0.9, 1.15, 0.9); // Stretch for jump
        playerGroup.rotation.x = 0;
      } else {
        playerGroup.scale.set(1, 1, 1);
        playerGroup.rotation.x = 0;
      }

      // Animate Player Limbs
      const runCycle = animClock * speed * 0.9;
      if (playerGroup.userData.leftLeg && playerGroup.userData.rightLeg) {
        if (!s.isJumping && !s.isSliding) {
          playerGroup.userData.leftLeg.rotation.x = Math.sin(runCycle) * 0.85;
          playerGroup.userData.rightLeg.rotation.x = -Math.sin(runCycle) * 0.85;
          if (playerGroup.userData.leftArm && playerGroup.userData.rightArm) {
            playerGroup.userData.leftArm.rotation.x = -Math.sin(runCycle) * 0.75;
            playerGroup.userData.rightArm.rotation.x = Math.sin(runCycle) * 0.75;
          }
        } else if (s.isJumping) {
          playerGroup.userData.leftLeg.rotation.x = 0.6;
          playerGroup.userData.rightLeg.rotation.x = -0.4;
        }
      }

      // Animate Officer Higgins & Buster the Dog (Persistent Pursuers)
      // Chase distance lead: 100 = ~14m behind, 0 = 1.5m (contact / caught)
      const pursuerZLead = 1.5 + (s.chaseDistance / 100) * 12.5;

      // Officer Higgins position & stride
      officerGroup.position.set(s.currentX * 0.65, 0, pursuerZLead);
      if (officerGroup.userData.leftLeg && officerGroup.userData.rightLeg) {
        officerGroup.userData.leftLeg.rotation.x = -Math.sin(runCycle * 1.05) * 0.9;
        officerGroup.userData.rightLeg.rotation.x = Math.sin(runCycle * 1.05) * 0.9;
        if (officerGroup.userData.leftArm && officerGroup.userData.rightArm) {
          officerGroup.userData.leftArm.rotation.x = Math.sin(runCycle * 1.05) * 0.8;
          officerGroup.userData.rightArm.rotation.x = -Math.sin(runCycle * 1.05) * 0.8;
        }
      }

      // Buster K9 position & bounding leap
      k9Group.position.set(s.currentX * 0.75 + 1.1, 0, pursuerZLead + 0.6);
      if (k9Group.userData.frontLeftLeg && k9Group.userData.frontRightLeg) {
        k9Group.userData.frontLeftLeg.rotation.x = Math.sin(runCycle * 1.3) * 0.9;
        k9Group.userData.frontRightLeg.rotation.x = -Math.sin(runCycle * 1.3) * 0.9;
        if (k9Group.userData.backLeftLeg && k9Group.userData.backRightLeg) {
          k9Group.userData.backLeftLeg.rotation.x = -Math.sin(runCycle * 1.3) * 0.9;
          k9Group.userData.backRightLeg.rotation.x = Math.sin(runCycle * 1.3) * 0.9;
        }
        if (k9Group.userData.tail) {
          k9Group.userData.tail.rotation.y = Math.sin(runCycle * 2.5) * 0.6;
        }
      }

      // Threat audio triggers
      if (s.chaseDistance < 40) {
        barkTimer += dt;
        if (barkTimer > 2.5 - (40 - s.chaseDistance) * 0.04) {
          soundEngine.playDogBark();
          barkTimer = 0;
        }

        sirenTimer += dt;
        if (sirenTimer > 1.8) {
          soundEngine.playSiren();
          sirenTimer = 0;
        }
      }

      // Scroll Track Chunks
      trackChunks.forEach((chunk) => {
        chunk.position.z += moveZ;
        if (chunk.position.z > CHUNK_LENGTH) {
          chunk.position.z -= TOTAL_CHUNKS * CHUNK_LENGTH;
        }
      });

      // Move Active Obstacles & Pickups forward relative to runner
      for (let i = activeEntities.length - 1; i >= 0; i--) {
        const ent = activeEntities[i];
        ent.mesh.position.z += moveZ;
        ent.z += moveZ;

        // Rotate coins & powerups
        if (ent.type === 'coin') {
          ent.mesh.rotation.y += 4.5 * dt;

          // Magnet Attraction Effect
          if (s.activePowerUps.magnet > 0 && !ent.collected) {
            const distToPlayer = Math.hypot(ent.mesh.position.x - s.currentX, ent.mesh.position.z - 0);
            if (distToPlayer < 8.0) {
              ent.mesh.position.x += (s.currentX - ent.mesh.position.x) * 14 * dt;
              ent.mesh.position.z += (0 - ent.mesh.position.z) * 14 * dt;
            }
          }
        } else if (ent.type === 'powerup') {
          ent.mesh.rotation.y += 3.0 * dt;
          ent.mesh.position.y = 1.0 + Math.sin(animClock * 4) * 0.2;
        }

        // Collision Check (Player bounding box approx)
        const playerBox = {
          minX: s.currentX - 0.45,
          maxX: s.currentX + 0.45,
          minY: s.currentY,
          maxY: s.currentY + (s.isSliding ? 0.65 : 1.8),
          minZ: -0.4,
          maxZ: 0.4,
        };

        if (!ent.collected && Math.abs(ent.mesh.position.z) < 1.4) {
          if (ent.type === 'coin') {
            const hitCoin =
              Math.abs(ent.mesh.position.x - s.currentX) < 1.1 &&
              Math.abs(ent.mesh.position.y - (s.currentY + 0.9)) < 1.2;

            if (hitCoin) {
              ent.collected = true;
              scene.remove(ent.mesh);
              const coinValue = s.activePowerUps.multiplier > 0 ? 2 : 1;
              s.coins += coinValue;
              soundEngine.playCoin();
            }
          } else if (ent.type === 'powerup') {
            const hitPower =
              Math.abs(ent.mesh.position.x - s.currentX) < 1.1 &&
              Math.abs(ent.mesh.position.y - (s.currentY + 1.0)) < 1.3;

            if (hitPower && ent.powerUpType) {
              ent.collected = true;
              scene.remove(ent.mesh);
              soundEngine.playPowerUp();

              if (ent.powerUpType === 'magnet') s.activePowerUps.magnet = 12.0;
              else if (ent.powerUpType === 'sneakers') s.activePowerUps.sneakers = 12.0;
              else if (ent.powerUpType === 'multiplier') s.activePowerUps.multiplier = 15.0;
              else if (ent.powerUpType === 'shield') s.activePowerUps.shield = true;
            }
          } else {
            // Obstacle Collision
            let hitObstacle = false;
            let obstacleHeight = 1.0;

            if (ent.type === 'hurdle') {
              obstacleHeight = 0.85;
              // Player must jump above hurdle
              const obstacleBox = {
                minX: ent.mesh.position.x - 0.9,
                maxX: ent.mesh.position.x + 0.9,
                minY: 0,
                maxY: obstacleHeight,
                minZ: ent.mesh.position.z - 0.3,
                maxZ: ent.mesh.position.z + 0.3,
              };
              hitObstacle = checkAABBCollision(playerBox, obstacleBox);
            } else if (ent.type === 'overhead') {
              // Player must slide under
              const obstacleBox = {
                minX: ent.mesh.position.x - 0.9,
                maxX: ent.mesh.position.x + 0.9,
                minY: 0.85,
                maxY: 3.0,
                minZ: ent.mesh.position.z - 0.3,
                maxZ: ent.mesh.position.z + 0.3,
              };
              hitObstacle = checkAABBCollision(playerBox, obstacleBox);
            } else if (ent.type === 'fullLane') {
              // Player must switch lanes completely
              const obstacleBox = {
                minX: ent.mesh.position.x - 0.85,
                maxX: ent.mesh.position.x + 0.85,
                minY: 0,
                maxY: 2.6,
                minZ: ent.mesh.position.z - 1.2,
                maxZ: ent.mesh.position.z + 1.2,
              };
              hitObstacle = checkAABBCollision(playerBox, obstacleBox);
            }

            if (hitObstacle) {
              ent.collected = true; // prevent multi-hits

              if (s.activePowerUps.shield) {
                // Shield absorbs impact
                s.activePowerUps.shield = false;
                soundEngine.playStumble();
                s.cameraShake = 0.5;
              } else {
                // Stumble penalty
                s.stumbledCount++;
                s.cameraShake = 0.8;
                soundEngine.playStumble();

                const chaseUpdate = updateChaseDistance(s.chaseDistance, dt, true);
                s.chaseDistance = chaseUpdate.newDistance;

                if (chaseUpdate.isApprehended) {
                  // Bust sequence
                  s.isPlaying = false;
                  s.onGameOver({
                    distance: Math.floor(s.distance),
                    coins: s.coins,
                    score: Math.floor(s.distance * 2 + s.coins * 15),
                    speed: Math.round(speed),
                    chaseDistance: 0,
                    multiplier: s.activePowerUps.multiplier > 0 ? 2 : 1,
                    biome: s.biomeId,
                    characterId: s.characterId,
                    stumbledCount: s.stumbledCount,
                    isGameOver: true,
                    isPaused: false,
                    causeOfDeath: `Apprehended by Officer Higgins and Buster after hitting a ${ent.type}!`,
                  });
                  return;
                }
              }
            }
          }
        }

        // Despawn passed entities behind camera
        if (ent.mesh.position.z > 12.0) {
          scene.remove(ent.mesh);
          activeEntities.splice(i, 1);
        }
      }

      // Spawn new obstacle rows ahead
      if (nextObstacleZ > -150) {
        spawnRow(nextObstacleZ);
      }
      nextObstacleZ += moveZ;

      // Natural Chase Distance Lead recovery during clean running
      const chaseClean = updateChaseDistance(s.chaseDistance, dt, false);
      s.chaseDistance = chaseClean.newDistance;

      // Camera Follow & Shake
      const shakeX = (Math.random() - 0.5) * s.cameraShake * 0.4;
      const shakeY = (Math.random() - 0.5) * s.cameraShake * 0.4;
      s.cameraShake = Math.max(0, s.cameraShake - dt * 3.5);

      camera.position.x = s.currentX * 0.3 + shakeX;
      camera.position.y = 3.6 + s.currentY * 0.2 + shakeY;
      camera.position.z = 6.2;
      camera.lookAt(s.currentX * 0.35, 1.4 + s.currentY * 0.3, -8);

      // Throttle React State Updates to ~8Hz to prevent React reconciliation lag
      if (animClock - lastMetricUpdate > 0.12) {
        lastMetricUpdate = animClock;
        s.onUpdateMetrics({
          distance: Math.floor(s.distance),
          coins: s.coins,
          score: Math.floor(s.distance * 2 + s.coins * 15),
          speed: Math.round(speed),
          chaseDistance: Math.round(s.chaseDistance),
          multiplier: s.activePowerUps.multiplier > 0 ? 2 : 1,
          stumbledCount: s.stumbledCount,
        });
      }

      renderer.render(scene, camera);
    }

    // Pre-warm WebGL shaders once
    renderer.compile(scene, camera);
    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    function onResize() {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none bg-slate-950"
      style={{ touchAction: 'none' }}
    />
  );
};

/**
 * Procedural low-poly scenery props flanking the running track.
 */
function addBiomeSceneryToChunk(chunk: THREE.Group, biome: BiomeId) {
  const zStep = CHUNK_LENGTH / 2;

  for (let s = -1; s <= 1; s += 2) {
    const xPos = s * 6.5;

    if (biome === 'city') {
      // Skyscraper Facades with neon windows
      for (let z = -zStep / 2; z <= zStep / 2; z += zStep) {
        const h = 10 + Math.random() * 8;
        const bldg = new THREE.Mesh(
          new THREE.BoxGeometry(4.5, h, 8.0),
          new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, flatShading: true })
        );
        bldg.position.set(xPos + s * 1.5, h / 2, z);
        chunk.add(bldg);

        // Neon billboard strip
        const billboard = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 1.8, 3.5),
          new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x06b6d4 : 0xec4899 })
        );
        billboard.position.set(s * 4.4, 4.5, z);
        chunk.add(billboard);
      }
    } else if (biome === 'desert') {
      // Red Sandstone Mesas & Saguaro Cacti
      const mesa = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 4.0, 7.0, 6),
        new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9, flatShading: true })
      );
      mesa.position.set(xPos + s * 2, 3.5, 0);
      chunk.add(mesa);

      const cactus = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 2.2, 5),
        new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8, flatShading: true })
      );
      cactus.position.set(s * 4.6, 1.1, 4.0);
      chunk.add(cactus);
    } else if (biome === 'forest') {
      // Conifer Pine Trees
      for (let z = -6; z <= 6; z += 6) {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.4, 1.5, 5),
          new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9, flatShading: true })
        );
        trunk.position.set(xPos, 0.75, z);
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry(2.0, 4.5, 6),
          new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8, flatShading: true })
        );
        foliage.position.set(xPos, 3.75, z);
        chunk.add(trunk, foliage);
      }
    } else if (biome === 'mountain') {
      // Basalt Spires & Pinnacle Peaks
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(2.8, 11.0, 5),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, flatShading: true })
      );
      spire.position.set(xPos + s * 2.5, 5.5, 0);
      chunk.add(spire);
    } else if (biome === 'snow') {
      // Timber Alpine Cabins
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 2.5, 5.0),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8, flatShading: true })
      );
      cabin.position.set(xPos + s * 1.5, 1.25, 0);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3.5, 2.0, 4),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7, flatShading: true })
      );
      roof.position.set(xPos + s * 1.5, 3.25, 0);
      roof.rotation.y = Math.PI / 4;
      chunk.add(cabin, roof);
    } else if (biome === 'storm') {
      // Shipping Containers & Industrial Cranes
      const crate1 = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 2.4, 5.5),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, flatShading: true })
      );
      crate1.position.set(xPos, 1.2, 0);
      chunk.add(crate1);
    } else {
      // Cyber City Glowing Arcology Towers
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 14.0, 3.5),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7, flatShading: true })
      );
      tower.position.set(xPos + s * 2, 7.0, 0);
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 14.0, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xa855f7 })
      );
      strip.position.set(s * 4.6, 7.0, 0);
      chunk.add(tower, strip);
    }
  }
}
