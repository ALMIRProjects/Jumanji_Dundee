import type { PowerType } from '../state';

const OUTLINE = '#0b1120';

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, spin: number) {
  const cx = x;
  const cy = y - 2.2 * u;
  const r = 1.8 * u;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
  glow.addColorStop(0, 'rgba(251,191,36,0.45)');
  glow.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
  ctx.fill();

  const squash = Math.max(0.12, Math.abs(Math.cos(spin)));
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * squash, r, 0, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(2, 0.45 * u);
  ctx.strokeStyle = '#b45309';
  ctx.stroke();
  ctx.lineWidth = Math.max(1, 0.25 * u);
  ctx.strokeStyle = '#fde68a';
  ctx.stroke();
}

export function drawSpike(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, spin: number) {
  const r = 1.5 * u;
  const cx = x;
  const cy = y - 1.8 * u;
  shadow(ctx, x, y, r * 1.1, 0.35 * u);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const a1 = a - 0.14;
    const a2 = a + 0.14;
    ctx.moveTo(Math.cos(a1) * r * 0.85, Math.sin(a1) * r * 0.85);
    ctx.lineTo(Math.cos(a) * r * 1.55, Math.sin(a) * r * 1.55);
    ctx.lineTo(Math.cos(a2) * r * 0.85, Math.sin(a2) * r * 0.85);
  }
  ctx.fillStyle = '#64748b';
  ctx.fill();
  ctx.lineWidth = 0.2 * u;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  const body = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  body.addColorStop(0, '#cbd5e1');
  body.addColorStop(0.6, '#475569');
  body.addColorStop(1, '#1e293b');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawBoulder(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, spin: number) {
  const r = 2.5 * u;
  const cx = x;
  const cy = y - r * 0.95;
  shadow(ctx, x, y, r * 1.05, r * 0.25);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  const stone = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  stone.addColorStop(0, '#d6d3d1');
  stone.addColorStop(0.6, '#78716c');
  stone.addColorStop(1, '#292524');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = stone;
  ctx.fill();
  ctx.lineWidth = Math.max(1, 0.3 * u);
  ctx.strokeStyle = '#1c1917';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.2);
  ctx.lineTo(-r * 0.1, r * 0.1);
  ctx.lineTo(r * 0.2, -r * 0.3);
  ctx.lineTo(r * 0.6, r * 0.2);
  ctx.lineWidth = Math.max(1, 0.18 * u);
  ctx.strokeStyle = '#44403c';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(r * 0.4, r * 0.3, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(77,124,15,0.75)';
  ctx.fill();
  ctx.restore();
}

export function drawRhino(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, anim: number) {
  shadow(ctx, x, y, 2.8 * u, 0.55 * u);

  const legs: Array<[number, number]> = [
    [-1.9, 0],
    [-1.1, Math.PI],
    [1.1, Math.PI],
    [1.9, 0],
  ];
  for (const [lx, phase] of legs) {
    const lift = Math.max(0, Math.sin(anim + phase)) * 0.7 * u;
    ctx.beginPath();
    ctx.roundRect(x + lx * u - 0.35 * u, y - 2.2 * u, 0.7 * u, 2.2 * u - lift, 0.3 * u);
    ctx.fillStyle = '#44403c';
    ctx.fill();
    ctx.lineWidth = 0.2 * u;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  const body = ctx.createLinearGradient(0, y - 4.1 * u, 0, y - 1.2 * u);
  body.addColorStop(0, '#8c8478');
  body.addColorStop(1, '#4b4540');
  ctx.beginPath();
  ctx.roundRect(x - 2.2 * u, y - 4.1 * u, 4.4 * u, 2.9 * u, 1.1 * u);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = 0.25 * u;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 0.14 * u;
  ctx.beginPath();
  ctx.moveTo(x - 1.6 * u, y - 3.2 * u);
  ctx.lineTo(x - 1.2 * u, y - 2.3 * u);
  ctx.moveTo(x + 1.6 * u, y - 3.2 * u);
  ctx.lineTo(x + 1.2 * u, y - 2.3 * u);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x - 1.45 * u, y - 3.3 * u, 0.4 * u, 0.4 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 1.45 * u, y - 3.3 * u, 0.4 * u, 0.4 * u, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#78716c';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x, y - 2.1 * u, 1.75 * u, 1.45 * u, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#a8a29e';
  ctx.fill();
  ctx.lineWidth = 0.25 * u;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 0.4 * u, y - 3.2 * u);
  ctx.lineTo(x, y - 5.5 * u);
  ctx.lineTo(x + 0.4 * u, y - 3.2 * u);
  ctx.closePath();
  ctx.fillStyle = '#e7e5e4';
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(x - 0.85 * u, y - 2.5 * u, 0.18 * u, 0, Math.PI * 2);
  ctx.arc(x + 0.85 * u, y - 2.5 * u, 0.18 * u, 0, Math.PI * 2);
  ctx.fill();
}

const POWER_STYLE: Record<PowerType, { glow: string; core: string; letter: string }> = {
  magnet: { glow: '#22d3ee', core: '#67e8f9', letter: 'M' },
  shield: { glow: '#4ade80', core: '#86efac', letter: 'S' },
  multiplier: { glow: '#fbbf24', core: '#fde68a', letter: 'x2' },
  boost: { glow: '#f97316', core: '#fb923c', letter: 'B' },
};

export function drawPowerup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  u: number,
  spin: number,
  type: PowerType,
) {
  const style = POWER_STYLE[type];
  const r = 1.6 * u;
  const cx = x;
  const cy = y - 2.4 * u;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
  glow.addColorStop(0, style.glow + '99');
  glow.addColorStop(1, style.glow + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r, 0);
  ctx.closePath();
  ctx.fillStyle = style.glow;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.lineTo(r * 0.6, 0);
  ctx.lineTo(0, r * 0.6);
  ctx.lineTo(-r * 0.6, 0);
  ctx.closePath();
  ctx.fillStyle = style.core;
  ctx.fill();
  ctx.rotate(-spin);
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${Math.max(8, r * 0.8)}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.letter, 0, 0);
  ctx.restore();
}
