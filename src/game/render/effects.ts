import type { FloatingText, Particle } from '../state';

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawFloats(ctx: CanvasRenderingContext2D, floats: FloatingText[]) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floats) {
    const age = 1 - f.life / f.maxLife;
    const pop = age < 0.22 ? 1 + 0.6 * Math.sin((age / 0.22) * Math.PI) : 1;
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    ctx.font = `900 ${f.size * pop}px ui-sans-serif, system-ui, sans-serif`;
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(2,6,23,0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

export function drawCountdown(ctx: CanvasRenderingContext2D, w: number, h: number, countdown: number) {
  if (countdown <= 0) return;
  const num = Math.ceil(countdown);
  const text = num > 0 ? String(num) : 'GO!';
  const phase = countdown - Math.floor(countdown);
  const scale = 1 + (1 - phase) * 0.5;
  ctx.save();
  ctx.globalAlpha = Math.min(1, phase * 2);
  ctx.font = `900 ${80 * scale}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#0f172a';
  ctx.strokeText(text, w / 2, h * 0.35);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(text, w / 2, h * 0.35);
  ctx.restore();
}

export function drawHitFlash(ctx: CanvasRenderingContext2D, w: number, h: number, flash: number) {
  if (flash <= 0) return;
  ctx.save();
  ctx.globalAlpha = flash * 0.5;
  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
