import React from 'react';
import { GameMetrics } from '../types/game';
import { AlertCircle, BookOpen, Play, RefreshCw, Sparkles, Trophy } from 'lucide-react';

interface GameOverModalProps {
  metrics: GameMetrics;
  onRestart: () => void;
  onSelectCharacter: () => void;
  onOpenGdd: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  metrics,
  onRestart,
  onSelectCharacter,
  onOpenGdd,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Top danger banner glow */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />

        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
          Apprehended!
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-xs">
          Officer Higgins & Buster the K9 closed the gap after an obstacle stumble.
        </p>

        {/* Primary Score Box */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-5 flex flex-col items-center">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
            Final Score
          </span>
          <span className="font-mono text-3xl md:text-4xl font-black text-cyan-300 tabular-nums">
            {metrics.score.toLocaleString()}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 w-full mb-6">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
              Distance
            </span>
            <span className="font-mono font-bold text-white text-sm">{metrics.distance} m</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
              Coins
            </span>
            <span className="font-mono font-bold text-amber-300 text-sm">{metrics.coins}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
              Top Speed
            </span>
            <span className="font-mono font-bold text-cyan-300 text-sm">{metrics.speed} m/s</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onRestart}
            data-start="true"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 stroke-[3]" />
            Try Again (Run)
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSelectCharacter}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Pick Runner
            </button>
            <button
              onClick={onOpenGdd}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Read GDD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSelectCharacter: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSelectCharacter,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-1">Paused</h2>
        <p className="text-xs text-slate-400 mb-6">Press P or Resume to continue your run</p>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Resume Run
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restart Run
          </button>
          <button
            onClick={onSelectCharacter}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Change Character
          </button>
        </div>
      </div>
    </div>
  );
};
