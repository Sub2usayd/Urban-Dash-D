import * as THREE from 'three';
import { CharacterId, BiomeId } from '../types/game';
import { CHARACTERS } from '../data/characters';

// Reusable shared materials cache to keep draw calls minimal and performance 60fps
const materialCache: Record<string, THREE.Material> = {};

function getMaterial(color: number | string, roughness: number = 0.6, metalness: number = 0.1, emissive?: number | string): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}_${metalness}_${emissive || 0}`;
  if (!materialCache[key]) {
    materialCache[key] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
      flatShading: true,
      emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0x000000),
    });
  }
  return materialCache[key] as THREE.MeshStandardMaterial;
}

export interface CharacterMeshGroup extends THREE.Group {
  userData: {
    leftLeg?: THREE.Object3D;
    rightLeg?: THREE.Object3D;
    leftArm?: THREE.Object3D;
    rightArm?: THREE.Object3D;
    torso?: THREE.Object3D;
    head?: THREE.Object3D;
    characterId?: CharacterId;
  };
}

export interface OfficerMeshGroup extends THREE.Group {
  userData: {
    leftLeg?: THREE.Object3D;
    rightLeg?: THREE.Object3D;
    leftArm?: THREE.Object3D;
    rightArm?: THREE.Object3D;
    baton?: THREE.Object3D;
  };
}

export interface K9MeshGroup extends THREE.Group {
  userData: {
    frontLeftLeg?: THREE.Object3D;
    frontRightLeg?: THREE.Object3D;
    backLeftLeg?: THREE.Object3D;
    backRightLeg?: THREE.Object3D;
    tail?: THREE.Object3D;
    head?: THREE.Object3D;
  };
}

/**
 * Builds a distinct multi-part 3D low-poly humanoid runner mesh for any of the 10 characters.
 */
export function buildRunnerMesh(charId: CharacterId): CharacterMeshGroup {
  const charData = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
  const root = new THREE.Group() as CharacterMeshGroup;
  root.name = `runner_${charId}`;

  const primaryMat = getMaterial(charData.visualStyle.primaryColor, 0.7, 0.1);
  const secondaryMat = getMaterial(charData.visualStyle.secondaryColor, 0.8, 0.1);
  const accentMat = getMaterial(charData.visualStyle.accentColor, 0.4, 0.2, charId === 'ren' || charId === 'nova' ? charData.visualStyle.accentColor : undefined);
  const skinMat = getMaterial(charData.visualStyle.skinTone, 0.9, 0.0);
  const shoeMat = getMaterial(charData.visualStyle.primaryColor === '#f8fafc' ? 0x0284c7 : 0xffffff, 0.5, 0.2);
  const hairMat = getMaterial(0x1a1a1a, 0.9, 0.0);
  const goldMat = getMaterial(0xf59e0b, 0.3, 0.6);

  // 1. Torso & Upper Wear
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.05;

  const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
  const torsoMesh = new THREE.Mesh(torsoGeo, primaryMat);
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Jacket zipper / chevron accent strip
  const zipperGeo = new THREE.BoxGeometry(0.08, 0.64, 0.36);
  const zipperMesh = new THREE.Mesh(zipperGeo, secondaryMat);
  torsoGroup.add(zipperMesh);

  // Character specific torso additions:
  if (charId === 'malik') {
    // Athletic hoodie collar
    const hoodGeo = new THREE.BoxGeometry(0.48, 0.15, 0.38);
    const hoodMesh = new THREE.Mesh(hoodGeo, secondaryMat);
    hoodMesh.position.set(0, 0.32, -0.05);
    torsoGroup.add(hoodMesh);
  } else if (charId === 'ren') {
    // Glowing collar & data deck backpack
    const deckGeo = new THREE.BoxGeometry(0.38, 0.45, 0.18);
    const deckMesh = new THREE.Mesh(deckGeo, secondaryMat);
    deckMesh.position.set(0, 0.05, -0.22);
    torsoGroup.add(deckMesh);
    const lightBarGeo = new THREE.BoxGeometry(0.25, 0.05, 0.2);
    const lightBarMesh = new THREE.Mesh(lightBarGeo, accentMat);
    lightBarMesh.position.set(0, 0.1, -0.22);
    torsoGroup.add(lightBarMesh);
  } else if (charId === 'elena') {
    // Quilted alpine vest
    const vestGeo = new THREE.BoxGeometry(0.58, 0.6, 0.38);
    const vestMesh = new THREE.Mesh(vestGeo, primaryMat);
    torsoGroup.add(vestMesh);
  } else if (charId === 'mateo') {
    // Dual spray cans on hip
    const canGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 6);
    const can1 = new THREE.Mesh(canGeo, accentMat);
    can1.position.set(0.32, -0.2, 0);
    const can2 = new THREE.Mesh(canGeo, getMaterial(0x06b6d4));
    can2.position.set(-0.32, -0.2, 0);
    torsoGroup.add(can1, can2);
  }

  root.add(torsoGroup);
  root.userData.torso = torsoGroup;

  // 2. Head & Distinct Hair
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.55, 0);

  const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Hair / Headgear by character
  if (charId === 'malik') {
    // Short dreadlocks clustered around crown with golden cuffs
    const dreadCount = 10;
    for (let i = 0; i < dreadCount; i++) {
      const angle = (i / dreadCount) * Math.PI * 2;
      const dreadGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 5);
      const dreadMesh = new THREE.Mesh(dreadGeo, hairMat);
      dreadMesh.position.set(Math.cos(angle) * 0.16, 0.18, Math.sin(angle) * 0.16);
      dreadMesh.rotation.z = Math.cos(angle) * 0.3;
      dreadMesh.rotation.x = Math.sin(angle) * 0.3;
      headGroup.add(dreadMesh);

      // Gold cuff ring on select dreads
      if (i % 3 === 0) {
        const ringGeo = new THREE.TorusGeometry(0.045, 0.015, 4, 8);
        const ringMesh = new THREE.Mesh(ringGeo, goldMat);
        ringMesh.position.copy(dreadMesh.position);
        ringMesh.rotation.x = Math.PI / 2;
        headGroup.add(ringMesh);
      }
    }
    // Crown top dread bun
    const crownGeo = new THREE.BoxGeometry(0.34, 0.12, 0.34);
    const crownMesh = new THREE.Mesh(crownGeo, hairMat);
    crownMesh.position.y = 0.22;
    headGroup.add(crownMesh);
  } else if (charId === 'maya') {
    // High ponytail with red ribbon
    const bunGeo = new THREE.SphereGeometry(0.12, 5, 5);
    const bunMesh = new THREE.Mesh(bunGeo, hairMat);
    bunMesh.position.set(0, 0.24, -0.2);
    const ribbonGeo = new THREE.BoxGeometry(0.14, 0.08, 0.08);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, primaryMat);
    ribbonMesh.position.set(0, 0.24, -0.16);
    headGroup.add(bunMesh, ribbonMesh);
  } else if (charId === 'mateo') {
    // Reversed snapback cap
    const capGeo = new THREE.BoxGeometry(0.38, 0.12, 0.38);
    const capMesh = new THREE.Mesh(capGeo, primaryMat);
    capMesh.position.y = 0.2;
    const brimGeo = new THREE.BoxGeometry(0.24, 0.04, 0.18);
    const brimMesh = new THREE.Mesh(brimGeo, primaryMat);
    brimMesh.position.set(0, 0.15, -0.25);
    headGroup.add(capMesh, brimMesh);
  } else if (charId === 'amina') {
    // Aerodynamic visor & braided crown
    const visorGeo = new THREE.BoxGeometry(0.38, 0.08, 0.2);
    const visorMesh = new THREE.Mesh(visorGeo, goldMat);
    visorMesh.position.set(0, 0.04, 0.12);
    const topHairGeo = new THREE.SphereGeometry(0.16, 6, 6);
    const topHairMesh = new THREE.Mesh(topHairGeo, hairMat);
    topHairMesh.position.set(0, 0.24, 0);
    headGroup.add(visorMesh, topHairMesh);
  } else if (charId === 'ren') {
    // Lavender undercut
    const hairGeo = new THREE.BoxGeometry(0.38, 0.15, 0.38);
    const hairMesh = new THREE.Mesh(hairGeo, getMaterial(0xc084fc, 0.5));
    hairMesh.position.set(0.04, 0.22, 0);
    headGroup.add(hairMesh);
  } else if (charId === 'elena') {
    // Beanie
    const beanieGeo = new THREE.BoxGeometry(0.38, 0.18, 0.38);
    const beanieMesh = new THREE.Mesh(beanieGeo, secondaryMat);
    beanieMesh.position.y = 0.2;
    headGroup.add(beanieMesh);
  } else if (charId === 'tariq') {
    // Desert cowl wrap
    const wrapGeo = new THREE.BoxGeometry(0.42, 0.25, 0.42);
    const wrapMesh = new THREE.Mesh(wrapGeo, primaryMat);
    wrapMesh.position.y = 0.15;
    headGroup.add(wrapMesh);
  } else if (charId === 'jax') {
    // Welding goggles on forehead
    const goggleGeo = new THREE.BoxGeometry(0.38, 0.08, 0.1);
    const goggleMesh = new THREE.Mesh(goggleGeo, getMaterial(0x1e293b, 0.2, 0.8));
    goggleMesh.position.set(0, 0.15, 0.16);
    headGroup.add(goggleMesh);
  } else if (charId === 'zoe') {
    // Space buns
    const bun1 = new THREE.SphereGeometry(0.1, 5, 5);
    const b1Mesh = new THREE.Mesh(bun1, getMaterial(0xec4899));
    b1Mesh.position.set(0.2, 0.24, 0);
    const b2Mesh = new THREE.Mesh(bun1, getMaterial(0xec4899));
    b2Mesh.position.set(-0.2, 0.24, 0);
    headGroup.add(b1Mesh, b2Mesh);
  } else if (charId === 'nova') {
    // Faceted android helmet with visor
    const visorGeo = new THREE.BoxGeometry(0.34, 0.12, 0.12);
    const visorMesh = new THREE.Mesh(visorGeo, accentMat);
    visorMesh.position.set(0, 0.04, 0.15);
    headGroup.add(visorMesh);
  }

  root.add(headGroup);
  root.userData.head = headGroup;

  // 3. Arms (Pivot at shoulder)
  const armGeo = new THREE.BoxGeometry(0.14, 0.58, 0.14);
  armGeo.translate(0, -0.25, 0); // pivot at shoulder

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(0.35, 1.3, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, primaryMat);
  leftArmMesh.castShadow = true;
  leftArmGroup.add(leftArmMesh);
  root.add(leftArmGroup);
  root.userData.leftArm = leftArmGroup;

  // Right Arm (Cybernetic for Ren!)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(-0.35, 1.3, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, charId === 'ren' ? accentMat : primaryMat);
  rightArmMesh.castShadow = true;
  rightArmGroup.add(rightArmMesh);
  root.add(rightArmGroup);
  root.userData.rightArm = rightArmGroup;

  // 4. Legs (Pivot at hip)
  const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
  legGeo.translate(0, -0.3, 0); // pivot at hip

  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(0.15, 0.72, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, secondaryMat);
  leftLegMesh.castShadow = true;
  leftLegGroup.add(leftLegMesh);

  // Left Shoe
  const shoeGeo = new THREE.BoxGeometry(0.2, 0.14, 0.32);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0, -0.65, 0.05);
  leftLegGroup.add(leftShoe);

  root.add(leftLegGroup);
  root.userData.leftLeg = leftLegGroup;

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(-0.15, 0.72, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, secondaryMat);
  rightLegMesh.castShadow = true;
  rightLegGroup.add(rightLegMesh);

  // Right Shoe
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0, -0.65, 0.05);
  rightLegGroup.add(rightShoe);

  root.add(rightLegGroup);
  root.userData.rightLeg = rightLegGroup;

  // Contact shadow disc beneath character
  const shadowGeo = new THREE.CircleGeometry(0.42, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  root.userData.characterId = charId;
  return root;
}

/**
 * Builds Officer Higgins (Police officer pursuer).
 */
export function buildOfficerMesh(): OfficerMeshGroup {
  const root = new THREE.Group() as OfficerMeshGroup;
  root.name = 'officer_higgins';

  const uniformBlueMat = getMaterial(0x1e3a8a, 0.7, 0.1); // Navy blue
  const pantsMat = getMaterial(0x172554, 0.8, 0.1);
  const skinMat = getMaterial(0xfbcfe8, 0.9, 0.0);
  const goldMat = getMaterial(0xf59e0b, 0.2, 0.8);
  const bootMat = getMaterial(0x111827, 0.4, 0.3);
  const beltMat = getMaterial(0x0f172a, 0.5, 0.2);

  // Torso
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.15;
  const torsoGeo = new THREE.BoxGeometry(0.68, 0.75, 0.42); // Sturdier build
  const torsoMesh = new THREE.Mesh(torsoGeo, uniformBlueMat);
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Police Badge
  const badgeGeo = new THREE.BoxGeometry(0.12, 0.14, 0.44);
  const badgeMesh = new THREE.Mesh(badgeGeo, goldMat);
  badgeMesh.position.set(0.18, 0.15, 0.01);
  torsoGroup.add(badgeMesh);

  // Duty belt
  const beltGeo = new THREE.BoxGeometry(0.7, 0.12, 0.44);
  const beltMesh = new THREE.Mesh(beltGeo, beltMat);
  beltMesh.position.y = -0.32;
  torsoGroup.add(beltMesh);

  root.add(torsoGroup);

  // Head & Police Cap
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.72, 0);

  const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headGroup.add(headMesh);

  // Police Peaked Hat
  const capCrownGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.18, 8);
  const capCrownMesh = new THREE.Mesh(capCrownGeo, uniformBlueMat);
  capCrownMesh.position.y = 0.25;
  headGroup.add(capCrownMesh);

  const visorGeo = new THREE.BoxGeometry(0.36, 0.04, 0.18);
  const visorMesh = new THREE.Mesh(visorGeo, bootMat);
  visorMesh.position.set(0, 0.18, 0.22);
  headGroup.add(visorMesh);

  const capBadgeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
  const capBadgeMesh = new THREE.Mesh(capBadgeGeo, goldMat);
  capBadgeMesh.position.set(0, 0.26, 0.24);
  headGroup.add(capBadgeMesh);

  root.add(headGroup);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
  armGeo.translate(0, -0.3, 0);

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(0.44, 1.45, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, uniformBlueMat);
  leftArmMesh.castShadow = true;
  leftArmGroup.add(leftArmMesh);
  root.add(leftArmGroup);
  root.userData.leftArm = leftArmGroup;

  // Right Arm with Baton
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(-0.44, 1.45, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, uniformBlueMat);
  rightArmMesh.castShadow = true;
  rightArmGroup.add(rightArmMesh);

  // Police Baton
  const batonGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6);
  const batonMesh = new THREE.Mesh(batonGeo, bootMat);
  batonMesh.position.set(0, -0.55, 0.1);
  batonMesh.rotation.x = Math.PI / 4;
  rightArmGroup.add(batonMesh);
  root.add(rightArmGroup);
  root.userData.rightArm = rightArmGroup;
  root.userData.baton = batonMesh;

  // Legs
  const legGeo = new THREE.BoxGeometry(0.22, 0.72, 0.22);
  legGeo.translate(0, -0.32, 0);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(0.18, 0.78, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.castShadow = true;
  leftLegGroup.add(leftLegMesh);

  const bootGeo = new THREE.BoxGeometry(0.24, 0.16, 0.35);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.72, 0.06);
  leftLegGroup.add(leftBoot);
  root.add(leftLegGroup);
  root.userData.leftLeg = leftLegGroup;

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(-0.18, 0.78, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.castShadow = true;
  rightLegGroup.add(rightLegMesh);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.72, 0.06);
  rightLegGroup.add(rightBoot);
  root.add(rightLegGroup);
  root.userData.rightLeg = rightLegGroup;

  // Shadow
  const shadowGeo = new THREE.CircleGeometry(0.5, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  return root;
}

/**
 * Builds Buster the Police K9 Dog.
 */
export function buildK9Mesh(): K9MeshGroup {
  const root = new THREE.Group() as K9MeshGroup;
  root.name = 'buster_k9';

  const furTanMat = getMaterial(0xb45309, 0.8, 0.0); // German Shepherd tan
  const furBlackMat = getMaterial(0x18181b, 0.8, 0.0); // Black saddle & muzzle
  const collarMat = getMaterial(0x0284c7, 0.4, 0.2); // Police blue harness
  const tagMat = getMaterial(0xf59e0b, 0.2, 0.8);

  // Dog Torso
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.5, 0);

  const bodyGeo = new THREE.BoxGeometry(0.38, 0.38, 0.75);
  const bodyMesh = new THREE.Mesh(bodyGeo, furTanMat);
  bodyMesh.castShadow = true;
  torsoGroup.add(bodyMesh);

  // Black saddle back
  const saddleGeo = new THREE.BoxGeometry(0.39, 0.2, 0.55);
  const saddleMesh = new THREE.Mesh(saddleGeo, furBlackMat);
  saddleMesh.position.set(0, 0.1, 0.02);
  torsoGroup.add(saddleMesh);

  // Police K9 Harness Strap
  const harnessGeo = new THREE.BoxGeometry(0.41, 0.4, 0.15);
  const harnessMesh = new THREE.Mesh(harnessGeo, collarMat);
  harnessMesh.position.set(0, 0, 0.12);
  torsoGroup.add(harnessMesh);

  // Silver K9 Badge
  const tagGeo = new THREE.BoxGeometry(0.08, 0.08, 0.16);
  const tagMesh = new THREE.Mesh(tagGeo, tagMat);
  tagMesh.position.set(0.18, 0.05, 0.12);
  torsoGroup.add(tagMesh);

  root.add(torsoGroup);

  // Dog Head & Alert Ears
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.78, 0.42);

  const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.3);
  const headMesh = new THREE.Mesh(headGeo, furTanMat);
  headGroup.add(headMesh);

  // Muzzle & Black Nose
  const snoutGeo = new THREE.BoxGeometry(0.18, 0.14, 0.24);
  const snoutMesh = new THREE.Mesh(snoutGeo, furBlackMat);
  snoutMesh.position.set(0, -0.06, 0.22);
  headGroup.add(snoutMesh);

  // Pointed Ears
  const earGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
  const leftEar = new THREE.Mesh(earGeo, furBlackMat);
  leftEar.position.set(0.12, 0.2, 0);
  leftEar.rotation.z = -0.2;
  const rightEar = new THREE.Mesh(earGeo, furBlackMat);
  rightEar.position.set(-0.12, 0.2, 0);
  rightEar.rotation.z = 0.2;
  headGroup.add(leftEar, rightEar);

  root.add(headGroup);
  root.userData.head = headGroup;

  // Four Legs (Pivoted for running animation)
  const legGeo = new THREE.BoxGeometry(0.1, 0.42, 0.1);
  legGeo.translate(0, -0.2, 0);

  // Front Left
  const flLeg = new THREE.Group();
  flLeg.position.set(0.14, 0.42, 0.26);
  flLeg.add(new THREE.Mesh(legGeo, furTanMat));
  root.add(flLeg);
  root.userData.frontLeftLeg = flLeg;

  // Front Right
  const frLeg = new THREE.Group();
  frLeg.position.set(-0.14, 0.42, 0.26);
  frLeg.add(new THREE.Mesh(legGeo, furTanMat));
  root.add(frLeg);
  root.userData.frontRightLeg = frLeg;

  // Back Left
  const blLeg = new THREE.Group();
  blLeg.position.set(0.14, 0.42, -0.26);
  blLeg.add(new THREE.Mesh(legGeo, furTanMat));
  root.add(blLeg);
  root.userData.backLeftLeg = blLeg;

  // Back Right
  const brLeg = new THREE.Group();
  brLeg.position.set(-0.14, 0.42, -0.26);
  brLeg.add(new THREE.Mesh(legGeo, furTanMat));
  root.add(brLeg);
  root.userData.backRightLeg = brLeg;

  // Tail
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.65, -0.38);
  const tailGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.38, 5);
  tailGeo.translate(0, 0.18, 0);
  const tailMesh = new THREE.Mesh(tailGeo, furBlackMat);
  tailMesh.rotation.x = -Math.PI / 3;
  tailGroup.add(tailMesh);
  root.add(tailGroup);
  root.userData.tail = tailGroup;

  // Shadow
  const shadowGeo = new THREE.CircleGeometry(0.38, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  return root;
}

/**
 * Builds low-poly 3D obstacle hazards tailored to each biome.
 */
export function buildObstacleMesh(type: 'hurdle' | 'overhead' | 'fullLane', biome: BiomeId): THREE.Group {
  const root = new THREE.Group();
  root.name = `obstacle_${type}_${biome}`;

  if (type === 'hurdle') {
    // Jump obstacle: low hurdle height ~0.8m
    if (biome === 'city') {
      // Police Traffic Barricade with hazard stripes
      const baseGeo = new THREE.BoxGeometry(2.0, 0.75, 0.25);
      const baseMesh = new THREE.Mesh(baseGeo, getMaterial(0xe2e8f0, 0.7));
      baseMesh.position.y = 0.38;
      root.add(baseMesh);

      const stripeGeo = new THREE.BoxGeometry(2.02, 0.2, 0.26);
      const stripeMesh = new THREE.Mesh(stripeGeo, getMaterial(0xf97316, 0.5));
      stripeMesh.position.y = 0.38;
      root.add(stripeMesh);

      // Warning amber lights on edges
      const lightGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const light1 = new THREE.Mesh(lightGeo, getMaterial(0xfbbf24, 0.2, 0.1, 0xfbbf24));
      light1.position.set(-0.85, 0.82, 0);
      const light2 = new THREE.Mesh(lightGeo, getMaterial(0xfbbf24, 0.2, 0.1, 0xfbbf24));
      light2.position.set(0.85, 0.82, 0);
      root.add(light1, light2);
    } else if (biome === 'desert') {
      // Saguaro Cacti Cluster
      const cactusMat = getMaterial(0x15803d, 0.8);
      const mainStem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.85, 6), cactusMat);
      mainStem.position.y = 0.42;
      const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 5), cactusMat);
      leftArm.position.set(-0.25, 0.5, 0);
      leftArm.rotation.z = Math.PI / 4;
      const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 5), cactusMat);
      rightArm.position.set(0.28, 0.6, 0);
      rightArm.rotation.z = -Math.PI / 4;
      root.add(mainStem, leftArm, rightArm);
    } else if (biome === 'snow') {
      // Wooden Sled Barricade with snow cap
      const sled = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 0.4), getMaterial(0x78350f, 0.8));
      sled.position.y = 0.33;
      const snowCap = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.15, 0.42), getMaterial(0xf8fafc, 0.9));
      snowCap.position.y = 0.7;
      root.add(sled, snowCap);
    } else if (biome === 'cyber') {
      // Force Field Tripwire
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), getMaterial(0x0f172a, 0.4, 0.8));
      p1.position.set(-0.9, 0.35, 0);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), getMaterial(0x0f172a, 0.4, 0.8));
      p2.position.set(0.9, 0.35, 0);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.12), getMaterial(0xef4444, 0.2, 0.2, 0xef4444));
      beam.position.y = 0.5;
      root.add(p1, p2, beam);
    } else {
      // Gnarled Forest Root / Broken Timber
      const timber = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 2.0, 6), getMaterial(0x573a24, 0.9));
      timber.rotation.z = Math.PI / 2;
      timber.position.y = 0.35;
      root.add(timber);
    }
  } else if (type === 'overhead') {
    // Slide obstacle: high clearance under which player must slide (height ~1.4m - 2.8m, clear below 0.8m)
    if (biome === 'city') {
      // Overhead Neon Billboard Gantry
      const postMat = getMaterial(0x334155, 0.5, 0.5);
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), postMat);
      postL.position.set(-1.1, 1.6, 0);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), postMat);
      postR.position.set(1.1, 1.6, 0);

      const signGeo = new THREE.BoxGeometry(2.1, 1.2, 0.22);
      const signMesh = new THREE.Mesh(signGeo, getMaterial(0x0284c7, 0.4, 0.2, 0x0284c7));
      signMesh.position.set(0, 2.1, 0);

      // Warning hazard stripes at bottom of overhead sign
      const lipGeo = new THREE.BoxGeometry(2.12, 0.18, 0.24);
      const lipMesh = new THREE.Mesh(lipGeo, getMaterial(0xf59e0b, 0.4, 0.1, 0xf59e0b));
      lipMesh.position.set(0, 1.45, 0);

      root.add(postL, postR, signMesh, lipMesh);
    } else if (biome === 'forest') {
      // Massive Hollow Cedar Log tunnel
      const logOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.2, 8, 1, true), getMaterial(0x451a03, 0.9));
      logOuter.rotation.x = Math.PI / 2;
      logOuter.position.y = 1.35;
      root.add(logOuter);
    } else if (biome === 'storm') {
      // Industrial High-Pressure Steam Pipe
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.4, 8), getMaterial(0x64748b, 0.4, 0.7));
      pipe.rotation.z = Math.PI / 2;
      pipe.position.y = 1.45;
      root.add(pipe);
    } else if (biome === 'cyber') {
      // Cyber Security Laser Grid
      const emitterL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 0.25), getMaterial(0x18181b, 0.3, 0.7));
      emitterL.position.set(-1.1, 1.4, 0);
      const emitterR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 0.25), getMaterial(0x18181b, 0.3, 0.7));
      emitterR.position.set(1.1, 1.4, 0);
      const laserBeam = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.1), getMaterial(0xf43f5e, 0.2, 0.1, 0xf43f5e));
      laserBeam.position.set(0, 1.5, 0);
      root.add(emitterL, emitterR, laserBeam);
    } else {
      // Desert Stone Arch
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.25, 5, 8, Math.PI), getMaterial(0x9a3412, 0.9));
      arch.position.y = 0.5;
      root.add(arch);
    }
  } else {
    // Full-lane obstacle: blocks entire lane completely from ground up to 3m (must switch lanes)
    if (biome === 'city') {
      // Stalled Yellow Taxicab
      const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 2.8), getMaterial(0xfacc15, 0.4, 0.2));
      cabBody.position.y = 0.55;
      const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.4), getMaterial(0x1e293b, 0.3, 0.4));
      cabRoof.position.set(0, 1.15, -0.2);
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.2), getMaterial(0xffffff, 0.2, 0.2, 0xfacc15));
      taxiSign.position.set(0, 1.55, -0.2);
      root.add(cabBody, cabRoof, taxiSign);
    } else if (biome === 'desert') {
      // Red Granite Boulder
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), getMaterial(0x7c2d12, 0.9));
      boulder.position.y = 0.95;
      root.add(boulder);
    } else if (biome === 'forest') {
      // Ancient Sequoia Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 3.5, 7), getMaterial(0x271406, 0.9));
      trunk.position.y = 1.75;
      root.add(trunk);
    } else if (biome === 'snow') {
      // Snowbank Drift
      const drift = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.8, 6), getMaterial(0xe2e8f0, 0.8));
      drift.position.y = 0.9;
      root.add(drift);
    } else if (biome === 'cyber') {
      // Hover Police Drone
      const drone = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.4, 6), getMaterial(0x1e293b, 0.3, 0.8));
      drone.position.y = 1.3;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), getMaterial(0xef4444, 0.2, 0.2, 0xef4444));
      dome.position.set(0, 1.5, 0);
      root.add(drone, dome);
    } else {
      // Rock Pinnacle / Shipping Crate
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.8), getMaterial(0x334155, 0.8));
      crate.position.y = 1.0;
      root.add(crate);
    }
  }

  return root;
}

/**
 * Builds rotating collectible 3D gold coins.
 */
export function buildCoinMesh(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'collectible_coin';

  const coinMat = getMaterial(0xfacc15, 0.3, 0.7, 0xca8a04);
  const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12);
  const coinMesh = new THREE.Mesh(coinGeo, coinMat);
  coinMesh.rotation.x = Math.PI / 2;
  root.add(coinMesh);

  // Star / diamond accent on coin center
  const gemGeo = new THREE.OctahedronGeometry(0.12, 0);
  const gemMat = getMaterial(0xfef08a, 0.1, 0.9, 0xfef08a);
  const gemMesh = new THREE.Mesh(gemGeo, gemMat);
  root.add(gemMesh);

  return root;
}

/**
 * Builds power-up 3D pickups (Magnet, Sneakers, Multiplier, Shield).
 */
export function buildPowerUpMesh(type: 'magnet' | 'sneakers' | 'multiplier' | 'shield'): THREE.Group {
  const root = new THREE.Group();
  root.name = `powerup_${type}`;

  if (type === 'magnet') {
    // Horseshoe magnet
    const magnetMat = getMaterial(0xef4444, 0.3, 0.5, 0xef4444);
    const tipMat = getMaterial(0xe2e8f0, 0.2, 0.8);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 6, 12, Math.PI), magnetMat);
    arc.position.y = 0.1;
    const tip1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.16), tipMat);
    tip1.position.set(0.3, -0.05, 0);
    const tip2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.16), tipMat);
    tip2.position.set(-0.3, -0.05, 0);
    root.add(arc, tip1, tip2);
  } else if (type === 'sneakers') {
    // Winged neon sneaker
    const shoeMat = getMaterial(0x10b981, 0.3, 0.3, 0x10b981);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.45), shoeMat);
    const wingGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
    const wingL = new THREE.Mesh(wingGeo, getMaterial(0xffffff, 0.2, 0.8));
    wingL.rotation.z = Math.PI / 3;
    wingL.position.set(0.2, 0.15, -0.1);
    root.add(body, wingL);
  } else if (type === 'multiplier') {
    // Glowing 2X Diamond Ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.07, 6, 12), getMaterial(0xf59e0b, 0.2, 0.8, 0xf59e0b));
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), getMaterial(0xffffff, 0.1, 0.9, 0xffffff));
    root.add(ring, star);
  } else {
    // Shield bubble icon
    const shieldSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), getMaterial(0x06b6d4, 0.1, 0.9, 0x06b6d4));
    root.add(shieldSphere);
  }

  return root;
}
