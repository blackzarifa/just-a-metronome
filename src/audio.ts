// Lookahead scheduler pattern (Chris Wilson, "A Tale of Two Clocks"):
// a fast setInterval "ticks" the scheduler often, but the scheduler itself
// only books work onto the Web Audio clock (audioCtx.currentTime), which is
// sample-accurate. The click itself is always timed by the audio clock, not
// by the interval callback, so setInterval jitter can never show up as drift.
const SCHEDULE_AHEAD_TIME = 0.1 // seconds: how far ahead we book clicks
const LOOKAHEAD_MS = 25 // ms: how often the scheduler wakes up to book more
const HISTORY_RETENTION_SECONDS = 4

export interface ScheduledBeat {
  time: number // audioCtx.currentTime coordinate this beat sounds at
  globalIndex: number // increments every beat, never resets (used for pendulum side)
  beatNumber: number // 0-indexed position within the bar
  isAccent: boolean
}

type AudioCtor = typeof AudioContext;

function resolveAudioContextCtor(): AudioCtor {
  const w = window as unknown as { webkitAudioContext?: AudioCtor };
  return window.AudioContext ?? w.webkitAudioContext!;
}

export class MetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private timerId: number | null = null;
  private nextNoteTime = 0;
  private currentBeat = 0;
  private globalIndex = 0;
  private history: ScheduledBeat[] = [];
  private dueQueue: ScheduledBeat[] = [];
  private playStartTime = 0;
  private _bpm = 96;
  private _beatsPerBar = 4;
  private _isPlaying = false;

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get bpm(): number {
    return this._bpm;
  }

  get beatsPerBar(): number {
    return this._beatsPerBar;
  }

  setBpm(bpm: number): void {
    this._bpm = bpm;
  }

  setBeatsPerBar(beats: number): void {
    this._beatsPerBar = beats;
  }

  /** Lazily creates the AudioContext. Must be called from a user gesture. */
  ensureAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const Ctor = resolveAudioContextCtor();
      this.audioCtx = new Ctor();
    }
    return this.audioCtx;
  }

  getCurrentTime(): number {
    return this.audioCtx ? this.audioCtx.currentTime : 0;
  }

  start(): void {
    if (this._isPlaying) return;
    const ctx = this.ensureAudioContext();
    if (ctx.state === "suspended") void ctx.resume();

    this._isPlaying = true;
    this.currentBeat = 0;
    this.globalIndex = 0;
    this.history = [];
    this.dueQueue = [];
    this.playStartTime = ctx.currentTime;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.scheduler();
    this.timerId = window.setInterval(() => this.scheduler(), LOOKAHEAD_MS);
  }

  stop(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.history = [];
    this.dueQueue = [];
  }

  toggle(): void {
    if (this._isPlaying) this.stop();
    else this.start();
  }

  /** Pops and returns any beats whose sound has already started by `now`. */
  drainDueBeats(now: number): ScheduledBeat[] {
    const due: ScheduledBeat[] = [];
    while (this.dueQueue.length && this.dueQueue[0].time <= now) {
      due.push(this.dueQueue.shift()!);
    }
    return due;
  }

  /**
   * Interpolation inputs for the pendulum: the beat that most recently
   * started (or should have, extrapolating from tempo) and the one after
   * it, so the caller can compute how far between the two `now` sits.
   */
  getBracketingBeats(
    now: number,
  ): { prev: ScheduledBeat; next: ScheduledBeat } | null {
    if (this.history.length === 0) return null;

    let prevIdx = -1;
    for (let i = this.history.length - 1; i >= 0; i--) {
      const beat = this.history[i];
      if (beat && beat.time <= now) {
        prevIdx = i;
        break;
      }
    }

    if (prevIdx === -1) {
      // Before the first beat has actually sounded, there's no real
      // previous beat to bracket against. Fabricate one centered on the
      // moment playback started (not a full interval before `next`) so the
      // pendulum begins at rest (angle 0, f=0.5) and swings out to hit the
      // first beat exactly at its extreme, instead of jumping straight to
      // a near-extreme angle on the very first rendered frame.
      const next = this.history[0]!;
      const prev: ScheduledBeat = {
        ...next,
        time: 2 * this.playStartTime - next.time,
        globalIndex: next.globalIndex - 1,
      };
      return { prev, next };
    }

    const interval = 60 / this._bpm;

    const prev = this.history[prevIdx]!;
    if (prevIdx === this.history.length - 1) {
      const next: ScheduledBeat = {
        ...prev,
        time: prev.time + interval,
        globalIndex: prev.globalIndex + 1,
      };
      return { prev, next };
    }

    return { prev, next: this.history[prevIdx + 1]! };
  }

  private scheduler(): void {
    const ctx = this.audioCtx!;
    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      this.scheduleNote(this.currentBeat, this.nextNoteTime);
      const secondsPerBeat = 60.0 / this._bpm;
      this.nextNoteTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % this._beatsPerBar;
    }
  }

  private scheduleNote(beatNumber: number, time: number): void {
    const ctx = this.audioCtx!;
    const isAccent = beatNumber === 0 && this._beatsPerBar >= 2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(isAccent ? 1600 : 1000, time);

    const peak = isAccent ? 0.9 : 0.55;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.08);
    osc.addEventListener("ended", () => {
      osc.disconnect();
      gain.disconnect();
    });

    const beat: ScheduledBeat = {
      time,
      globalIndex: this.globalIndex,
      beatNumber,
      isAccent,
    };
    this.globalIndex += 1;
    this.history.push(beat);
    this.dueQueue.push(beat);

    const cutoff = time - HISTORY_RETENTION_SECONDS;
    while (this.history.length > 2 && this.history[0]!.time < cutoff) {
      this.history.shift();
    }
  }
}

/** Rhythm-tap tempo detection: average the last few inter-tap intervals. */
export class TapTempo {
  private taps: number[] = [];
  private readonly idleResetMs = 2000;
  private readonly maxSamples = 5;

  /** Call on each tap; returns the estimated BPM, or null before 2 taps. */
  tap(nowMs: number = performance.now()): number | null {
    const last = this.taps[this.taps.length - 1];
    if (last !== undefined && nowMs - last > this.idleResetMs) {
      this.taps = [];
    }
    this.taps.push(nowMs);
    if (this.taps.length > this.maxSamples) this.taps.shift();
    if (this.taps.length < 2) return null;

    let total = 0;
    for (let i = 1; i < this.taps.length; i++) {
      total += this.taps[i]! - this.taps[i - 1]!;
    }
    const avgIntervalMs = total / (this.taps.length - 1);
    return 60000 / avgIntervalMs;
  }

  reset(): void {
    this.taps = [];
  }
}
