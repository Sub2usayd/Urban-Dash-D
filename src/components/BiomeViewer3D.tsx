import React, { useState } from 'react';
import { BiomeId } from '../types/game';
import { BIOMES } from '../data/biomes';
import { MapPin, Music, ShieldAlert, Sparkles, SunMedium, Wind } from 'lucide-react';

export const BiomeViewer3D: React.FC = () => {
  const [selectedBiomeId, setSelectedBiomeId] = useState<BiomeId>('city');
  const biome = BIOMES.find((b) => b.id === selectedBiomeId) || BIOMES[0];

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 text-slate-100">
      {/* Biome Selection & Hero Card */}
      <div className="w-full lg:w-[380px] flex flex-col gap-4 shrink-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>The 7 Distinct Biomes</span>
            <span className="text-cyan-400 font-mono">7 Maps</span>
          </h2>

          <div className="flex flex-col gap-2">
            {BIOMES.map((b) => {
              const isSelected = selectedBiomeId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBiomeId(b.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-950/30'
                      : 'border-slate-800/80 bg-slate-800/40 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: b.visualAtmosphere.accentGlow }}
                    />
                    <div>
                      <h4 className="text-sm font-bold leading-tight text-slate-200">{b.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{b.tagline}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {b.audioTheme.tempoBpm} BPM
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Signature Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            <Music className="w-4 h-4" />
            <span>Audio & Music Theme</span>
          </div>
          <div>
            <h4 className="text-base font-bold text-white">{biome.audioTheme.genre}</h4>
            <p className="text-xs text-cyan-300 font-mono mt-0.5">{biome.audioTheme.tempoBpm} BPM Pace</p>
          </div>
          <div className="text-xs text-slate-300 space-y-1.5 border-t border-slate-800/80 pt-2">
            <p>
              <strong className="text-slate-200">Instruments: </strong>
              {biome.audioTheme.instruments}
            </p>
            <p>
              <strong className="text-slate-200">Ambience: </strong>
              {biome.audioTheme.ambienceNotes}
            </p>
          </div>
        </div>
      </div>

      {/* Main Biome Deep-Dive Details */}
      <div className="flex-1 flex flex-col gap-5">
        {/* Atmosphere Header Banner */}
        <div
          className="rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px]"
          style={{
            background: `linear-gradient(135deg, ${biome.visualAtmosphere.skyColor} 0%, ${biome.visualAtmosphere.groundColor} 100%)`,
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 mb-2">
              <MapPin className="w-4 h-4" />
              <span>Biome Dossier · {biome.id.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{biome.name}</h2>
            <p className="text-sm text-slate-200 font-medium max-w-2xl mt-1">{biome.description}</p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs font-mono mt-4 pt-3 border-t border-white/10 text-slate-200">
            <span>Time: {biome.visualAtmosphere.timeOfDay}</span>
            <span>Weather: {biome.visualAtmosphere.weatherEffect || 'None'}</span>
            <span>Fog Density: {biome.visualAtmosphere.fogDensity}</span>
          </div>

          {/* Accent glow orb */}
          <div
            className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: biome.visualAtmosphere.accentGlow }}
          />
        </div>

        {/* Color Palette Swatches */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <SunMedium className="w-4 h-4 text-amber-400" />
            <span>Strict Low-Poly Palette & Lighting Register</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
                style={{ backgroundColor: biome.visualAtmosphere.skyColor }}
              />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sky Color</span>
                <span className="font-mono text-slate-200">{biome.visualAtmosphere.skyColor}</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
                style={{ backgroundColor: biome.visualAtmosphere.fogColor }}
              />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Horizon Fog</span>
                <span className="font-mono text-slate-200">{biome.visualAtmosphere.fogColor}</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
                style={{ backgroundColor: biome.visualAtmosphere.groundColor }}
              />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Road / Surface</span>
                <span className="font-mono text-slate-200">{biome.visualAtmosphere.groundColor}</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
                style={{ backgroundColor: biome.visualAtmosphere.accentGlow }}
              />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Accent Glow</span>
                <span className="font-mono text-slate-200">{biome.visualAtmosphere.accentGlow}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Obstacle Kit Gallery */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Thematic Obstacle Kit & Player Verbs ({biome.obstacles.length} Types)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">React Window $\ge 0.38s$</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {biome.obstacles.map((obs) => {
              const badgeColor =
                obs.actionRequired === 'jump'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : obs.actionRequired === 'slide'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

              return (
                <div
                  key={obs.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{obs.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}
                      >
                        {obs.actionRequired}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{obs.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-400 font-mono">
                    <span>Category: {obs.type}</span>
                    <span>Poly Budget: ~{obs.polyCount} tris</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Environmental Props */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span>3D Low-Poly World Props (Instanced Assets)</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {biome.keyProps.map((prop, idx) => (
              <span
                key={idx}
                className="bg-slate-950/80 border border-slate-800/80 text-xs px-3 py-1.5 rounded-lg text-slate-300"
              >
                • {prop}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
