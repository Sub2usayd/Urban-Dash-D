import React from 'react';
import { GameMetrics, PowerUpType, BiomeId, CharacterId } from '../types/game';
import { BIOMES } from '../data/biomes';
import { CHARACTERS } from '../data/characters';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Coins,
  Gauge,
  Magnet,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface GameHUDProps {
  metrics: GameMetrics;
  isMuted: boolean;
  onToggleMute: () => void;
  onPauseToggle: () => void;
  onChangeBiome: (biomeId: BiomeId) => void;
  onChangeCharacter: (characterId: CharacterId) => void;
  onOpenGdd: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  metrics,
  isMuted,
  onToggleMute,
  onPauseToggle,
  onChangeBiome,
  onChangeCharacter,
  onOpenGdd,
}) => {
  const currentBiome = BIOMES.find((b) => b.id === metrics.biome) || BIOMES[0];
  const currentChar = CHARACTERS.find((c) => c.id === metrics.characterId) || CHARACTERS[0];

  // Threat level
  const isCriticalThreat = metrics.chaseDistance < 35;
  const isAlertThreat = metrics.chaseDistance >= 35 && metrics.chaseDistance < 70;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 md:p-6 overflow-hidden">
      {/* Critical Threat Screen Vignette (Pulsing Red) */}
      {isCriticalThreat && (
        <div className="absolute inset-0 border-[6px] md:border-[10px] border-rose-600/70 pointer-events-none animate-pulse shadow-[inset_0_0_80px_rgba(225,29,72,0.4)] transition-all duration-300" />
      )}

      {/* TOP BAR: Primary Stats, Pursuer Lead Gauge, Controls */}
      <div className="flex items-start justify-between gap-3 w-full max-w-6xl mx-auto z-10 pointer-events-auto">
        {/* Left Cluster: Score, Coins, Distance */}
        <div className="flex flex-col gap-2">
          {/* Main Score & Multiplier */}
          <div className="bg-slate-950/80 border border-slate-800/80 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block leading-none mb-1">
                Score
              </span>
              <span className="font-mono text-xl md:text-2xl font-black text-white tabular-nums tracking-tight">
                {metrics.score.toLocaleString()}
              </span>
            </div>
            {metrics.multiplier > 1 && (
              <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-md animate-bounce">
                {metrics.multiplier}X
              </span>
            )}
          </div>

          {/* Secondary readouts: Distance & Coins */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow">
              <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                {metrics.distance} m
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                {metrics.coins}
              </span>
            </div>
          </div>
        </div>

        {/* Center Cluster: Police & K9 Proximity Tension Gauge */}
        <div className="hidden sm:flex flex-col items-center max-w-[260px] w-full">
          <div
            className={`px-3 py-1 rounded-t-xl border-t border-x text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
              isCriticalThreat
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/60 animate-pulse'
                : isAlertThreat
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : 'bg-slate-950/80 text-cyan-300 border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>
              {isCriticalThreat ? 'CRITICAL: POLICE STRIKE RANGE' : isAlertThreat ? 'PURSUIT: ALERT' : 'PURSUIT LEAD: SAFE'}
            </span>
          </div>

          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-b-xl p-2 shadow-xl">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Higgins & Buster</span>
              <span className="font-bold text-white tabular-nums">{metrics.chaseDistance}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isCriticalThreat
                    ? 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                    : isAlertThreat
                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                }`}
                style={{ width: `${Math.max(5, metrics.chaseDistance)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Cluster: Active Biome, Mute, Pause, GDD */}
        <div className="flex items-center gap-2">
          {/* Biome Quick Selector */}
          <select
            value={metrics.biome}
            onChange={(e) => onChangeBiome(e.target.value as BiomeId)}
            className="bg-slate-950/80 border border-slate-800 text-xs text-cyan-300 px-2 py-1.5 rounded-xl font-bold focus:outline-none focus:border-cyan-500 cursor-pointer shadow"
          >
            {BIOMES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:bg-slate-800 text-slate-300 transition shadow"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPauseToggle}
            className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:bg-slate-800 text-slate-300 transition shadow"
            title="Pause Game (P or Esc)"
          >
            {metrics.isPaused ? <Play className="w-4 h-4 text-cyan-400" /> : <Pause className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* MOBILE TENSION GAUGE (visible on small mobile screens) */}
      <div className="sm:hidden w-full max-w-xs mx-auto mt-2 pointer-events-auto z-10">
        <div className="w-full bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 shadow-xl flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">CHASE:</span>
          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isCriticalThreat ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.max(5, metrics.chaseDistance)}%` }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-white shrink-0">{metrics.chaseDistance}%</span>
        </div>
      </div>

      {/* BOTTOM CONTROLS & ON-SCREEN TOUCH BUTTONS */}
      <div className="flex items-end justify-between w-full max-w-6xl mx-auto z-10">
        {/* Character & Current Runner Badge */}
        <div className="bg-slate-950/80 border border-slate-800/80 px-3 py-2 rounded-xl shadow-lg flex items-center gap-2.5 pointer-events-auto">
          <div
            className="w-4 h-4 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: currentChar.visualStyle.primaryColor }}
          />
          <div>
            <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block leading-none">
              Runner
            </span>
            <span className="text-xs font-bold text-white">{currentChar.name}</span>
          </div>
        </div>

        {/* On-Screen Mobile Touch Buttons (Essential for mobile users & touch testing!) */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Lane switch left/right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
              }}
              className="w-12 h-12 rounded-2xl bg-slate-950/85 hover:bg-slate-800 active:bg-cyan-500 active:text-slate-950 border border-slate-800 text-white flex items-center justify-center shadow-lg transition active:scale-95"
              aria-label="Move Lane Left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
              }}
              className="w-12 h-12 rounded-2xl bg-slate-950/85 hover:bg-slate-800 active:bg-cyan-500 active:text-slate-950 border border-slate-800 text-white flex items-center justify-center shadow-lg transition active:scale-95"
              aria-label="Move Lane Right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Jump / Slide vertical controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
              }}
              className="w-12 h-12 rounded-2xl bg-slate-950/85 hover:bg-slate-800 active:bg-emerald-500 active:text-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-center shadow-lg transition active:scale-95"
              aria-label="Jump Over Obstacle"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
              }}
              className="w-12 h-12 rounded-2xl bg-slate-950/85 hover:bg-slate-800 active:bg-blue-500 active:text-slate-950 border border-slate-800 text-blue-400 flex items-center justify-center shadow-lg transition active:scale-95"
              aria-label="Slide Under Obstacle"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
