interface CanopyLayer {
  band: number;
  parallax: number;
  shade: string;
  leaf: string;
  light: string;
}

interface Blob {
  x: number;
  y: number;
  r: number;
  hi: boolean;
}

interface Vine {
  x: number;
  len: number;
  sway: number;
  phase: number;
  layer: number;
}

interface Bird {
  x: number;
  y: number;
  speed: number;
  phase: number;
  size: number;
}

interface Mote {
  x: number;
  y: number;
  phase: number;
  speed: number;
  size: number;
}

interface SceneryCache {
  w: number;
  h: number;
  canopyH: number;
  canopy: HTMLCanvasElement[];
}

const TAU = Math.PI * 2;
const CANOPY_FRAC = 0.52;

const CANOPY: CanopyLayer[] = [
  { band: 0.3, parallax: 0.02, shade: '#0a1914', leaf: '#15332a', light: '#2f5c48' },
  { band: 0.36, parallax: 0.05, shade: '#07140f', leaf: '#10281f', light: '#2a5040' },
  { band: 0.43, parallax: 0.1, shade: '#040c09', leaf: '#0b1d16', light: '#213f32' },
];

const VINE_PARALLAX = [0.06, 0.16];

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function wrap(v: number, w: number) {
  return ((v % w) + w) % w;
}

function makeLayer(w: number, h: number, scale: number, paint: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w * scale);
  canvas.height = Math.ceil(h * scale);
  const g = canvas.getContext('2d')!;
  g.scale(scale, scale);
  paint(g);
  return canvas;
}

export class Scenery {
  private blobs: Blob[][] = [];
  private vines: Vine[] = [];
  private birds: Bird[] = [];
  private motes: Mote[] = [];
  private cache: SceneryCache | null = null;

  constructor() {
    const rand = makeRng(42);
    for (let i = 0; i < CANOPY.length; i++) {
      const row: Blob[] = [];
      for (let j = 0; j < 56; j++) {
        row.push({ x: rand(), y: rand(), r: 0.03 + rand() * 0.05, hi: rand() > 0.5 });
      }
      this.blobs.push(row);
    }
    for (let i = 0; i < 18; i++) {
      this.vines.push({
        x: rand(),
        len: 0.16 + rand() * 0.3,
        sway: 0.4 + rand() * 0.8,
        phase: rand() * TAU,
        layer: rand() > 0.5 ? 1 : 0,
      });
    }
    for (let i = 0; i < 5; i++) {
      this.birds.push({
        x: rand(),
        y: 0.06 + rand() * 0.16,
        speed: 0.6 + rand() * 0.6,
        phase: rand() * 6,
        size: 0.8 + rand() * 0.6,
      });
    }
    for (let i = 0; i < 65; i++) {
      this.motes.push({ x: rand(), y: rand(), phase: rand() * TAU, speed: 0.2 + rand() * 0.5, size: 1.2 + rand() * 2.2 });
    }
  }

  drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, scroll: number) {
    const cache = this.ensureCache(w, h);

    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.42);
    sky.addColorStop(0, '#0a1c22');
    sky.addColorStop(0.4, '#1a3a3b');
    sky.addColorStop(0.75, '#2f4a3a');
    sky.addColorStop(1, '#5e5230');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const sun = ctx.createRadialGradient(w * 0.78, h * 0.08, 0, w * 0.78, h * 0.08, w * 0.45);
    sun.addColorStop(0, 'rgba(255,220,150,0.45)');
    sun.addColorStop(0.25, 'rgba(230,190,120,0.18)');
    sun.addColorStop(0.6, 'rgba(160,150,90,0.06)');
    sun.addColorStop(1, 'rgba(60,80,60,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);

    this.drawHills(ctx, w, h, scroll);
    this.drawFarTrunks(ctx, w, h, scroll);
    for (let i = 0; i < CANOPY.length; i++) {
      const offset = -wrap(scroll * CANOPY[i].parallax * w, w);
      ctx.drawImage(cache.canopy[i], offset, 0, w, cache.canopyH);
      ctx.drawImage(cache.canopy[i], offset + w, 0, w, cache.canopyH);
    }
    this.drawMist(ctx, w, h);
    this.drawShafts(ctx, w, h, t);
    this.drawBirds(ctx, w, h, t);
  }

  drawForeground(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, scroll: number) {
    this.drawVines(ctx, w, h, t, scroll);
    this.drawMotes(ctx, w, h, t, scroll);

    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.35, w * 0.5, h * 0.5, w * 0.75);
    vig.addColorStop(0, 'rgba(5,12,10,0)');
    vig.addColorStop(1, 'rgba(3,8,6,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  private ensureCache(w: number, h: number): SceneryCache {
    const cached = this.cache;
    if (cached && cached.w === w && cached.h === h) return cached;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const canopyH = h * CANOPY_FRAC;
    const canopy = CANOPY.map((_, i) => makeLayer(w, canopyH, scale, (g) => this.paintCanopy(g, w, h, canopyH, i)));
    this.cache = { w, h, canopyH, canopy };
    return this.cache;
  }

  private paintCanopy(g: CanvasRenderingContext2D, w: number, h: number, canopyH: number, i: number) {
    const layer = CANOPY[i];
    const bandPx = layer.band * h;
    const blobs = this.blobs[i];

    const drawBlobs = (color: string, dy: number, scaleR: number) => {
      g.fillStyle = color;
      g.beginPath();
      for (const b of blobs) {
        const cy = b.y * bandPx + dy;
        const r = b.r * h * scaleR;
        for (const off of [-w, 0, w]) {
          const cx = b.x * w + off;
          g.moveTo(cx + r, cy);
          g.arc(cx, cy, r, 0, TAU);
        }
      }
      g.fill();
    };

    drawBlobs(layer.shade, bandPx * 0.04, 1.1);
    drawBlobs(layer.leaf, 0, 1);

    g.beginPath();
    for (const b of blobs) {
      if (!b.hi) continue;
      const cy = b.y * bandPx;
      const r = b.r * h;
      for (const off of [-w, 0, w]) {
        const cx = b.x * w + off;
        g.moveTo(cx - r * 0.3 + r * 0.55, cy - r * 0.3);
        g.arc(cx - r * 0.3, cy - r * 0.3, r * 0.55, 0, TAU);
      }
    }
    g.fillStyle = layer.light;
    g.fill();

    const feather = g.createLinearGradient(0, bandPx * 0.7, 0, canopyH);
    feather.addColorStop(0, 'rgba(0,0,0,1)');
    feather.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = feather;
    g.fillRect(0, 0, w, canopyH);
    g.globalCompositeOperation = 'source-over';
  }

  private drawHills(ctx: CanvasRenderingContext2D, w: number, h: number, scroll: number) {
    const base = h * 0.36;
    const shift = scroll * 0.4;
    ctx.fillStyle = '#1a3a33';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.4);
    for (let x = 0; x <= w; x += w / 24) {
      const n = x / w;
      const y = base - h * (0.05 * (0.6 + 0.4 * Math.sin(n * 6.5 + shift)) + 0.025 * Math.sin(n * 15 + 1.3));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  private drawFarTrunks(ctx: CanvasRenderingContext2D, w: number, h: number, scroll: number) {
    const horizon = h * 0.38;
    ctx.fillStyle = '#0d1f1a';
    for (let i = 0; i < 7; i++) {
      const x = wrap(i * w * 0.17 - scroll * 0.03 * w, w + 60) - 30;
      const width = w * (0.01 + (i % 3) * 0.005);
      ctx.fillRect(x, horizon * 0.3, width, horizon * 0.9);
    }
  }

  private drawMist(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const mist = ctx.createLinearGradient(0, h * 0.22, 0, h * 0.42);
    mist.addColorStop(0, 'rgba(255,186,110,0)');
    mist.addColorStop(0.7, 'rgba(255,186,110,0.22)');
    mist.addColorStop(1, 'rgba(255,186,110,0.3)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.24, w, h * 0.14);
  }

  private drawShafts(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    for (let i = 0; i < 4; i++) {
      const x = w * (0.12 + 0.24 * i + 0.03 * Math.sin(t * 0.3 + i));
      ctx.fillStyle = `rgba(255,226,160,${0.035 + 0.03 * Math.sin(t * 0.7 + i * 1.7)})`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + w * 0.06, 0);
      ctx.lineTo(x + w * 0.28, h * 0.75);
      ctx.lineTo(x + w * 0.14, h * 0.75);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawBirds(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    ctx.strokeStyle = 'rgba(10,25,20,0.85)';
    ctx.lineWidth = 1.5;
    for (const b of this.birds) {
      const x = wrap(b.x * w + t * b.speed * 12, w);
      const y = b.y * h + Math.sin(t * 1.3 + b.phase) * 6;
      const flap = Math.sin(t * 9 + b.phase) * 3 * b.size;
      ctx.beginPath();
      ctx.moveTo(x - 7 * b.size, y - flap);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 7 * b.size, y - flap);
      ctx.stroke();
    }
  }

  private drawVines(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, scroll: number) {
    for (const v of this.vines) {
      const near = v.layer === 1;
      const x = wrap(v.x * w - scroll * VINE_PARALLAX[v.layer] * w, w);
      const len = v.len * h;
      const sway = Math.sin(t * 0.9 + v.phase) * v.sway * w * 0.02;
      const tip = x + sway;
      ctx.strokeStyle = near ? '#0a1a14' : '#12291f';
      ctx.lineWidth = near ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + sway * 0.3, len * 0.5, tip, len);
      ctx.stroke();

      for (let k = 1; k <= 3; k++) {
        const f = k / 3.5;
        const lx = x + sway * f * f + (k % 2 === 0 ? 6 : -6) * (near ? 1.3 : 1);
        const ly = len * f;
        ctx.fillStyle = near ? '#183a2c' : '#1f4536';
        ctx.beginPath();
        ctx.ellipse(lx, ly, near ? 7 : 5, near ? 3 : 2.5, k % 2 === 0 ? 0.6 : -0.6, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = near ? '#34725a' : '#44906f';
      ctx.beginPath();
      ctx.ellipse(tip, len, near ? 6 : 4, near ? 9 : 6, sway * 0.02, 0, TAU);
      ctx.fill();
    }
  }

  private drawMotes(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, scroll: number) {
    for (const m of this.motes) {
      const x = wrap(m.x * w + Math.sin(t * 0.4 + m.phase) * 28 - scroll * 0.12 * w, w);
      const y = wrap(m.y * h - t * m.speed * 8, h * 0.85);
      const a = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.5 + m.phase));

      ctx.fillStyle = `rgba(255,236,170,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, m.size, 0, TAU);
      ctx.fill();

      if (m.size > 2) {
        ctx.fillStyle = `rgba(255,220,140,${a * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, m.size * 2.2, 0, TAU);
        ctx.fill();
      }
    }
  }
}
