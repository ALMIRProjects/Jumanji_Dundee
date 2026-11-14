import { ArrowLeft, CircleDot, Gem, OctagonX, Mountain, Beef, Zap, Sparkles } from 'lucide-react';
import { audio } from '@/game/audio';
import type { CharacterDef } from '@/game/types';
import { CharacterPortrait } from '@/components/CharacterPortrait';

interface InstructionsScreenProps {
  character: CharacterDef;
  onStart: () => void;
  onBack: () => void;
}

const RULES = [
  { icon: CircleDot, color: 'text-amber-400', title: 'Collect Rings', text: 'Grab gold rings for points. Chain them for combo multipliers.' },
  { icon: OctagonX, color: 'text-red-400', title: 'Avoid Spiked Balls', text: 'Jump over them or switch lanes. Three hits and the run ends.' },
  { icon: Mountain, color: 'text-stone-300', title: 'Dodge Boulders', text: 'Rolling boulders must be sidestepped. Jumping will not save you.' },
  { icon: Beef, color: 'text-slate-300', title: 'Survive Stampedes', text: 'Rhinos thunder across all lanes. Find the single gap with rings.' },
  { icon: Gem, color: 'text-cyan-400', title: 'Grab Power-ups', text: 'Magnet, Shield, x2 Score and Boost appear on the track.' },
];

export function InstructionsScreen({ character, onStart, onBack }: InstructionsScreenProps) {
  const ability = character.ability;
  const AbilityIcon = ability.kind === 'active' ? Zap : Sparkles;

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-slate-950 via-green-950 to-slate-950 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={() => { audio.play('click'); onBack(); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-semibold transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-white">HOW TO PLAY</h2>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-5 px-6 py-2 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/60 rounded-2xl border border-slate-700/50 w-full">
            <CharacterPortrait character={character} size={64} />
            <div className="min-w-0">
              <p className="text-white font-bold">{character.name}</p>
              <div className="flex items-center gap-1.5 mt-1" style={{ color: character.color }}>
                <AbilityIcon size={14} />
                <span className="text-xs font-semibold">{ability.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {ability.kind === 'active' ? 'Active' : 'Passive'}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">{ability.description}</p>
            </div>
          </div>

          <div className="w-full space-y-3">
            {RULES.map(({ icon: Icon, color, title, text }) => (
              <div key={title} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center">
                  <Icon size={20} className={color} />
                </div>
                <div>
                  <p className={`${color} font-bold`}>{title}</p>
                  <p className="text-slate-400 text-sm">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
              <p className="text-slate-200 font-bold text-sm">Mobile</p>
              <p className="text-slate-400 text-xs mt-1">Swipe left or right to switch<br />Swipe up to jump<br />Tap the ability button</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
              <p className="text-slate-200 font-bold text-sm">Keyboard</p>
              <p className="text-slate-400 text-xs mt-1">A / D or arrows to switch<br />W / Space to jump<br />E or Shift for ability</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 p-6 flex justify-center">
        <button
          onClick={() => { audio.play('start'); onStart(); }}
          className="px-12 py-4 bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xl rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
        >
          ENTER JUNGLE
        </button>
      </div>
    </div>
  );
}
