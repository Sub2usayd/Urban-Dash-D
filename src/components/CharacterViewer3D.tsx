import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CharacterId } from '../types/game';
import { CHARACTERS } from '../data/characters';
import {
  buildRunnerMesh,
  buildOfficerMesh,
  buildK9Mesh,
  CharacterMeshGroup,
  OfficerMeshGroup,
  K9MeshGroup,
} from '../game/meshBuilders';
import { RotateCw, Shield, Sparkles, Trophy, Zap } from 'lucide-react';

export type InspectTarget = CharacterId | 'officer' | 'buster';

type AnimationMode = 'run' | 'jump' | 'slide' | 'stumble' | 'idle' | 'victory';

export const CharacterViewer3D: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState<InspectTarget>('malik');
  const [animMode, setAnimMode] = useState<AnimationMode>('run');
  const [autoRotate, setAutoRotate] = useState(true);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    currentMesh: THREE.Group | null;
  } | null>(null);

  const selectedChar = CHARACTERS.find((c) => c.id === selectedTarget);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.3, 4.2);
    camera.lookAt(0, 0.9, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Platform Pedestal with circular grid
    const pedGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 24);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.2,
      flatShading: true,
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = -0.1;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const ringGeo = new THREE.RingGeometry(1.4, 1.48, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Studio Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      currentMesh: null,
    };

    // Orbit Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let manualRotation = Math.PI * 0.9; // Face towards camera in 3/4 heroic pose

    function onPointerDown(e: MouseEvent | TouchEvent) {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      prevMouseX = clientX;
    }

    function onPointerMove(e: MouseEvent | TouchEvent) {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - prevMouseX;
      prevMouseX = clientX;
      manualRotation += deltaX * 0.01;
      if (sceneRef.current?.currentMesh) {
        sceneRef.current.currentMesh.rotation.y = manualRotation;
      }
    }

    function onPointerUp() {
      isDragging = false;
    }

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Animation Render Loop
    let animId: number;
    let clock = 0;

    function renderLoop() {
      animId = requestAnimationFrame(renderLoop);
      clock += 0.016;

      const mesh = sceneRef.current?.currentMesh;
      if (mesh) {
        if (autoRotate && !isDragging) {
          mesh.rotation.y += 0.008;
          manualRotation = mesh.rotation.y;
        }

        // Apply selected animation
        const runCycle = clock * 9.0;
        const uData = mesh.userData as Record<string, THREE.Object3D | undefined>;

        if (animMode === 'run') {
          mesh.position.y = Math.abs(Math.sin(runCycle)) * 0.12;
          mesh.scale.set(1, 1, 1);
          mesh.rotation.x = 0.15; // Lean forward

          if (uData.leftLeg && uData.rightLeg) {
            uData.leftLeg.rotation.x = Math.sin(runCycle) * 0.9;
            uData.rightLeg.rotation.x = -Math.sin(runCycle) * 0.9;
          }
          if (uData.leftArm && uData.rightArm) {
            uData.leftArm.rotation.x = -Math.sin(runCycle) * 0.8;
            uData.rightArm.rotation.x = Math.sin(runCycle) * 0.8;
          }
          if (uData.frontLeftLeg && uData.frontRightLeg) {
            uData.frontLeftLeg.rotation.x = Math.sin(runCycle) * 0.8;
            uData.frontRightLeg.rotation.x = -Math.sin(runCycle) * 0.8;
          }
          if (uData.tail) {
            uData.tail.rotation.y = Math.sin(runCycle * 2) * 0.5;
          }
        } else if (animMode === 'jump') {
          mesh.position.y = 0.55 + Math.sin(clock * 3) * 0.1;
          mesh.scale.set(0.92, 1.15, 0.92);
          mesh.rotation.x = -0.1;

          if (uData.leftLeg && uData.rightLeg) {
            uData.leftLeg.rotation.x = 0.7;
            uData.rightLeg.rotation.x = -0.5;
          }
          if (uData.leftArm && uData.rightArm) {
            uData.leftArm.rotation.x = -1.2;
            uData.rightArm.rotation.x = -0.8;
          }
        } else if (animMode === 'slide') {
          mesh.position.y = 0.0;
          mesh.scale.set(1.15, 0.48, 1.25);
          mesh.rotation.x = -0.45;
          if (uData.leftLeg && uData.rightLeg) {
            uData.leftLeg.rotation.x = 0.3;
            uData.rightLeg.rotation.x = 0.3;
          }
        } else if (animMode === 'stumble') {
          mesh.position.y = 0.05;
          mesh.scale.set(1, 1, 1);
          mesh.rotation.x = 0.35 + Math.sin(clock * 12) * 0.15;
          if (uData.leftArm && uData.rightArm) {
            uData.leftArm.rotation.z = 1.0;
            uData.rightArm.rotation.z = -1.0;
          }
        } else if (animMode === 'victory') {
          mesh.position.y = Math.abs(Math.sin(clock * 5)) * 0.2;
          mesh.scale.set(1, 1, 1);
          mesh.rotation.x = 0;
          if (uData.leftArm && uData.rightArm) {
            uData.leftArm.rotation.z = 2.4 + Math.sin(clock * 6) * 0.2;
            uData.rightArm.rotation.z = -2.4 - Math.sin(clock * 6) * 0.2;
          }
        } else {
          // Idle
          mesh.position.y = Math.sin(clock * 2) * 0.02;
          mesh.scale.set(1, 1, 1);
          mesh.rotation.x = 0;
          if (uData.leftLeg && uData.rightLeg) {
            uData.leftLeg.rotation.x = 0;
            uData.rightLeg.rotation.x = 0;
          }
          if (uData.leftArm && uData.rightArm) {
            uData.leftArm.rotation.x = Math.sin(clock * 2) * 0.05;
            uData.rightArm.rotation.x = -Math.sin(clock * 2) * 0.05;
          }
        }
      }

      renderer.render(scene, camera);
    }

    renderLoop();

    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D mesh when selected target changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, currentMesh } = sceneRef.current;

    if (currentMesh) {
      scene.remove(currentMesh);
    }

    let newMesh: THREE.Group;
    if (selectedTarget === 'officer') {
      newMesh = buildOfficerMesh();
    } else if (selectedTarget === 'buster') {
      newMesh = buildK9Mesh();
    } else {
      newMesh = buildRunnerMesh(selectedTarget);
    }

    newMesh.position.set(0, 0, 0);
    newMesh.rotation.y = Math.PI * 0.9;
    scene.add(newMesh);
    sceneRef.current.currentMesh = newMesh;
  }, [selectedTarget]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 text-slate-100">
      {/* 3D Turntable Stage */}
      <div className="flex-1 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              3D Low-Poly Model Turntable
            </h2>
          </div>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              autoRotate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            Auto Orbit
          </button>
        </div>

        {/* WebGL Canvas Container */}
        <div className="relative w-full h-[400px] md:h-[480px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Overlay hint */}
          <div className="absolute bottom-3 left-4 text-[11px] text-slate-400 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-800/80 pointer-events-none">
            Drag cursor to rotate 360° · Target: 1,400–1,800 tris
          </div>
        </div>

        {/* Animation State Selector Toolbar */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2">
          {(['run', 'jump', 'slide', 'stumble', 'idle', 'victory'] as AnimationMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAnimMode(mode)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                animMode === mode
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Character Dossier & Roster Picker */}
      <div className="w-full lg:w-[440px] flex flex-col gap-4">
        {/* Roster Grid */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Select Runner or Pursuer ({CHARACTERS.length + 2} Models)</span>
            <span className="text-cyan-400 font-mono">10 Runners + Police</span>
          </h3>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
            {CHARACTERS.map((char) => {
              const isSelected = selectedTarget === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => setSelectedTarget(char.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/50 ring-2 ring-cyan-500/30 text-white'
                      : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full mb-1 border border-white/20 shadow-sm"
                    style={{ backgroundColor: char.visualStyle.primaryColor }}
                  />
                  <span className="text-[11px] font-bold leading-tight truncate w-full">
                    {char.codename}
                  </span>
                  <span className="text-[9px] text-slate-400 truncate w-full">
                    {char.unlockType === 'starter' ? 'STARTER' : `${char.unlockThreshold}`}
                  </span>
                </button>
              );
            })}

            {/* Pursuers Buttons */}
            <button
              onClick={() => setSelectedTarget('officer')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                selectedTarget === 'officer'
                  ? 'border-blue-400 bg-blue-950/50 ring-2 ring-blue-500/30 text-white'
                  : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-400'
              }`}
            >
              <div className="w-5 h-5 rounded-full mb-1 bg-blue-600 border border-white/20 shadow-sm" />
              <span className="text-[11px] font-bold leading-tight truncate w-full">Higgins</span>
              <span className="text-[9px] text-blue-400 truncate w-full">PURSUER</span>
            </button>

            <button
              onClick={() => setSelectedTarget('buster')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                selectedTarget === 'buster'
                  ? 'border-amber-400 bg-amber-950/50 ring-2 ring-amber-500/30 text-white'
                  : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-400'
              }`}
            >
              <div className="w-5 h-5 rounded-full mb-1 bg-amber-600 border border-white/20 shadow-sm" />
              <span className="text-[11px] font-bold leading-tight truncate w-full">Buster</span>
              <span className="text-[9px] text-amber-400 truncate w-full">POLICE K9</span>
            </button>
          </div>
        </div>

        {/* Selected Dossier Card */}
        {selectedChar ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    #{selectedChar.id.toUpperCase()} · {selectedChar.archetype}
                  </span>
                  {selectedChar.unlockType === 'starter' && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      PLAYABLE NOW
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">{selectedChar.name}</h3>
                <p className="text-xs text-slate-400 italic">"{selectedChar.title}"</p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Tri-Count</span>
                <p className="font-mono font-bold text-cyan-300 text-sm">{selectedChar.triBudget} tris</p>
              </div>
            </div>

            {/* Perk Banner */}
            <div className="bg-cyan-950/40 border border-cyan-800/50 rounded-xl p-3 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-cyan-200">Runner Perk: </span>
                <span className="text-cyan-100">{selectedChar.perkDescription}</span>
              </div>
            </div>

            {/* Visual Specs breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Hair & Head</span>
                <span className="text-slate-200 font-medium">{selectedChar.visualStyle.hairStyle}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Upperwear</span>
                <span className="text-slate-200 font-medium">{selectedChar.visualStyle.upperWear}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Lowerwear</span>
                <span className="text-slate-200 font-medium">{selectedChar.visualStyle.lowerWear}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Footwear</span>
                <span className="text-slate-200 font-medium">{selectedChar.visualStyle.footwear}</span>
              </div>
            </div>

            {/* Lore */}
            <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
              {selectedChar.lore}
            </p>
          </div>
        ) : selectedTarget === 'officer' ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              <span>NPC Pursuer · Law Enforcement</span>
            </div>
            <h3 className="text-xl font-black text-white">Officer Higgins</h3>
            <p className="text-xs text-slate-300">
              The precinct's most determined transit officer. Equipped with a standard-issue duty belt, peaked cap, and nightstick.
            </p>
            <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-3 text-xs text-blue-200">
              <strong>Chase Role:</strong> Closes distance when the player stumbles. At Distance = 0, executes an apprehension tackle.
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              <span>NPC Pursuer · K9 Unit</span>
            </div>
            <h3 className="text-xl font-black text-white">Buster the K9</h3>
            <p className="text-xs text-slate-300">
              Loyal German Shepherd fitted with a police tactical harness. Agile and relentless, Buster bounds over low hurdles and alerts the player with rhythmic barking.
            </p>
            <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 text-xs text-amber-200">
              <strong>Chase Role:</strong> Automatically clears hurdles; initiates strike lunges when the distance lead drops under 35 units.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
