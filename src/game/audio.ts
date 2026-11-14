

const MUSIC_STEP_SEC = 0.18;

type SfxName =
  | 'ring'
  | 'hit'
  | 'jump'
  | 'lane'
  | 'powerup'
  | 'shield'
  | 'gameover'
  | 'click'
  | 'start'
  | 'thud'
  | 'smash';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicStartTime = 0;
  private musicTimer: number | null = null;
  private musicStep = 0;
  public muted = false;
  public sfxVolume = 0.5;
  public musicVolume = 0.22;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = v;
  }

  setMusicVolume(v: number) {
    this.musicVolume = v;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  private now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType = 'sine',
    vol = 0.5,
    glide?: number,
    delay = 0,
  ) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const t = this.now() + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glide !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, glide), t + dur);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * this.sfxVolume, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.4, filterFreq = 1200, delay = 0) {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const t = this.now() + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.value = vol * this.sfxVolume;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start(t);
    src.stop(t + dur);
  }

  play(name: SfxName, opts?: { combo?: number }) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    switch (name) {
      case 'ring': {
        const combo = opts?.combo ?? 0;
        const base = 880 + Math.min(combo, 12) * 40;
        this.tone(base, 0.08, 'sine', 0.35, base * 1.5);
        this.tone(base * 2, 0.06, 'triangle', 0.15, undefined, 0.01);
        break;
      }
      case 'thud':
        this.tone(90, 0.35, 'sine', 0.6, 40);
        this.noise(0.12, 0.35, 500);
        break;
      case 'smash':
        this.noise(0.25, 0.5, 2000);
        this.tone(260, 0.25, 'sawtooth', 0.3, 70);
        break;
      case 'hit':
        this.noise(0.18, 0.55, 800);
        this.tone(180, 0.22, 'sawtooth', 0.4, 60);
        break;
      case 'lane':
        this.tone(420, 0.05, 'sine', 0.18, 520);
        break;
      case 'jump':
        this.tone(300, 0.14, 'sine', 0.25, 600);
        break;
      case 'powerup':
        this.tone(523, 0.08, 'square', 0.25);
        this.tone(659, 0.08, 'square', 0.25, undefined, 0.07);
        this.tone(784, 0.12, 'square', 0.25, undefined, 0.14);
        break;
      case 'shield':
        this.tone(200, 0.3, 'sine', 0.3, 600);
        this.noise(0.2, 0.2, 2400);
        break;
      case 'gameover':
        this.tone(440, 0.15, 'sawtooth', 0.3, 380);
        this.tone(330, 0.18, 'sawtooth', 0.3, 280, 0.12);
        this.tone(220, 0.4, 'sawtooth', 0.3, 110, 0.28);
        break;
      case 'click':
        this.tone(600, 0.04, 'square', 0.15, 800);
        break;
      case 'start':
        this.tone(392, 0.08, 'square', 0.25);
        this.tone(523, 0.08, 'square', 0.25, undefined, 0.07);
        this.tone(784, 0.16, 'square', 0.25, undefined, 0.14);
        break;
    }
  }

  startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    this.musicStartTime = this.now();
    const bass = [55, 55, 73.42, 65.41];
    const lead = [220, 0, 277, 0, 330, 0, 277, 0, 220, 0, 196, 0, 247, 0, 0, 0];
    const interval = MUSIC_STEP_SEC * 1000;

    const playStep = () => {
      if (!this.ctx || !this.musicGain) return;
      const t = this.now();
      const step = this.musicStep % 16;

      const b = bass[Math.floor(step / 4) % bass.length];
      if (b > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = b;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.2);
      }

      const l = lead[step];
      if (l > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = l;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.16);
      }

      this.musicStep++;
    };

    this.musicTimer = window.setInterval(playStep, interval);
  }

  milestone(level: number) {
    if (!this.ctx || this.muted) return;
    const now = this.now();
    const elapsed = now - this.musicStartTime;
    const onBeat = Math.max(now, this.musicStartTime + Math.ceil(elapsed / MUSIC_STEP_SEC) * MUSIC_STEP_SEC);
    const delay = onBeat - now;
    const ratio = Math.pow(2, (Math.min(level, 6) * 2) / 12);
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => this.tone(f * ratio, 0.16, 'triangle', 0.3, undefined, delay + i * 0.06));
    this.tone(1046.5 * ratio, 0.5, 'sine', 0.25, undefined, delay + notes.length * 0.06);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicStep = 0;
  }
}

export const audio = new AudioEngine();
