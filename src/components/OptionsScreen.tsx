import { audio } from '@/game/audio';

interface OptionsScreenProps {
  speedSetting: number;
  onSpeedChange: (v: number) => void;
  muted: boolean;
  onMutedChange: (v: boolean) => void;
  sfxVolume: number;
  onSfxVolumeChange: (v: number) => void;
  musicVolume: number;
  onMusicVolumeChange: (v: number) => void;
  onBack: () => void;
}

export function OptionsScreen({
  speedSetting,
  onSpeedChange,
  muted,
  onMutedChange,
  sfxVolume,
  onSfxVolumeChange,
  musicVolume,
  onMusicVolumeChange,
  onBack,
}: OptionsScreenProps) {
  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-b from-slate-950 via-green-950 to-slate-950 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-green-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={() => { audio.play('click'); onBack(); }}
          className="text-slate-400 hover:text-slate-200 font-semibold transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-white">OPTIONS</h2>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-8 max-w-md mx-auto w-full">
        {/* Speed setting */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <label className="text-slate-200 font-bold text-lg">Game Speed</label>
            <span className="text-amber-400 font-black text-2xl tabular-nums">
              {speedSetting}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                onClick={() => {
                  audio.play('click');
                  onSpeedChange(v);
                }}
                className={`flex-1 h-12 rounded-lg font-bold text-sm transition-all ${
                  v <= speedSetting
                    ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950'
                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-slate-500">
            <span>Chill</span>
            <span>Insane</span>
          </div>
        </div>

        {/* Audio toggle */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <label className="text-slate-200 font-bold text-lg">Sound</label>
            <button
              onClick={() => {
                onMutedChange(!muted);
                if (muted) audio.play('click');
              }}
              className={`px-5 py-2 rounded-lg font-bold transition-colors ${
                muted
                  ? 'bg-slate-800 text-slate-500'
                  : 'bg-green-600/80 text-white'
              }`}
            >
              {muted ? 'MUTED' : 'ON'}
            </button>
          </div>
        </div>

        {/* SFX volume */}
        <div className={`w-full transition-opacity ${muted ? 'opacity-30 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-200 font-bold">SFX Volume</label>
            <span className="text-slate-400 text-sm tabular-nums">
              {Math.round(sfxVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(sfxVolume * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              onSfxVolumeChange(v);
              audio.setSfxVolume(v);
            }}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Music volume */}
        <div className={`w-full transition-opacity ${muted ? 'opacity-30 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-200 font-bold">Music Volume</label>
            <span className="text-slate-400 text-sm tabular-nums">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(musicVolume * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              onMusicVolumeChange(v);
              audio.setMusicVolume(v);
            }}
            className="w-full accent-amber-500"
          />
        </div>
      </div>

      <div className="relative z-10 p-6" />
    </div>
  );
}
