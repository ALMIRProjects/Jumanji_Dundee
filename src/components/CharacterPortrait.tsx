import { useEffect, useRef } from 'react';
import type { CharacterDef } from '@/game/types';
import { drawFigure } from '@/game/render/figures';

interface CharacterPortraitProps {
  character: CharacterDef;
  size?: number;
  locked?: boolean;
}

export function CharacterPortrait({ character, size = 120, locked = false }: CharacterPortraitProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const glow = ctx.createRadialGradient(size / 2, size * 0.4, size * 0.05, size / 2, size / 2, size * 0.6);
    glow.addColorStop(0, character.color + '55');
    glow.addColorStop(1, character.color + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    drawFigure(ctx, character, {
      x: size / 2,
      y: size * 0.94,
      unit: size / 10.5,
      runCycle: 0.8,
      tilt: 0,
      airborne: false,
      smash: 0,
      kick: 0,
    });
  }, [character, size]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={character.name}
      style={{ width: size, height: size }}
      className={locked ? 'grayscale opacity-40' : ''}
    />
  );
}
