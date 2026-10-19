import React, { useState, useEffect, useCallback } from 'react';
import { CharacterId, BiomeId, GameMetrics } from './types/game';
import { CHARACTERS } from './data/characters';
import { BIOMES } from './data/biomes';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal, PauseModal } from './components/StatusModals';
import { GddDocument } from './components/GddDocument';
import { CharacterViewer3D } from './components/CharacterViewer3D';
import { BiomeViewer3D } from './components/BiomeViewer3D';
import { AndroidFrame } from './components/AndroidFrame';
import { soundEngine } from './audio/soundEngine';
import { BookOpen, Gamepad2, Layers, Smartphone, Sparkles } from 'lucide-react';

type AppTab = 'game' | 'gdd' | 'characters' | 'biomes';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('game');
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('malik');
  const [selectedBiomeId, setSelectedBiomeId] = useState<BiomeId>('city');
  const [isMuted, setIsMuted] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // High score & persistent coins
  const [totalCoins, setTotalCoins] = useState(() => {
    const saved = localStorage.getItem('urbandash_coins');
    return saved ? parseInt(saved, 10) : 150;
  });
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('urbandash_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Current run live metrics
  const [runMetrics, setRunMetrics] = useState<GameMetrics>({
    distance: 0,
    coins: 0,
    score: 0,
    speed: 12,
    chaseDistance: 85,
    multiplier: 1,
    biome: 'city',
    characterId: 'malik',
    stumbledCount: 0,
    isGameOver: false,
    isPaused: false,
  });

  // Synchronize document.body.dataset.state with game state (Ultra Mode requirement)
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Support ?autostart=1 query parameter to jump straight to 'playing'
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      handleStartGame();
    }
  }, []);

  // Keyboard navigation for Start (Space / Enter), Pause (Escape / P)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (gameState === 'title' && activeTab === 'game') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleStartGame();
        }
      } else if (gameState === 'playing' && activeTab === 'game') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          handleTogglePause();
        }
      } else if (gameState === 'paused' && activeTab === 'game') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          handleResume();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeTab]);

  const handleStartGame = useCallback(() => {
    setGameState('playing');
    setRunMetrics((prev) => ({
      ...prev,
      distance: 0,
      coins: 0,
      score: 0,
      speed: 12,
      chaseDistance: 85,
      multiplier: 1,
      biome: selectedBiomeId,
      characterId: selectedCharacterId,
      stumbledCount: 0,
      isGameOver: false,
      isPaused: false,
    }));

    if (!isMuted) {
      const biomeData = BIOMES.find((b) => b.id === selectedBiomeId);
      soundEngine.startMusic(biomeData?.audioTheme.tempoBpm || 128);
    }
  }, [selectedBiomeId, selectedCharacterId, isMuted]);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      const next = prev === 'playing' ? 'paused' : 'playing';
      if (next === 'paused') {
        soundEngine.stopMusic();
      } else if (!isMuted) {
        soundEngine.startMusic();
      }
      return next;
    });
  }, [isMuted]);

  const handleResume = useCallback(() => {
    setGameState('playing');
    if (!isMuted) {
      soundEngine.startMusic();
    }
  }, [isMuted]);

  const handleGameOver = useCallback((finalMetrics: GameMetrics) => {
    setGameState('gameover');
    soundEngine.stopMusic();

    setRunMetrics(finalMetrics);
    setTotalCoins((prev) => {
      const updated = prev + finalMetrics.coins;
      localStorage.setItem('urbandash_coins', updated.toString());
      return updated;
    });
    setHighScore((prev) => {
      const updated = Math.max(prev, finalMetrics.score);
      localStorage.setItem('urbandash_highscore', updated.toString());
      return updated;
    });
  }, []);

  const handleUpdateMetrics = useCallback((updates: Partial<GameMetrics>) => {
    setRunMetrics((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      if (next) {
        soundEngine.stopMusic();
      } else if (gameState === 'playing') {
        soundEngine.startMusic();
      }
      return next;
    });
  }, [gameState]);

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Mode Switcher Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur z-40 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <span className="font-mono font-black text-slate-950 text-sm">UD</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 leading-none">
              <span>Urban Dash 3D</span>
              <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Android GDD & 3D Runner
              </span>
            </h1>
          </div>
        </div>

        {/* Navigation Tabs & Android Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('game')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'game'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>3D Runner</span>
            </button>

            <button
              onClick={() => setActiveTab('gdd')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'gdd'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>GDD Specs</span>
            </button>

            <button
              onClick={() => setActiveTab('characters')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'characters'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>10 Characters</span>
            </button>

            <button
              onClick={() => setActiveTab('biomes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'biomes'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>7 Biomes</span>
            </button>
          </nav>

          {/* Performance Chip & Android Device Frame Toggle */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-400">60 FPS</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300 font-mono">12k tris</span>
            </div>

            {activeTab === 'game' && (
              <button
                onClick={() => setIsPhoneFrame(!isPhoneFrame)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  isPhoneFrame
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle Android Device Frame Simulation"
              >
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">{isPhoneFrame ? 'Desktop View' : 'Android Frame'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col">
        {activeTab === 'game' && (
          <AndroidFrame
            isPhoneFrame={isPhoneFrame}
            onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
            fps={60}
            triCount={12400}
            drawCalls={24}
          >
            <div className="relative w-full h-full overflow-hidden bg-slate-950">
              {/* WebGL 3D Canvas */}
              <GameCanvas
                characterId={selectedCharacterId}
                biomeId={selectedBiomeId}
                isPlaying={gameState === 'playing'}
                isPaused={gameState === 'paused'}
                onGameOver={handleGameOver}
                onUpdateMetrics={handleUpdateMetrics}
              />

              {/* Title Screen Overlay */}
              {gameState === 'title' && (
                <TitleScreen
                  onStartGame={handleStartGame}
                  onOpenGdd={() => setActiveTab('gdd')}
                  onInspectCharacters={() => setActiveTab('characters')}
                  onInspectBiomes={() => setActiveTab('biomes')}
                  selectedCharacterId={selectedCharacterId}
                  onSelectCharacter={setSelectedCharacterId}
                  selectedBiomeId={selectedBiomeId}
                  onSelectBiome={setSelectedBiomeId}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                />
              )}

              {/* Active Gameplay HUD */}
              {(gameState === 'playing' || gameState === 'paused') && (
                <GameHUD
                  metrics={runMetrics}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                  onPauseToggle={handleTogglePause}
                  onChangeBiome={(bId) => {
                    setSelectedBiomeId(bId);
                    setRunMetrics((m) => ({ ...m, biome: bId }));
                  }}
                  onChangeCharacter={(cId) => {
                    setSelectedCharacterId(cId);
                    setRunMetrics((m) => ({ ...m, characterId: cId }));
                  }}
                  onOpenGdd={() => setActiveTab('gdd')}
                />
              )}

              {/* Status Modals */}
              {gameState === 'paused' && (
                <PauseModal
                  onResume={handleResume}
                  onRestart={handleStartGame}
                  onSelectCharacter={() => setActiveTab('characters')}
                />
              )}

              {gameState === 'gameover' && (
                <GameOverModal
                  metrics={runMetrics}
                  onRestart={handleStartGame}
                  onSelectCharacter={() => setActiveTab('characters')}
                  onOpenGdd={() => setActiveTab('gdd')}
                />
              )}
            </div>
          </AndroidFrame>
        )}

        {activeTab === 'gdd' && (
          <div className="w-full h-full overflow-y-auto">
            <GddDocument
              onPlayGame={() => {
                setActiveTab('game');
                handleStartGame();
              }}
              onInspectCharacters={() => setActiveTab('characters')}
            />
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="w-full h-full overflow-y-auto">
            <CharacterViewer3D />
          </div>
        )}

        {activeTab === 'biomes' && (
          <div className="w-full h-full overflow-y-auto">
            <BiomeViewer3D />
          </div>
        )}
      </main>
    </div>
  );
}
