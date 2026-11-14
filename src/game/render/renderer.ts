import type { CharacterDef } from '../types';
import type { GameState } from '../state';
import { KICK_DURATION, SMASH_DURATION } from '../state';
import { PLAYER_Z, figureUnit, projectPoint } from '../projection';
import { Scenery } from './scenery';
import { drawRoad } from './road';
import { drawFigure } from './figures';
import { drawBoulder, drawPowerup, drawRhino, drawRing, drawSpike } from './hazards';
import { drawCountdown, drawFloats, drawHitFlash, drawParticles, drawVignette } from './effects';

export class FrameRenderer {
  private scenery = new Scenery();

  constructor(private ctx: CanvasRenderingContext2D) {}

  draw(state: GameState, char: CharacterDef, w: number, h: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    const zoom = 1 + Math.min(0.04, Math.max(0, state.speed - 0.15) * 0.08);
    ctx.translate(w / 2, h * 0.42);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2, -h * 0.42);
    if (state.screenShake > 0) {
      const k = state.screenShake;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }

    this.scenery.drawBackdrop(ctx, w, h, state.elapsed, state.distanceTraveled);
    drawRoad(ctx, w, h, state.distanceTraveled);
    this.scenery.drawForeground(ctx, w, h, state.elapsed, state.distanceTraveled);
    this.drawEntities(state, w, h);
    this.drawSetPieceEffects(state, w, h);
    this.drawPlayer(state, char, w, h);
    drawParticles(ctx, state.particles);
    drawFloats(ctx, state.floats);
    drawCountdown(ctx, w, h, state.startCountdown);

    ctx.restore();
    drawHitFlash(ctx, w, h, state.hitFlash);
    drawVignette(ctx, w, h);
  }

  private drawEntities(state: GameState, w: number, h: number) {
    const ctx = this.ctx;
    const visible = state.entities
      .filter((e) => !e.collected && e.z <= 1 && e.z >= -0.05)
      .sort((a, b) => b.z - a.z);
    for (const e of visible) {
      const p = projectPoint(w, h, e.lane, Math.max(0, e.z));
      const u = figureUnit(w, h, p.s);
      switch (e.kind) {
        case 'ring':
          drawRing(ctx, p.x, p.y, u, e.spin);
          break;
        case 'spike':
          drawSpike(ctx, p.x, p.y, u, e.spin);
          break;
        case 'boulder':
          drawBoulder(ctx, p.x, p.y, u, e.spin);
          break;
        case 'rhino':
          drawRhino(ctx, p.x, p.y, u, e.spin * 2.2 + e.id);
          break;
        case 'powerup':
          if (e.power) drawPowerup(ctx, p.x, p.y, u, e.spin, e.power);
          break;
      }
    }
  }

  private drawSetPieceEffects(state: GameState, w: number, h: number) {
    const ctx = this.ctx;
    const p = state.player;
    if (p.smashTimer > 0) {
      const k = 1 - p.smashTimer / SMASH_DURATION;
      const origin = projectPoint(w, h, p.targetLane, 0.12);
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath();
      ctx.ellipse(origin.x, origin.y, w * 0.18 * k, h * 0.03 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (p.kickTimer > 0) {
      const k = 1 - p.kickTimer / KICK_DURATION;
      const origin = projectPoint(w, h, p.targetLane, 0.08);
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 8 * (1 - k) + 2;
      ctx.beginPath();
      ctx.ellipse(origin.x, origin.y, w * 0.45 * k, h * 0.06 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawPlayer(state: GameState, char: CharacterDef, w: number, h: number) {
    const ctx = this.ctx;
    const pl = state.player;
    const feet = projectPoint(w, h, pl.lane, PLAYER_Z, pl.y);
    const ground = projectPoint(w, h, pl.lane, PLAYER_Z, 0);
    const u = figureUnit(w, h, feet.s);
    const shrink = 1 - Math.min(0.5, pl.y * 2.5);
    const stumbleK = pl.stumble / 0.6;
    const wobble = Math.sin(pl.stumble * 28) * stumbleK * 0.45;
    const bounce = Math.abs(Math.sin(pl.stumble * 10)) * stumbleK * 0.3 * u;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(ground.x, ground.y, 3.2 * u * shrink, 0.9 * u * shrink, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (pl.invuln > 0 && Math.floor(pl.invuln * 12) % 2 === 0) ctx.globalAlpha = 0.35;

    const center = { x: feet.x, y: feet.y - 4.2 * u };
    if (state.powers.some((p) => p.type === 'shield')) {
      ctx.strokeStyle = 'rgba(74,222,128,0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 6 * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (state.powers.some((p) => p.type === 'magnet')) {
      ctx.strokeStyle = 'rgba(34,211,238,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, 7 * u, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const smash = pl.smashTimer > 0 ? Math.sin((1 - pl.smashTimer / SMASH_DURATION) * Math.PI) : 0;
    const kick = pl.kickTimer > 0 ? Math.sin((1 - pl.kickTimer / KICK_DURATION) * Math.PI) : 0;
    drawFigure(ctx, char, {
      x: feet.x,
      y: feet.y - bounce,
      unit: u,
      runCycle: pl.runCycle,
      tilt: pl.tilt + wobble,
      airborne: pl.jumping,
      smash,
      kick,
    });
    ctx.restore();
  }
}
