import { LANE_COUNT } from '../types';
import { HORIZON_FRAC, projectPoint } from '../projection';

const ROW = 0.05;

export function drawRoad(ctx: CanvasRenderingContext2D, w: number, h: number, scroll: number) {
  const horizonY = h * HORIZON_FRAC;
  const ground = ctx.createLinearGradient(0, horizonY, 0, h);
  ground.addColorStop(0, '#2c2015');
  ground.addColorStop(1, '#140e08');
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  const travel = scroll * 6;
  const base = Math.floor(travel / ROW);
  for (let k = 0; ; k++) {
    const n = base + k;
    const z0 = n * ROW - travel;
    if (z0 >= 1) break;
    const z1 = z0 + ROW;
    if (z1 <= 0) continue;
    const a = Math.max(0, z0);
    for (let i = 0; i < LANE_COUNT; i++) {
      ctx.fillStyle = (n + i) % 2 === 0 ? '#45341f' : '#3a2a19';
      const p1 = projectPoint(w, h, i - 0.5, a);
      const p2 = projectPoint(w, h, i + 0.5, a);
      const p3 = projectPoint(w, h, i + 0.5, z1);
      const p4 = projectPoint(w, h, i - 0.5, z1);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.strokeStyle = 'rgba(120,190,130,0.45)';
  ctx.lineWidth = 3;
  for (const edge of [-0.5, LANE_COUNT - 0.5]) {
    const near = projectPoint(w, h, edge, 0);
    const far = projectPoint(w, h, edge, 1);
    ctx.beginPath();
    ctx.moveTo(near.x, near.y);
    ctx.lineTo(far.x, far.y);
    ctx.stroke();
  }
}
