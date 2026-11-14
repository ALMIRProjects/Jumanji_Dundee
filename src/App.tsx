import { useState, useEffect, useCallback } from 'react';
import type { GameScreen, CharacterDef, RunResult } from '@/game/types';
import { CHARACTERS } from '@/game/types';
import { audio } from '@/game/audio';
import { MenuScreen } from '@/components/MenuScreen';
import { OptionsScreen } from '@/components/OptionsScreen';
import { SelectScreen } from '@/components/SelectScreen';
import { InstructionsScreen } from '@/components/InstructionsScreen';
import { GameCanvas } from '@/components/GameCanvas';
import { GameOverScreen } from '@/components/GameOverScreen';

const LS_KEYS = {
  best: 'ringrunner_best',
  speed: 'ringrunner_speed',
  muted: 'ringrunner_muted',
  sfxVol: 'ringrunner_sfxvol',
  musicVol: 'ringrunner_musicvol',
};

function loadNum(key: string, fallback: number): number {
  const v = localStorage.getItem(key);
  return v !== null ? Number(v) : fallback;
}
function loadBool(key: string, fallback: boolean): boolean {
  const v = localStorage.getItem(key);
  return v !== null ? v === 'true' : fallback;
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [transition, setTransition] = useState<'in' | 'out'>('in');
  const [character, setCharacter] = useState<CharacterDef>(CHARACTERS[0]);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const [bestScore, setBestScore] = useState(() => loadNum(LS_KEYS.best, 0));
  const [speedSetting, setSpeedSetting] = useState(() => loadNum(LS_KEYS.speed, 5));
  const [muted, setMuted] = useState(() => loadBool(LS_KEYS.muted, false));
  const [sfxVolume, setSfxVolume] = useState(() => loadNum(LS_KEYS.sfxVol, 0.5));
  const [musicVolume, setMusicVolume] = useState(() => loadNum(LS_KEYS.musicVol, 0.22));

  useEffect(() => {
    audio.setMuted(muted);
    audio.setSfxVolume(sfxVolume);
    audio.setMusicVolume(musicVolume);
  }, []); // eslint-disable-line

  useEffect(() => { localStorage.setItem(LS_KEYS.best, String(bestScore)); }, [bestScore]);
  useEffect(() => { localStorage.setItem(LS_KEYS.speed, String(speedSetting)); }, [speedSetting]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.muted, String(muted));
    audio.setMuted(muted);
  }, [muted]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.sfxVol, String(sfxVolume));
    audio.setSfxVolume(sfxVolume);
  }, [sfxVolume]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.musicVol, String(musicVolume));
    audio.setMusicVolume(musicVolume);
  }, [musicVolume]);

  const goTo = useCallback((next: GameScreen) => {
    setTransition('out');
    setTimeout(() => {
      setScreen(next);
      setTransition('in');
    }, 200);
  }, []);

  const handlePlay = () => goTo('select');
  const handleOptions = () => goTo('options');
  const handleSelectChar = (char: CharacterDef) => {
    setCharacter(char);
    goTo('instructions');
  };
  const handleStartGame = () => goTo('playing');
  const handleGameOver = useCallback((result: RunResult) => {
    setLastResult(result);
    if (result.score > bestScore) {
      setBestScore(result.score);
      setIsNewBest(true);
    } else {
      setIsNewBest(false);
    }
    goTo('gameover');
  }, [bestScore]);
  const handleRetry = () => goTo('playing');
  const handleMenu = () => goTo('menu');
  const handleExit = () => goTo('menu');

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      <div
        className={`w-full h-full transition-opacity duration-200 ${
          transition === 'in' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {screen === 'menu' && (
          <MenuScreen
            onPlay={handlePlay}
            onOptions={handleOptions}
            bestScore={bestScore}
          />
        )}

        {screen === 'options' && (
          <OptionsScreen
            speedSetting={speedSetting}
            onSpeedChange={setSpeedSetting}
            muted={muted}
            onMutedChange={setMuted}
            sfxVolume={sfxVolume}
            onSfxVolumeChange={setSfxVolume}
            musicVolume={musicVolume}
            onMusicVolumeChange={setMusicVolume}
            onBack={() => goTo('menu')}
          />
        )}

        {screen === 'select' && (
          <SelectScreen
            onSelect={handleSelectChar}
            onBack={() => goTo('menu')}
            bestScore={bestScore}
          />
        )}

        {screen === 'instructions' && (
          <InstructionsScreen
            character={character}
            onStart={handleStartGame}
            onBack={() => goTo('select')}
          />
        )}

        {screen === 'playing' && (
          <GameCanvas
            character={character}
            speedSetting={speedSetting}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        )}

        {screen === 'gameover' && lastResult && (
          <GameOverScreen
            result={lastResult}
            bestScore={bestScore}
            isNewBest={isNewBest}
            onRetry={handleRetry}
            onMenu={handleMenu}
          />
        )}
      </div>
    </div>
  );
}
