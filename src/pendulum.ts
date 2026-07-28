import type { MetronomeEngine } from "./audio";

const AMPLITUDE_DEG = 26;

/**
 * Drives the arm's rotation from the same audio clock that schedules the
 * clicks, so each swing extreme lands exactly on a beat. Cosine easing over
 * the [prev, next) interval gives zero angular velocity at the extremes and
 * maximum through the center, like a real pendulum.
 */
export class Pendulum {
  private rafId: number | null = null;
  private resting = true;
  private readonly stageEl: HTMLElement;
  private readonly armEl: HTMLElement;
  private readonly shadowEl: HTMLElement;
  private readonly engine: MetronomeEngine;
  private rodLength = 0;
  private readonly resizeObserver: ResizeObserver;

  constructor(stageEl: HTMLElement, engine: MetronomeEngine) {
    this.stageEl = stageEl;
    this.armEl = stageEl.querySelector<HTMLElement>(".pendulum-arm")!;
    this.shadowEl = stageEl.querySelector<HTMLElement>(".pendulum-shadow")!;
    this.engine = engine;

    // The rod's length is responsive (clamp/vh), so the shadow's travel is
    // measured rather than guessed, and re-measured on layout change instead
    // of every frame.
    this.rodLength = this.armEl.offsetHeight;
    this.resizeObserver = new ResizeObserver(() => {
      this.rodLength = this.armEl.offsetHeight;
    });
    this.resizeObserver.observe(this.armEl);
  }

  start(): void {
    if (this.rafId !== null) return;
    const loop = () => {
      this.tick();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private tick(): void {
    const playing = this.engine.isPlaying;
    let angle = 0;

    if (playing) {
      const now = this.engine.getCurrentTime();
      const bracket = this.engine.getBracketingBeats(now);
      if (bracket) {
        const { prev, next } = bracket;
        const interval = next.time - prev.time;
        const f = interval > 0 ? Math.min(1, Math.max(0, (now - prev.time) / interval)) : 0;
        const side = prev.globalIndex % 2 === 0 ? 1 : -1;
        angle = side * AMPLITUDE_DEG * Math.cos(Math.PI * f);
      }
    }

    // Only transition (ease) while coming to rest; while playing, the
    // per-frame angle updates ARE the motion, so a CSS transition would lag.
    const shouldRest = !playing;
    if (shouldRest !== this.resting) {
      this.resting = shouldRest;
      this.stageEl.classList.toggle("is-resting", shouldRest);
    }

    this.stageEl.style.setProperty("--pendulum-angle", `${angle}deg`);

    // The shadow is a separate, unrotated element, so it can't inherit the
    // arm's rotate(). Mirror the bob's displacement by hand to keep the
    // shadow under it: x' = -rodLength * sin(angle).
    const shiftPx = -this.rodLength * Math.sin((angle * Math.PI) / 180);
    this.shadowEl.style.transform = `translateX(calc(-50% + ${shiftPx}px))`;
  }
}
