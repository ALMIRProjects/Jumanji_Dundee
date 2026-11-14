import type { CharacterDef } from '../types';

export interface FigurePose {
  x: number;
  y: number;
  unit: number;
  runCycle: number;
  tilt: number;
  airborne: boolean;
  smash: number;
  kick: number;
}

type Pt = [number, number];

const OUTLINE = '#0b1120';
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function limb(ctx: CanvasRenderingContext2D, u: number, pts: Pt[], width: number, color: string) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * u, y * u) : ctx.lineTo(x * u, y * u)));
  ctx.lineWidth = (width + 0.28) * u;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = width * u;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function shape(ctx: CanvasRenderingContext2D, u: number, pts: Pt[], fill: string | CanvasGradient) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * u, y * u) : ctx.lineTo(x * u, y * u)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 0.22 * u;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function disc(ctx: CanvasRenderingContext2D, u: number, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x * u, y * u, r * u, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 0.2 * u;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function line(ctx: CanvasRenderingContext2D, u: number, pts: Pt[], width: number, color: string) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * u, y * u) : ctx.lineTo(x * u, y * u)));
  ctx.lineWidth = width * u;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function shoe(ctx: CanvasRenderingContext2D, u: number, foot: Pt) {
  ctx.beginPath();
  ctx.ellipse(foot[0] * u + 0.18 * u, foot[1] * u - 0.12 * u, 0.5 * u, 0.3 * u, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1f2937';
  ctx.fill();
  ctx.lineWidth = 0.2 * u;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

export function drawFigure(ctx: CanvasRenderingContext2D, char: CharacterDef, pose: FigurePose) {
  const st = char.style;
  const u = pose.unit;
  const b = st.build;
  const sw = Math.sin(pose.runCycle);
  const sh = 1.22 * b;
  const wa = 0.92 * b;
  const hipX = 0.55 * b;
  const hr = 1.02;

  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.tilt);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  let kneeL: Pt;
  let footL: Pt;
  let kneeR: Pt;
  let footR: Pt;
  if (pose.airborne) {
    kneeL = [-hipX - 0.1, -1.9];
    footL = [-hipX + 0.4, -1.4];
    kneeR = [hipX + 0.1, -1.9];
    footR = [hipX - 0.4, -1.4];
  } else {
    kneeL = [-hipX + sw * 0.6, -1.7];
    footL = [-hipX + sw * 1.0, -Math.max(0, sw) * 0.5];
    kneeR = [hipX - sw * 0.6, -1.7];
    footR = [hipX - sw * 1.0, -Math.max(0, -sw) * 0.5];
  }
  if (pose.kick > 0) {
    const k = pose.kick;
    kneeR = [hipX + 1.3 * k, -2.6 + 0.3 * k];
    footR = [hipX + 2.9 * k, -2.9 + 0.2 * k];
  }

  limb(ctx, u, [[-hipX, -3.4], kneeL, footL], 0.72, st.pants);
  limb(ctx, u, [[hipX, -3.4], kneeR, footR], 0.72, st.pants);
  shoe(ctx, u, footL);
  shoe(ctx, u, footR);

  if (st.hairStyle === 'ponytail') {
    limb(ctx, u, [[0.8, -7.4], [1.55, -6.9], [1.35, -5.2]], 0.5, st.hair);
  }

  const torsoGrad = ctx.createLinearGradient(0, -5.6 * u, 0, -3.2 * u);
  torsoGrad.addColorStop(0, st.outfit);
  torsoGrad.addColorStop(1, st.outfitDark);
  shape(ctx, u, [[-0.34, -6.4], [0.34, -6.4], [0.34, -5.2], [-0.34, -5.2]], st.skin);
  shape(ctx, u, [[-sh, -5.6], [sh, -5.6], [wa, -3.2], [-wa, -3.2]], torsoGrad);

  if (st.outerwear === 'vest') {
    shape(ctx, u, [[-0.33, -5.6], [0.33, -5.6], [0, -4.3]], st.trim);
    shape(ctx, u, [[-sh * 0.95, -5.6], [-0.3, -5.6], [-0.1, -3.3], [-wa * 0.85, -3.3]], st.outfitDark);
    shape(ctx, u, [[sh * 0.95, -5.6], [0.3, -5.6], [0.1, -3.3], [wa * 0.85, -3.3]], st.outfitDark);
  } else if (st.outerwear === 'cardigan') {
    line(ctx, u, [[0, -5.5], [0, -3.4]], 0.07, st.outfitDark);
    disc(ctx, u, 0, -4.9, 0.09, st.trim);
    disc(ctx, u, 0, -4.2, 0.09, st.trim);
  } else {
    shape(ctx, u, [[-0.85, -5.6], [0, -4.4], [0.85, -5.6]], st.outfitDark);
    line(ctx, u, [[0, -4.4], [0, -3.3]], 0.08, '#e5e7eb');
  }

  shape(ctx, u, [[-wa, -3.5], [wa, -3.5], [wa, -3.05], [-wa, -3.05]], '#3f2d1d');

  if (st.accessory === 'satchel') {
    limb(ctx, u, [[-sh * 0.9, -5.5], [wa * 0.75, -3.5]], 0.18, '#78350f');
    shape(ctx, u, [[wa * 0.45, -3.8], [wa * 0.45 + 0.85, -3.8], [wa * 0.45 + 0.85, -2.7], [wa * 0.45, -2.7]], '#92400e');
  } else if (st.accessory === 'holster') {
    shape(ctx, u, [[wa * 0.72, -3.5], [wa * 1.05, -3.5], [wa * 1.05, -2.5], [wa * 0.72, -2.5]], '#1f2937');
    shape(ctx, u, [[wa * 0.8, -3.5], [wa * 0.98, -3.5], [wa * 0.98, -3.9], [wa * 0.8, -3.9]], '#374151');
  }

  disc(ctx, u, -hr, -6.8, 0.22, st.skin);
  disc(ctx, u, hr, -6.8, 0.22, st.skin);
  disc(ctx, u, 0, -6.9, hr, st.skin);

  ctx.beginPath();
  ctx.moveTo(-hr * 1.04 * u, -6.9 * u);
  ctx.arc(0, -6.9 * u, hr * 1.04 * u, Math.PI, Math.PI * 2);
  ctx.quadraticCurveTo(0, -7.6 * u, -hr * 1.04 * u, -6.9 * u);
  ctx.closePath();
  ctx.fillStyle = st.hair;
  ctx.fill();
  ctx.lineWidth = 0.22 * u;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  if (st.hairStyle === 'tousled') {
    shape(ctx, u, [[-0.6, -7.8], [-0.35, -8.55], [-0.1, -7.9]], st.hair);
    shape(ctx, u, [[0, -7.9], [0.35, -8.7], [0.6, -7.9]], st.hair);
  }

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(-0.36 * u, -6.85 * u, 0.12 * u, 0.15 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(0.36 * u, -6.85 * u, 0.12 * u, 0.15 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  disc(ctx, u, -0.32, -6.9, 0.04, '#ffffff');
  disc(ctx, u, 0.4, -6.9, 0.04, '#ffffff');
  line(ctx, u, [[-0.55, -7.2], [-0.18, -7.02]], 0.1, '#1f2937');
  line(ctx, u, [[0.55, -7.2], [0.18, -7.02]], 0.1, '#1f2937');
  ctx.beginPath();
  ctx.arc(0, -6.45 * u, 0.26 * u, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.lineWidth = 0.1 * u;
  ctx.strokeStyle = '#7c2d12';
  ctx.stroke();
  ctx.fillStyle = 'rgba(248,113,113,0.35)';
  ctx.beginPath();
  ctx.ellipse(-0.6 * u, -6.55 * u, 0.16 * u, 0.12 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(0.6 * u, -6.55 * u, 0.16 * u, 0.12 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  if (st.hairStyle === 'braid') {
    limb(ctx, u, [[-0.9, -6.6], [-1.05, -5.8], [-0.9, -5.0]], 0.3, st.hair);
    limb(ctx, u, [[0.9, -6.6], [1.05, -5.8], [0.9, -5.0]], 0.3, st.hair);
  }

  if (st.headgear === 'bandana') {
    ctx.beginPath();
    ctx.arc(0, -6.9 * u, hr * 1.03 * u, Math.PI * 1.12, Math.PI * 1.88);
    ctx.lineWidth = 0.36 * u;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();
    const flap = sw * 0.25;
    shape(ctx, u, [[0.95, -7.55], [1.8, -7.2 + flap], [1.4, -7.85 + flap * 0.6]], '#b91c1c');
  } else if (st.headgear === 'goggles') {
    ctx.beginPath();
    ctx.arc(0, -6.9 * u, hr * 0.99 * u, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineWidth = 0.14 * u;
    ctx.strokeStyle = '#334155';
    ctx.stroke();
    disc(ctx, u, -0.44, -7.35, 0.3, '#7dd3fc');
    disc(ctx, u, 0.44, -7.35, 0.3, '#7dd3fc');
    line(ctx, u, [[-0.14, -7.35], [0.14, -7.35]], 0.08, '#facc15');
  } else if (st.headgear === 'hat') {
    shape(ctx, u, [[-0.7, -7.55], [-0.62, -8.7], [0.62, -8.7], [0.7, -7.55]], st.outfitDark);
    shape(ctx, u, [[-0.72, -7.75], [0.72, -7.75], [0.72, -7.5], [-0.72, -7.5]], st.trim);
    ctx.beginPath();
    ctx.ellipse(0, -7.5 * u, 1.55 * u, 0.3 * u, 0, 0, Math.PI * 2);
    ctx.fillStyle = st.trim;
    ctx.fill();
    ctx.lineWidth = 0.22 * u;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  const armL = -sw * 0.6;
  const armR = sw * 0.6;
  const shL: Pt = [-sh + 0.08, -5.1];
  const shR: Pt = [sh - 0.08, -5.1];
  const elbowL = lerpPt([shL[0] + armL * 0.5, -3.9], [-1.25, -6.7], pose.smash);
  const handL = lerpPt([shL[0] + armL, -2.9], [-0.4, -8.3], pose.smash);
  const elbowR = lerpPt([shR[0] + armR * 0.5, -3.9], [1.25, -6.7], pose.smash);
  const handR = lerpPt([shR[0] + armR, -2.9], [0.4, -8.3], pose.smash);
  limb(ctx, u, [shL, elbowL, handL], 0.44, st.outfit);
  limb(ctx, u, [shR, elbowR, handR], 0.44, st.outfit);
  disc(ctx, u, handL[0], handL[1], 0.24, st.skin);
  disc(ctx, u, handR[0], handR[1], 0.24, st.skin);

  ctx.restore();
}
