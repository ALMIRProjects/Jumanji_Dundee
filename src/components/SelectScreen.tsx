import { useState } from 'react';
import { ArrowLeft, Lock, Zap, Sparkles } from 'lucide-react';
import { CHARACTERS, isCharacterUnlocked, type CharacterDef } from '@/game/types';
import { audio } from '@/game/audio';
import { CharacterPortrait } from '@/components/CharacterPortrait';

interface SelectScreenProps {
  onSelect: (char: CharacterDef) => void;
  onBack: () => void;
  bestScore: number;
}

export function SelectScreen({ onSelect, onBack, bestScore }: SelectScreenProps) {
  const [selected, setSelected] = useState(0);
  const current = CHARACTERS[selected];
  const currentUnlocked = isCharacterUnlocked(current, bestScore);

  const handleSelect = (i: number) => {
    if (!isCharacterUnlocked(CHARACTERS[i], bestScore)) {
      audio.play('hit');
      return;
    }
    setSelected(i);
    audio.play('click');
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-slate-950 via-green-950 to-slate-950 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={() => { audio.play('click'); onBack(); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-semibold transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-white">SELECT RUNNER</h2>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-4 overflow-y-auto py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 max-w-3xl w-full">
          {CHARACTERS.map((char, i) => {
            const unlocked = isCharacterUnlocked(char, bestScore);
            const isSelected = selected === i;
            return (
              <button
                key={char.id}
                onClick={() => handleSelect(i)}
                aria-disabled={!unlocked}
                className={`group relative flex flex-col items-center gap-2 p-3 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${
                  isSelected && unlocked
                    ? 'bg-slate-800/80 scale-105'
                    : unlocked
                    ? 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:-translate-y-1'
                    : 'bg-slate-900/30 border-slate-800/50'
                }`}
                style={
                  isSelected && unlocked
                    ? { borderColor: char.color, boxShadow: `0 0 30px ${char.color}40` }
                    : undefined
                }
              >
                {unlocked ? (
                  <>
                    <CharacterPortrait character={char} size={96} />
                    <span className="font-black text-sm sm:text-base text-center" style={{ color: char.color }}>
                      {char.name}
                    </span>
                    <span className="text-[11px] text-slate-400 text-center">{char.role}</span>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full flex items-center justify-center bg-slate-800/50 border-2 border-slate-700">
                      <Lock size={28} className="text-slate-500" />
                    </div>
                    <span className="font-black text-sm sm:text-base text-slate-500 text-center">{char.name}</span>
                    <span className="text-[10px] text-slate-600 text-center">Score 5,000 to unlock</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div
          className="w-full max-w-xl p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row gap-4 items-center sm:items-start"
          style={{ borderColor: currentUnlocked ? `${current.color}60` : undefined }}
        >
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-slate-100 font-bold">{current.name}</p>
            <p className="text-slate-400 text-sm mt-1">{current.blurb}</p>
          </div>
          {currentUnlocked ? (
            <div className="shrink-0 w-full sm:w-56 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                {current.ability.kind === 'active' ? (
                  <Zap size={16} style={{ color: current.color }} />
                ) : (
                  <Sparkles size={16} style={{ color: current.color }} />
                )}
                <span className="text-sm font-bold text-slate-100">{current.ability.name}</span>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {current.ability.kind === 'active' ? 'Active' : 'Passive'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{current.ability.description}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Reach 5,000 points in a run to unlock this runner.</p>
          )}
        </div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 flex justify-center">
        <button
          onClick={() => { audio.play('start'); onSelect(current); }}
          disabled={!currentUnlocked}
          className={`px-12 py-4 font-black text-xl rounded-xl transition-all ${
            currentUnlocked
              ? 'bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {currentUnlocked ? 'ENTER JUNGLE' : 'LOCKED'}
        </button>
      </div>
    </div>
  );
}
