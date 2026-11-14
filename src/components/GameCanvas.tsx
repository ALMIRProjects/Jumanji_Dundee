import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/game/engine';
import type { CharacterDef, RunResult } from '@/game/types';
import type { HudSnapshot, PowerType } from '@/game/state';
import { audio } from '@/game/audio';

interface GameCanvasProps {
  character: CharacterDef;
  speedSetting: number;
  onGameOver: (result: RunResult) => void;
  onExit: () => void;
}

const EMPTY_HUD: HudSnapshot = {
  score: 0,
  rings: 0,
  distance: 0,
  combo: 0,
  lives: 3,
  powers: [],
  abilityReady: true,
  abilityProgress: 1,
};

const POWER_STYLE: Record<PowerType, { name: string; text: string; bar: string }> = {
  magnet: { name: 'Magnet', text: 'text-cyan-300', bar: 'bg-cyan-400' },
  shield: { name: 'Shield', text: 'text-green-300', bar: 'bg-green-400' },
  multiplier: { name: 'x2 Score', text: 'text-amber-300', bar: 'bg-amber-400' },
  boost: { name: 'Boost', text: 'text-orange-300', bar: 'bg-orange-400' },
};

export function GameCanvas({ character, speedSetting, onGameOver, onExit }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const [hud, setHud] = useState<HudSnapshot>(EMPTY_HUD);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, character, speedSetting, {
      onGameOver: (result) => onGameOverRef.current(result),
      onHud: setHud,
    });
    engineRef.current = engine;
    engine.start();
    audio.resume();
    audio.startMusic();

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.stop();
      audio.stopMusic();
      engineRef.current = null;
    };
  }, [character, speedSetting]);

  const togglePause = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) engine.resume();
    else engine.pause();
    setPaused(!paused);
    audio.play('click');
  };

  const ability = character.ability;
  const cooldownLeft = Math.ceil((1 - hud.abilityProgress) * ability.cooldown);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 touch-none select-none">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      <style>{`@keyframes combo-pop{0%{transform:scale(1.6)}60%{transform:scale(0.92)}100%{transform:scale(1)}}.combo-pop{animation:combo-pop 0.35s ease-out}`}</style>

      <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col gap-1.5">
          <div className="px-3 py-1.5 bg-slate-900/70 backdrop-blur-sm rounded-lg border border-amber-700/40">
            <span className="text-amber-400 font-bold text-xl sm:text-2xl tabular-nums">
              {hud.score.toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 px-2 py-1 bg-slate-900/60 backdrop-blur-sm rounded">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${i < hud.lives ? 'bg-red-500' : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <span className="px-2 py-0.5 bg-slate-900/60 backdrop-blur-sm rounded text-xs text-slate-300 tabular-nums">
              {hud.distance}m
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 backdrop-blur-sm rounded text-xs text-amber-300 tabular-nums">
              {hud.rings} rings
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={togglePause}
            className="p-2 bg-slate-900/70 backdrop-blur-sm rounded-lg text-slate-200 border border-slate-700/50 hover:bg-slate-800/80 transition-colors pointer-events-auto"
            aria-label="Pause"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
          {hud.combo > 1 && (
            <div key={hud.combo} className="combo-pop px-3 py-1 bg-orange-500/80 backdrop-blur-sm rounded-lg">
              <span className="text-white font-black text-base sm:text-lg tabular-nums">{hud.combo}x COMBO</span>
            </div>
          )}
          {hud.powers.map((p) => {
            const style = POWER_STYLE[p.type];
            return (
              <div
                key={p.type}
                className="flex items-center gap-2 px-2 py-1 bg-slate-900/70 backdrop-blur-sm rounded-lg border border-slate-700/50 min-w-[96px]"
              >
                <span className={`text-xs font-bold ${style.text}`}>{style.name}</span>
                <div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${style.bar}`}
                    style={{ width: `${(p.remaining / p.total) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => {
          audio.play('click');
          onExit();
        }}
        className="absolute bottom-4 left-4 z-20 px-3 py-2 bg-slate-900/70 backdrop-blur-sm rounded-lg text-slate-200 text-sm font-semibold border border-slate-700/50 hover:bg-slate-800/80 transition-colors"
      >
        Quit
      </button>

      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
        <span className="text-[11px] text-slate-200 bg-slate-900/70 px-2 py-1 rounded">
          {ability.kind === 'active' ? `${ability.name} (E / Shift)` : `Passive: ${ability.name}`}
        </span>
        {ability.kind === 'active' && (
          <button
            onClick={() => engineRef.current?.triggerAbility()}
            disabled={!hud.abilityReady}
            aria-label={ability.name}
            className="pointer-events-auto relative w-16 h-16 rounded-full p-1 transition-transform active:scale-90 disabled:cursor-default"
            style={{
              background: `conic-gradient(${character.color} ${hud.abilityProgress * 360}deg, #1e293b 0deg)`,
            }}
          >
            <span
              className={`flex w-full h-full rounded-full items-center justify-center text-xs font-black ${
                hud.abilityReady ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hud.abilityReady ? 'READY' : `${cooldownLeft}s`}
            </span>
          </button>
        )}
      </div>

      {paused && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-6">PAUSED</h2>
            <button
              onClick={togglePause}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-lg transition-colors mb-3 block mx-auto"
            >
              Resume
            </button>
            <button
              onClick={() => {
                audio.play('click');
                onExit();
              }}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors block mx-auto"
            >
              Quit to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
