
import { LANE_COUNT, type CharacterDef, type RunResult } from './types';
import { audio } from './audio';
import { PLAYER_Z, figureUnit, projectPoint } from './projection';
import { FrameRenderer } from './render/renderer';
import {
  KICK_DURATION,
  SMASH_DURATION,
  createGameState,
  type Entity,
  type EntityKind,
  type GameState,
  type HazardKind,
  type HudSnapshot,
  type PowerType,
} from './state';

const FAR_Z = 1.0;
const RING_SPACING = 0.08;
const POWER_DURATION = 7;
const COMBO_TIMEOUT = 2.5;
const BASE_SPEED = 0.15;
const SPEED_CAP = 0.6;
const SPEED_GROWTH = 0.00003;
const GRAVITY = 3.2;
const JUMP_VELOCITY = 0.85;
const JUMP_CLEAR_HEIGHT = 0.07;
const HIT_NEAR = -0.02;
const HIT_FAR = 0.06;
const LANE_HIT_RANGE = 0.55;
const INVULN_AFTER_HIT = 1.5;
const NEAR_MISS_RANGE = 1.05;
const NEAR_MISS_BONUS = 25;
const RUMBLE_RANGE = 0.6;
const ROUNDHOUSE_INVULN = 1.2;
const SET_PIECE_GAP = 0.6;
const SMASHABLE: ReadonlySet<EntityKind> = new Set<EntityKind>(['spike', 'boulder']);
const HAZARD_SHAKE: Record<HazardKind, number> = { spike: 24, boulder: 30, rhino: 36 };
const POWER_NAMES: Record<PowerType, string> = {
  magnet: 'MAGNET',
  shield: 'SHIELD',
  multiplier: 'x2 SCORE',
  boost: 'BOOST',
};
const POWER_COLORS: Record<PowerType, string> = {
  magnet: '#22d3ee',
  shield: '#4ade80',
  multiplier: '#fbbf24',
  boost: '#f97316',
};
const POWER_TYPES: PowerType[] = ['magnet', 'shield', 'multiplier', 'boost'];

export interface GameCallbacks {
  onGameOver: (result: RunResult) => void;
  onHud: (hud: HudSnapshot) => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export class GameEngine {
  private state: GameState;
  private renderer: FrameRenderer;
  private canvas: HTMLCanvasElement;
  private char: CharacterDef;
  private speedSetting: number;
  private cb: GameCallbacks;
  private rafId: number | null = null;
  private lastTime = 0;
  private w = 0;
  private h = 0;
  private endTimer: number | null = null;
  private lastSetPieceZ = -10;
  private nearMissIds = new Set<number>();
  private swipeStart: { x: number; y: number } | null = null;
  private listeners: Array<[EventTarget, string, EventListener]> = [];

  constructor(canvas: HTMLCanvasElement, char: CharacterDef, speedSetting: number, cb: GameCallbacks) {
    this.canvas = canvas;
    this.char = char;
    this.speedSetting = speedSetting;
    this.cb = cb;
    const ctx = canvas.getContext('2d')!;
    this.renderer = new FrameRenderer(ctx);
    this.state = createGameState(BASE_SPEED * this.speedMultiplier, this.extraJumps);
  }

  private get speedMultiplier() {
    return 0.7 + ((this.speedSetting - 1) / 9) * 0.8;
  }

  private get extraJumps() {
    return this.char.ability.id === 'doubleJump' ? 1 : 0;
  }

  start() {
    this.resize();
    this.state.running = true;
    this.lastTime = performance.now();
    this.attachInput();
    this.loop(this.lastTime);
  }

  stop() {
    this.state.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.endTimer !== null) clearTimeout(this.endTimer);
    this.endTimer = null;
    this.detachInput();
  }

  pause() {
    this.state.paused = true;
  }

  resume() {
    this.state.paused = false;
    this.lastTime = performance.now();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = rect.width;
    this.h = rect.height;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  triggerAbility() {
    const s = this.state;
    const ability = this.char.ability;
    if (ability.kind === 'passive' || !s.running || s.paused || s.gameOverFlag) return;
    if (s.startCountdown > 0 || s.abilityCooldown > 0) return;
    if (ability.id === 'smash') this.powerSmash();
    else if (ability.id === 'roundhouse') this.roundhouseKick();
    s.abilityCooldown = ability.cooldown;
  }

  private listen<E extends Event>(target: EventTarget, type: string, fn: (e: E) => void) {
    const handler = fn as unknown as EventListener;
    target.addEventListener(type, handler);
    this.listeners.push([target, type, handler]);
  }

  private detachInput() {
    for (const [target, type, handler] of this.listeners) target.removeEventListener(type, handler);
    this.listeners = [];
  }

  private attachInput() {
    this.listen(window, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    this.listen(this.canvas, 'pointerdown', (e: PointerEvent) => {
      this.swipeStart = { x: e.clientX, y: e.clientY };
    });
    this.listen(this.canvas, 'pointermove', (e: PointerEvent) => this.onSwipe(e));
    const endSwipe = () => {
      this.swipeStart = null;
    };
    this.listen(window, 'pointerup', endSwipe);
    this.listen(window, 'pointercancel', endSwipe);
  }

  private onKey(e: KeyboardEvent) {
    const s = this.state;
    if (!s.running || s.paused || s.gameOverFlag) return;
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.moveLane(-1);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.moveLane(1);
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        this.jump();
        break;
      case 'e':
      case 'E':
      case 'Shift':
        this.triggerAbility();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  private onSwipe(e: PointerEvent) {
    if (!this.swipeStart || !this.state.running || this.state.paused) return;
    const dx = e.clientX - this.swipeStart.x;
    const dy = e.clientY - this.swipeStart.y;
    const threshold = 38;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      this.moveLane(dx > 0 ? 1 : -1);
      this.swipeStart = { x: e.clientX, y: e.clientY };
    } else if (dy < -threshold && Math.abs(dy) > Math.abs(dx)) {
      this.jump();
      this.swipeStart = { x: e.clientX, y: e.clientY };
    }
  }

  private loop = (time: number) => {
    if (!this.state.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    if (!this.state.paused && !this.state.gameOverFlag) this.update(dt);
    this.renderer.draw(this.state, this.char, this.w, this.h);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const s = this.state;

    if (s.startCountdown > 0) {
      s.startCountdown -= dt;
      s.player.lane = lerp(s.player.lane, s.player.targetLane, 0.1);
      s.player.runCycle += dt * 8;
      this.tickEffects(dt);
      this.emitHud();
      return;
    }

    s.elapsed += dt;

    const boosted = this.hasPower('boost');
    const target =
      Math.min(SPEED_CAP, BASE_SPEED + s.distance * SPEED_GROWTH) *
      this.speedMultiplier *
      this.char.speedMod *
      (boosted ? 1.35 : 1);
    s.speed = lerp(s.speed, target, 0.02);
    s.topSpeed = Math.max(s.topSpeed, s.speed);

    const moveZ = s.speed * dt;
    s.distance += moveZ * 100;
    s.distanceTraveled += moveZ;
    if (s.abilityCooldown > 0) s.abilityCooldown = Math.max(0, s.abilityCooldown - dt);

    this.updatePlayer(dt);
    this.updatePowers(dt);
    if (s.distanceTraveled >= s.nextSpawnZ) this.spawnNext();
    this.updateEntities(dt, moveZ);
    this.resolveCollisions();
    this.applyRumble();
    s.entities = s.entities.filter((e) => !e.collected && e.z > -0.1);
    s.score = Math.floor(s.distance) + s.bonusScore;
    this.tickEffects(dt);
    this.emitHud();
  }

  private updatePlayer(dt: number) {
    const s = this.state;
    const p = s.player;
    const diff = p.targetLane - p.lane;
    p.lane += diff * Math.min(1, 10 * dt);
    p.tilt = lerp(p.tilt, diff * 0.25, 0.15);
    p.runCycle += dt * (6 + s.speed * 20);
    p.stumble = Math.max(0, p.stumble - dt);

    if (!p.jumping && Math.random() < dt * 14) {
      const feet = projectPoint(this.w, this.h, p.lane, PLAYER_Z, 0);
      this.spawnParticles(feet.x, feet.y, 1, 'rgba(226,205,160,0.7)', 2 + feet.s * 10);
    }

    if (p.jumping) {
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.jumping = false;
        p.jumpsLeft = this.extraJumps;
      }
    }

    p.invuln = Math.max(0, p.invuln - dt);
    p.smashTimer = Math.max(0, p.smashTimer - dt);
    p.kickTimer = Math.max(0, p.kickTimer - dt);
  }

  private updatePowers(dt: number) {
    const s = this.state;
    for (const p of s.powers) p.remaining -= dt;
    s.powers = s.powers.filter((p) => p.remaining > 0);
  }

  private updateEntities(dt: number, moveZ: number) {
    const s = this.state;
    const magnet = this.hasPower('magnet');
    const treasure = this.char.ability.id === 'treasure';
    const pullRange = Math.max(
      magnet ? 0.28 * this.char.magnetMod : 0,
      treasure ? 0.42 : 0,
    );

    for (const e of s.entities) {
      if (e.collected) continue;
      e.z -= moveZ;
      e.spin += dt * (e.kind === 'boulder' ? 7 : 4);
      if (e.kind === 'ring' && pullRange > 0 && e.z > 0 && e.z < pullRange) {
        e.lane = lerp(e.lane, s.player.lane, 0.14);
      }
      if ((e.kind === 'rhino' || e.kind === 'boulder') && e.z > 0.05 && e.z < 0.7 && Math.random() < dt * 6) {
        this.emitDust(e);
      }
    }
  }

  private resolveCollisions() {
    const s = this.state;
    for (const e of s.entities) {
      if (e.collected || e.z > HIT_FAR || e.z < HIT_NEAR) continue;
      const laneGap = Math.abs(e.lane - s.player.lane);
      if (laneGap >= LANE_HIT_RANGE) {
        if (laneGap < NEAR_MISS_RANGE && e.kind !== 'ring' && e.kind !== 'powerup' && !this.nearMissIds.has(e.id)) {
          this.awardNearMiss(e);
        }
        continue;
      }
      if (e.kind === 'ring') {
        e.collected = true;
        this.collectRing();
      } else if (e.kind === 'powerup') {
        e.collected = true;
        if (e.power) this.collectPower(e.power);
      } else {
        this.handleHazard(e);
      }
    }
  }

  private handleHazard(e: Entity) {
    const s = this.state;
    const p = s.player;
    if (e.kind === 'spike' && p.y > JUMP_CLEAR_HEIGHT) {
      e.collected = true;
      this.floatText('JUMP!', '#22d3ee', 18, this.h * 0.72);
      return;
    }
    if (this.hasPower('shield')) {
      e.collected = true;
      this.breakShield();
      return;
    }
    if (p.invuln > 0) {
      if (SMASHABLE.has(e.kind)) {
        e.collected = true;
        this.burstAt(e);
      }
      return;
    }
    e.collected = true;
    this.takeHit(e.kind as HazardKind);
  }

  private takeHit(kind: HazardKind) {
    const s = this.state;
    s.lives--;
    s.screenShake = HAZARD_SHAKE[kind];
    s.hitFlash = 1;
    s.combo = 0;
    s.comboTimer = 0;
    s.player.invuln = INVULN_AFTER_HIT;
    s.player.stumble = 0.6;
    audio.play(kind === 'spike' ? 'hit' : 'thud');
    const p = projectPoint(this.w, this.h, s.player.lane, PLAYER_Z, s.player.y);
    this.spawnParticles(p.x, p.y - figureUnit(this.w, this.h, p.s) * 4, 28, '#f43f5e', 7);

    if (s.lives <= 0) {
      s.gameOverFlag = true;
      this.endTimer = window.setTimeout(() => this.endGame(), 800);
    } else {
      this.floatText(`${s.lives} ${s.lives === 1 ? 'LIFE' : 'LIVES'} LEFT`, '#f43f5e', 22);
    }
  }

  private awardNearMiss(e: Entity) {
    const s = this.state;
    this.nearMissIds.add(e.id);
    s.bonusScore += NEAR_MISS_BONUS;
    s.screenShake = Math.max(s.screenShake, 3);
    audio.play('lane');
    this.floatText(`NEAR MISS +${NEAR_MISS_BONUS}`, '#67e8f9', 22, this.h * 0.6);
  }

  private applyRumble() {
    const s = this.state;
    let nearest = Infinity;
    for (const e of s.entities) {
      if (e.kind === 'rhino' && !e.collected && e.z > 0) nearest = Math.min(nearest, e.z);
    }
    if (nearest < RUMBLE_RANGE) {
      s.screenShake = Math.max(s.screenShake, (1 - nearest / RUMBLE_RANGE) * 7);
    }
  }

  private spawnNext() {
    const s = this.state;
    const difficulty = clamp(s.distance / 1200, 0, 1);
    const r = Math.random();
    const powerChance = 0.06 * this.char.luckMod;
    const canSetPiece = s.distance > 150 && s.distanceTraveled - this.lastSetPieceZ > SET_PIECE_GAP;
    const stampedeChance = canSetPiece ? 0.03 + 0.03 * difficulty : 0;
    const boulderChance = canSetPiece && s.distance > 300 ? 0.04 : 0;
    let extraGap = 0;

    if (r < powerChance) {
      this.pushEntity('powerup', Math.floor(Math.random() * LANE_COUNT), FAR_Z, pick(POWER_TYPES));
    } else if (r < powerChance + stampedeChance) {
      this.spawnStampede();
      extraGap = 0.25;
    } else if (r < powerChance + stampedeChance + boulderChance) {
      this.spawnBoulder();
      extraGap = 0.15;
    } else {
      this.spawnStandardRow(difficulty);
    }

    const gap = 0.17 - 0.07 * difficulty + Math.random() * 0.03;
    s.nextSpawnZ = s.distanceTraveled + gap + extraGap;
  }

  private spawnStandardRow(difficulty: number) {
    const used = new Set<number>();
    const ringCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < ringCount; i++) {
      const lane = pick(this.freeLanes(used));
      used.add(lane);
      this.pushEntity('ring', lane, FAR_Z + i * RING_SPACING);
    }

    if (Math.random() < 0.22 + difficulty * 0.3) {
      const lane = pick(this.freeLanes(used));
      this.pushEntity('spike', lane, FAR_Z + 0.04);
      if (difficulty > 0.35 && Math.random() < 0.18) {
        const second = this.freeLanes(new Set([...used, lane]));
        if (second.length > 0) this.pushEntity('spike', pick(second), FAR_Z + 0.06);
      }
    }
  }

  private spawnStampede() {
    const s = this.state;
    const gapLane = Math.floor(Math.random() * LANE_COUNT);
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      if (lane === gapLane) {
        this.pushEntity('ring', lane, FAR_Z);
        this.pushEntity('ring', lane, FAR_Z + RING_SPACING);
      } else {
        this.pushEntity('rhino', lane, FAR_Z + 0.02);
      }
    }
    this.lastSetPieceZ = s.distanceTraveled;
    this.floatText('STAMPEDE INCOMING!', '#fbbf24', 26, this.h * 0.3);
    audio.play('thud');
  }

  private spawnBoulder() {
    const s = this.state;
    const lane = Math.floor(Math.random() * LANE_COUNT);
    this.pushEntity('boulder', lane, FAR_Z);
    for (const other of this.freeLanes(new Set([lane]))) {
      if (Math.random() < 0.6) this.pushEntity('ring', other, FAR_Z + 0.2);
    }
    this.lastSetPieceZ = s.distanceTraveled;
    this.floatText('BOULDER!', '#d6d3d1', 26, this.h * 0.3);
  }

  private pushEntity(kind: EntityKind, lane: number, z: number, power?: PowerType) {
    const s = this.state;
    s.entities.push({ id: s.entityCounter++, kind, lane, z, spin: 0, power, collected: false });
  }

  private freeLanes(used: Set<number>): number[] {
    return Array.from({ length: LANE_COUNT }, (_, i) => i).filter((l) => !used.has(l));
  }

  private collectRing() {
    const s = this.state;
    s.rings++;
    s.combo++;
    s.comboTimer = COMBO_TIMEOUT;
    s.maxCombo = Math.max(s.maxCombo, s.combo);

    const mult = this.hasPower('multiplier') ? 2 : 1;
    const treasure = this.char.ability.id === 'treasure' ? 1.5 : 1;
    const comboBonus = 1 + Math.floor(s.combo / 5) * 0.5;
    s.bonusScore += Math.floor(10 * mult * comboBonus * treasure);

    audio.play('ring', { combo: s.combo });
    const p = projectPoint(this.w, this.h, s.player.lane, PLAYER_Z, s.player.y);
    const burstY = p.y - figureUnit(this.w, this.h, p.s) * 4;
    this.spawnParticles(p.x, burstY, 10, '#fbbf24', 4);

    if (s.combo % 10 === 0) {
      audio.milestone(s.combo / 10);
      this.floatText(`${s.combo}x COMBO!`, '#fbbf24', 30, this.h * 0.5);
      this.spawnParticles(p.x, burstY, 28, '#fde68a', 6);
      s.screenShake = Math.max(s.screenShake, 4);
    }
  }

  private collectPower(type: PowerType) {
    const s = this.state;
    const existing = s.powers.find((p) => p.type === type);
    if (existing) existing.remaining = existing.total;
    else s.powers.push({ type, remaining: POWER_DURATION, total: POWER_DURATION });

    audio.play('powerup');
    this.floatText(POWER_NAMES[type], POWER_COLORS[type], 26, this.h * 0.45);
    const p = projectPoint(this.w, this.h, s.player.lane, PLAYER_Z, s.player.y);
    this.spawnParticles(p.x, p.y - figureUnit(this.w, this.h, p.s) * 4, 20, POWER_COLORS[type], 6);
  }

  private breakShield() {
    const s = this.state;
    s.powers = s.powers.filter((p) => p.type !== 'shield');
    s.screenShake = 12;
    s.hitFlash = 0.6;
    audio.play('shield');
    const p = projectPoint(this.w, this.h, s.player.lane, PLAYER_Z, s.player.y);
    this.spawnParticles(p.x, p.y - figureUnit(this.w, this.h, p.s) * 4, 30, '#4ade80', 8);
    this.floatText('SHIELD BROKEN', '#4ade80', 22, this.h * 0.5);
  }

  private powerSmash() {
    const s = this.state;
    const lane = s.player.targetLane;
    let hits = 0;
    for (const e of s.entities) {
      if (!e.collected && SMASHABLE.has(e.kind) && Math.abs(e.lane - lane) < 0.5 && e.z > HIT_NEAR && e.z < 0.5) {
        e.collected = true;
        this.burstAt(e);
        hits++;
      }
    }
    s.player.smashTimer = SMASH_DURATION;
    s.screenShake = Math.max(s.screenShake, 8);
    audio.play('smash');
    this.floatText(hits > 0 ? `SMASHED ${hits}!` : 'SMASH!', '#fb923c', 26, this.h * 0.55);
  }

  private roundhouseKick() {
    const s = this.state;
    const lane = s.player.targetLane;
    for (const e of s.entities) {
      if (!e.collected && SMASHABLE.has(e.kind) && Math.abs(e.lane - lane) < 1.5 && e.z > HIT_NEAR && e.z < 0.6) {
        e.collected = true;
        this.burstAt(e);
      }
    }
    s.player.invuln = ROUNDHOUSE_INVULN;
    s.player.kickTimer = KICK_DURATION;
    s.screenShake = Math.max(s.screenShake, 6);
    audio.play('smash');
    this.floatText('ROUNDHOUSE!', '#f472b6', 26, this.h * 0.55);
  }

  private burstAt(e: Entity) {
    const p = projectPoint(this.w, this.h, e.lane, Math.max(0, e.z));
    const color = e.kind === 'boulder' ? '#a8a29e' : '#e2e8f0';
    this.spawnParticles(p.x, p.y - figureUnit(this.w, this.h, p.s) * 2.5, 22, color, 6);
  }

  private emitDust(e: Entity) {
    const p = projectPoint(this.w, this.h, e.lane, e.z);
    this.spawnParticles(p.x, p.y, 2, 'rgba(168,162,158,0.8)', 3 + p.s * 6);
  }

  private moveLane(dir: number) {
    const p = this.state.player;
    const next = clamp(p.targetLane + dir, 0, LANE_COUNT - 1);
    if (next !== p.targetLane) {
      p.targetLane = next;
      audio.play('lane');
    }
  }

  private jump() {
    const p = this.state.player;
    if (!p.jumping) {
      p.vy = JUMP_VELOCITY;
      p.jumping = true;
      p.jumpsLeft = this.extraJumps;
      audio.play('jump');
    } else if (p.jumpsLeft > 0) {
      p.vy = JUMP_VELOCITY;
      p.jumpsLeft--;
      audio.play('jump');
      const pos = projectPoint(this.w, this.h, p.lane, PLAYER_Z, p.y);
      this.spawnParticles(pos.x, pos.y, 8, '#e2e8f0', 4);
    }
  }

  private hasPower(type: PowerType) {
    return this.state.powers.some((p) => p.type === type);
  }

  private tickEffects(dt: number) {
    const s = this.state;
    for (const p of s.particles) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += p.gravity * dt * 60;
      p.life -= dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0);
    for (const f of s.floats) {
      f.y += f.vy * dt * 60;
      f.life -= dt;
    }
    s.floats = s.floats.filter((f) => f.life > 0);
    s.screenShake = Math.max(0, s.screenShake - dt * 40);
    s.hitFlash = Math.max(0, s.hitFlash - dt * 3);
  }

  private spawnParticles(x: number, y: number, count: number, color: string, size: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        color,
        size: size * (0.5 + Math.random() * 0.6),
        gravity: 0.15,
      });
    }
  }

  private floatText(text: string, color: string, size: number, y = this.h * 0.45) {
    this.state.floats.push({ x: this.w / 2, y, text, color, life: 1.2, maxLife: 1.2, vy: -1.2, size });
  }

  private emitHud() {
    const s = this.state;
    const cooldown = this.char.ability.cooldown;
    this.cb.onHud({
      score: s.score,
      rings: s.rings,
      distance: Math.floor(s.distance),
      combo: s.combo,
      lives: s.lives,
      powers: s.powers.map((p) => ({ ...p })),
      abilityReady: s.abilityCooldown <= 0,
      abilityProgress: cooldown > 0 ? 1 - s.abilityCooldown / cooldown : 1,
    });
  }

  private endGame() {
    const s = this.state;
    if (!s.running) return;
    audio.play('gameover');
    audio.stopMusic();
    this.cb.onGameOver({
      score: s.score,
      distance: Math.floor(s.distance),
      rings: s.rings,
      topSpeed: Math.round(s.topSpeed * 100),
      maxCombo: s.maxCombo,
      characterId: this.char.id,
    });
  }
}
