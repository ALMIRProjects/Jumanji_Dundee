import { Leaf, Palmtree } from 'lucide-react';
import { audio } from '@/game/audio';

interface MenuScreenProps {
  onPlay: () => void;
  onOptions: () => void;
  bestScore: number;
}

export function MenuScreen({ onPlay, onOptions, bestScore }: MenuScreenProps) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-green-950 to-orange-950">
      {/* Animated jungle grid floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden opacity-25">
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(251,146,60,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.3)_1px,transparent_1px)] [background-size:40px_40px] [transform:perspective(300px)_rotateX(60deg)] [transform-origin:bottom] animate-[gridScroll_2s_linear_infinite]" />
      </div>

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating jungle leaves silhouettes */}
      <Leaf className="absolute top-10 left-5 text-green-500 opacity-25 animate-pulse" size={40} />
      <Leaf className="absolute top-20 right-8 text-green-400 opacity-20 animate-pulse" size={28} style={{ animationDelay: '0.5s' }} />
      <Palmtree className="absolute top-1/2 left-10 text-green-600 opacity-15" size={56} />

      <div className="relative z-10 flex flex-col items-center gap-7 px-6">
        {/* Title */}
        <div className="text-center">
          <p className="text-green-400/80 text-sm font-bold tracking-[0.3em] uppercase mb-1">
            Welcome to the
          </p>
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-600 tracking-tight drop-shadow-2xl">
            JUNGLE
          </h1>
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-600 tracking-tight drop-shadow-2xl -mt-2">
            RUNNER
          </h1>
          <div className="flex items-center gap-2 justify-center mt-2">
            <span className="h-px w-10 bg-amber-500/50" />
            <span className="text-amber-400/70 text-xs font-semibold tracking-[0.3em] uppercase">
              2.0
            </span>
            <span className="h-px w-10 bg-amber-500/50" />
          </div>
        </div>

        {/* Best score */}
        {bestScore > 0 && (
          <div className="px-5 py-1.5 bg-slate-900/60 backdrop-blur-sm rounded-full border border-amber-500/30">
            <span className="text-amber-400 text-sm font-bold">
              BEST: {bestScore.toLocaleString()}
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-64">
          <button
            onClick={() => {
              audio.resume();
              audio.play('start');
              onPlay();
            }}
            className="group relative px-8 py-4 bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xl rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
          >
            PLAY
            <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => {
              audio.play('click');
              onOptions();
            }}
            className="px-8 py-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold rounded-xl border border-slate-700/50 transition-all hover:scale-105 active:scale-95"
          >
            Options
          </button>
        </div>
      </div>

      <p className="absolute bottom-4 text-slate-500 text-xs">
        Swipe or arrow keys to play
      </p>

      <style>{`
        @keyframes gridScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
      `}</style>
    </div>
  );
}
