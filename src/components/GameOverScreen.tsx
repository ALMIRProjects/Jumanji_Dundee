import { useState, useEffect } from 'react';
import type { RunResult, HighScoreEntry, CharacterDef } from '@/game/types';
import { CHARACTERS } from '@/game/types';
import { submitScore, getTopScores } from '@/lib/supabase';
import { audio } from '@/game/audio';
import { CharacterPortrait } from '@/components/CharacterPortrait';

interface GameOverScreenProps {
  result: RunResult;
  bestScore: number;
  isNewBest: boolean;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ result, bestScore, isNewBest, onRetry, onMenu }: GameOverScreenProps) {
  const [name, setName] = useState(() => localStorage.getItem('ringrunner_name') || 'Player');
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [showBoard, setShowBoard] = useState(false);

  const char = CHARACTERS.find((c) => c.id === result.characterId);

  useEffect(() => {
    if (!submitted) {
      const entryName = name.trim() || 'Player';
      localStorage.setItem('ringrunner_name', entryName);
      submitScore({
        player_name: entryName,
        score: result.score,
        distance: result.distance,
        character_id: result.characterId,
      }).then(() => {
        setSubmitted(true);
        loadBoard();
      });
    }
  }, []);

  const loadBoard = async () => {
    setLoadingBoard(true);
    const board = await getTopScores(8);
    setLeaderboard(board);
    setLoadingBoard(false);
  };

  useEffect(() => {
    const t = setTimeout(() => setShowBoard(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-slate-950 via-red-950/40 to-slate-950 overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6 max-w-md mx-auto w-full">
        {/* Title */}
        <div className="text-center">
          {isNewBest ? (
            <>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-orange-500">
                NEW RECORD!
              </h1>
              <p className="text-amber-400/70 text-sm mt-1">You beat your best score</p>
            </>
          ) : (
            <h1 className="text-5xl font-black text-red-500">GAME OVER</h1>
          )}
        </div>

        {/* Character badge */}
        {char && (
          <div className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-slate-900/60 rounded-full border border-slate-700/50">
            <CharacterPortrait character={char} size={40} />
            <span className="text-slate-300 font-semibold text-sm">{char.name}</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="w-full grid grid-cols-2 gap-3">
          <StatCard label="SCORE" value={result.score.toLocaleString()} color="text-amber-400" big />
          <StatCard label="DISTANCE" value={`${result.distance}m`} color="text-cyan-400" big />
          <StatCard label="RINGS" value={String(result.rings)} color="text-amber-300" />
          <StatCard label="MAX COMBO" value={`${result.maxCombo}x`} color="text-orange-400" />
          <StatCard label="TOP SPEED" value={result.topSpeed} color="text-green-400" />
          <StatCard label="BEST" value={bestScore.toLocaleString()} color="text-slate-300" />
        </div>

        {/* Leaderboard */}
        {showBoard && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-200 font-bold text-sm">LEADERBOARD</h3>
              <button
                onClick={() => { audio.play('click'); loadBoard(); }}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Refresh
              </button>
            </div>
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
              {loadingBoard ? (
                <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
              ) : leaderboard.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">No scores yet</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {leaderboard.map((entry, i) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between px-3 py-2 ${
                        entry.score === result.score ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm w-5 ${
                          i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-700' : 'text-slate-600'
                        }`}>
                          {i + 1}
                        </span>
                        <span className="text-slate-300 text-sm font-semibold truncate max-w-[100px]">
                          {entry.player_name}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[80px]">
                          {CHARACTERS.find((c) => c.id === entry.character_id)?.name ?? ''}
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold text-sm tabular-nums">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => { audio.play('start'); onRetry(); }}
            className="w-full px-8 py-4 bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-lg rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
          >
            RUN AGAIN
          </button>
          <button
            onClick={() => { audio.play('click'); onMenu(); }}
            className="w-full px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, big }: { label: string; value: string | number; color: string; big?: boolean }) {
  return (
    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
      <p className="text-slate-500 text-xs font-bold tracking-wider">{label}</p>
      <p className={`${color} ${big ? 'text-2xl' : 'text-lg'} font-black tabular-nums`}>
        {value}
      </p>
    </div>
  );
}
