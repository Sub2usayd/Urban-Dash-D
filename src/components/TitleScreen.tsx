import React from 'react';
import { CharacterId, BiomeId } from '../types/game';
import { CHARACTERS } from '../data/characters';
import { BIOMES } from '../data/biomes';
import { BookOpen, Play, ShieldAlert, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenGdd: () => void;
  onInspectCharacters: () => void;
  onInspectBiomes: () => void;
  selectedCharacterId: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  selectedBiomeId: BiomeId;
  onSelectBiome: (id: BiomeId) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenGdd,
  onInspectCharacters,
  onInspectBiomes,
  selectedCharacterId,
  onSelectCharacter,
  selectedBiomeId,
  onSelectBiome,
  isMuted,
  onToggleMute,
}) => {
  const starter = CHARACTERS.find((c) => c.id === selectedCharacterId) || CHARACTERS[0];
  const biome = BIOMES.find((b) => b.id === selectedBiomeId) || BIOMES[0];

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 md:p-8 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent text-white select-none pointer-events-auto">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
            Android 3D Low-Poly Engine · 60 FPS Target
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center Title Lockup & Emblem */}
      <div className="flex flex-col items-center text-center my-auto max-w-2xl mx-auto">
        {/* Custom Inline SVG Badge Lockup */}
        <div className="mb-3 flex items-center justify-center">
          <svg className="w-16 h-16 drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]" viewBox="0 0 64 64" fill="none">
            <polygon points="32,4 60,18 60,46 32,60 4,46 4,18" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
            <path d="M22 20 L42 20 L44 32 L20 32 L22 44 L44 44" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="32" r="4" fill="#38bdf8" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 drop-shadow-lg">
          Urban Dash 3D
        </h1>
        <p className="text-xs sm:text-sm font-bold text-cyan-400 tracking-widest uppercase mt-1 mb-6">
          Endless Police & K9 Pursuit · Android Mobile
        </p>

        {/* Selected Starter Character Preview Pill */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-w-md w-full shadow-2xl flex items-center justify-between gap-3 text-left mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center shrink-0 shadow-md"
              style={{ backgroundColor: starter.visualStyle.primaryColor }}
            >
              <span className="font-mono font-black text-slate-950 text-sm">
                {starter.codename.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  {starter.unlockType === 'starter' ? 'STARTER RUNNER' : 'UNLOCKED'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white leading-tight">{starter.name}</h4>
              <p className="text-[11px] text-slate-400">{starter.perkDescription}</p>
            </div>
          </div>

          <button
            onClick={onInspectCharacters}
            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 border border-cyan-800/60 bg-cyan-950/40 px-2.5 py-1.5 rounded-lg shrink-0 transition"
          >
            Change
          </button>
        </div>

        {/* Primary Start CTA Button (data-start="true" for Ultra Mode tests) */}
        <button
          onClick={onStartGame}
          data-start="true"
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-base uppercase tracking-wider shadow-2xl shadow-cyan-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Start Pursuit (Space / Tap)</span>
        </button>

        {/* Secondary Action Links */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={onOpenGdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Game Design Document
          </button>
          <button
            onClick={onInspectCharacters}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            10 Runners 3D
          </button>
          <button
            onClick={onInspectBiomes}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            7 Biomes
          </button>
        </div>
      </div>

      {/* Flat borderless control hint footer */}
      <div className="text-center text-xs text-slate-400 font-mono tracking-wider">
        Swipe / WASD / Arrow Keys: Move Lanes · Jump · Slide Under Obstacles · Esc Pause
      </div>
    </div>
  );
};
