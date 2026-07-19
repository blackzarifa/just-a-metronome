import "./style.css";
import { MetronomeEngine, TapTempo } from "./audio";
import { Pendulum } from "./pendulum";
import { tempoMarkingFor } from "./tempo";
import {
  loadState,
  saveBpm,
  saveBeatsPerBar,
  saveTheme,
  MIN_BPM,
  MAX_BPM,
  MIN_BEATS_PER_BAR,
  MAX_BEATS_PER_BAR,
  type Theme,
} from "./storage";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="backdrop-grain" aria-hidden="true"></div>
  <div class="backdrop-glow" aria-hidden="true"></div>

  <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch to dark theme">
    <svg class="icon icon-sun" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2"></circle>
      <g class="sun-rays">
        <line x1="12" y1="1.5" x2="12" y2="4.5"></line>
        <line x1="12" y1="19.5" x2="12" y2="22.5"></line>
        <line x1="1.5" y1="12" x2="4.5" y2="12"></line>
        <line x1="19.5" y1="12" x2="22.5" y2="12"></line>
        <line x1="4.4" y1="4.4" x2="6.5" y2="6.5"></line>
        <line x1="17.5" y1="17.5" x2="19.6" y2="19.6"></line>
        <line x1="4.4" y1="19.6" x2="6.5" y2="17.5"></line>
        <line x1="17.5" y1="6.5" x2="19.6" y2="4.4"></line>
      </g>
    </svg>
    <svg class="icon icon-moon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.5 14.7A8.5 8.5 0 1 1 9.3 3.5a7 7 0 0 0 11.2 11.2Z"></path>
    </svg>
  </button>

  <main id="tap-zone" class="tap-zone" role="button" tabindex="0" aria-pressed="false"
        aria-label="Tap, click, or press space to start or stop the metronome">
    <div class="tempo-marking">
      <p id="marking-name" class="marking-name">Moderato</p>
      <p id="marking-gloss" class="marking-gloss">at a moderate pace</p>
    </div>

    <div id="pendulum-stage" class="pendulum-stage" aria-hidden="true">
      <div class="pendulum-shadow"></div>
      <div class="pendulum-pivot"></div>
      <div class="pendulum-arm">
        <div class="pendulum-rod"></div>
        <div class="pendulum-bob"></div>
      </div>
    </div>
    <p id="tap-state" class="tap-state">tap to start</p>

    <div class="bpm-display">
      <span id="bpm-number" class="bpm-number">96</span>
      <span class="bpm-unit">BPM</span>
    </div>

    <div id="beat-dots" class="beat-dots" aria-hidden="true"></div>
  </main>

  <section class="control-panel">
    <div class="control-row">
      <button id="bpm-minus" class="icon-btn" type="button" aria-label="Decrease tempo by 1 BPM">&minus;</button>
      <input id="bpm-slider" class="tempo-slider" type="range"
             min="${MIN_BPM}" max="${MAX_BPM}" step="1" value="96"
             aria-label="Tempo in beats per minute">
      <button id="bpm-plus" class="icon-btn" type="button" aria-label="Increase tempo by 1 BPM">&plus;</button>
    </div>

    <div class="control-row secondary-row">
      <button id="tap-button" class="tap-button" type="button">TAP</button>
      <div class="beats-control" role="group" aria-label="Beats per bar">
        <button id="beats-minus" class="icon-btn" type="button" aria-label="Decrease beats per bar">&minus;</button>
        <span class="beats-value"><span id="beats-number" class="beats-number">4</span> beats</span>
        <button id="beats-plus" class="icon-btn" type="button" aria-label="Increase beats per bar">&plus;</button>
      </div>
    </div>
  </section>

  <p class="key-legend" aria-hidden="true">
    <span class="hint"><kbd>Space</kbd> start/stop</span>
    <span class="hint"><kbd>&larr;</kbd><kbd>&rarr;</kbd> tempo</span>
    <span class="hint"><kbd>&uarr;</kbd><kbd>&darr;</kbd> beats</span>
    <span class="hint"><kbd>T</kbd> tap</span>
  </p>
`;

const tapZoneEl = document.querySelector<HTMLElement>("#tap-zone")!;
const tapStateEl = document.querySelector<HTMLElement>("#tap-state")!;
const pendulumStageEl = document.querySelector<HTMLElement>("#pendulum-stage")!;
const bpmNumberEl = document.querySelector<HTMLElement>("#bpm-number")!;
const markingNameEl = document.querySelector<HTMLElement>("#marking-name")!;
const markingGlossEl = document.querySelector<HTMLElement>("#marking-gloss")!;
const beatDotsEl = document.querySelector<HTMLElement>("#beat-dots")!;
const bpmSliderEl = document.querySelector<HTMLInputElement>("#bpm-slider")!;
const bpmMinusEl = document.querySelector<HTMLButtonElement>("#bpm-minus")!;
const bpmPlusEl = document.querySelector<HTMLButtonElement>("#bpm-plus")!;
const beatsNumberEl = document.querySelector<HTMLElement>("#beats-number")!;
const beatsMinusEl = document.querySelector<HTMLButtonElement>("#beats-minus")!;
const beatsPlusEl = document.querySelector<HTMLButtonElement>("#beats-plus")!;
const tapButtonEl = document.querySelector<HTMLButtonElement>("#tap-button")!;
const themeToggleEl = document.querySelector<HTMLButtonElement>("#theme-toggle")!;

const engine = new MetronomeEngine();
const tapTempo = new TapTempo();
pendulumStageEl.classList.add("is-resting");
const pendulum = new Pendulum(pendulumStageEl, engine);

const initial = loadState();
let bpm = initial.bpm;
let beatsPerBar = initial.beatsPerBar;
let dotEls: HTMLElement[] = [];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function renderBeatDots(): void {
  beatDotsEl.innerHTML = "";
  dotEls = [];
  for (let i = 0; i < beatsPerBar; i++) {
    const dot = document.createElement("span");
    dot.className = "beat-dot";
    if (i === 0 && beatsPerBar >= 2) dot.classList.add("is-accent");
    beatDotsEl.appendChild(dot);
    dotEls.push(dot);
  }
}

function applyBpm(newBpm: number, persist: boolean): void {
  bpm = clamp(Math.round(newBpm), MIN_BPM, MAX_BPM);
  engine.setBpm(bpm);
  bpmNumberEl.textContent = String(bpm);
  bpmSliderEl.value = String(bpm);
  const fillPercent = ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 100;
  bpmSliderEl.style.setProperty("--fill", `${fillPercent}%`);
  const marking = tempoMarkingFor(bpm);
  markingNameEl.textContent = marking.name;
  markingGlossEl.textContent = marking.gloss;
  if (persist) saveBpm(bpm);
}

function applyBeatsPerBar(newBeats: number, persist: boolean): void {
  beatsPerBar = clamp(Math.round(newBeats), MIN_BEATS_PER_BAR, MAX_BEATS_PER_BAR);
  engine.setBeatsPerBar(beatsPerBar);
  beatsNumberEl.textContent = String(beatsPerBar);
  renderBeatDots();
  if (persist) saveBeatsPerBar(beatsPerBar);
}

function handleToggle(): void {
  engine.toggle();
  tapZoneEl.setAttribute("aria-pressed", String(engine.isPlaying));
  tapZoneEl.classList.toggle("is-playing", engine.isPlaying);
  tapStateEl.textContent = engine.isPlaying ? "tap to stop" : "tap to start";
}

function handleTap(): void {
  const estimate = tapTempo.tap();
  if (estimate !== null) applyBpm(estimate, true);
}

function pulseTapButton(): void {
  tapButtonEl.classList.remove("pulse");
  // Force reflow so the pulse animation can restart on consecutive taps.
  void tapButtonEl.offsetWidth;
  tapButtonEl.classList.add("pulse");
}

function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggleEl.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
  );
  saveTheme(theme);
}

// --- wire up interactions ---

// Anywhere on the page starts/stops the beat, except the control panel and
// theme toggle, which have their own click behavior — delegated on #app
// rather than a listener per element, so it also covers empty space outside
// the tap zone (margins, the gap around the panel, etc).
app.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest(".control-panel") || target.closest(".theme-toggle")) return;
  handleToggle();
});
// Space is handled by the single window-level listener below (it already
// covers the tap zone whenever a button isn't focused) — a second listener
// here would double-fire on Space since this element is inside that bubble
// path, toggling start then immediately stop. Enter isn't Space's concern,
// so it's handled locally per standard role="button" semantics.
tapZoneEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!e.repeat) handleToggle();
  }
});

bpmSliderEl.addEventListener("input", () => {
  applyBpm(Number(bpmSliderEl.value), true);
});
bpmMinusEl.addEventListener("click", () => applyBpm(bpm - 1, true));
bpmPlusEl.addEventListener("click", () => applyBpm(bpm + 1, true));
beatsMinusEl.addEventListener("click", () => applyBeatsPerBar(beatsPerBar - 1, true));
beatsPlusEl.addEventListener("click", () => applyBeatsPerBar(beatsPerBar + 1, true));
tapButtonEl.addEventListener("click", () => {
  handleTap();
  pulseTapButton();
});

themeToggleEl.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
});

window.addEventListener("keydown", (e) => {
  const isButtonFocused = document.activeElement instanceof HTMLButtonElement;
  const key = e.key;

  if (key === " " || key === "Spacebar") {
    if (isButtonFocused) return; // let the focused button handle its own activation
    e.preventDefault();
    if (!e.repeat) handleToggle();
    return;
  }

  const lower = key.toLowerCase();
  const tempoStep = e.shiftKey ? 5 : 1;

  if (lower === "h" || lower === "a" || key === "ArrowLeft") {
    e.preventDefault();
    applyBpm(bpm - tempoStep, true);
  } else if (lower === "l" || lower === "d" || key === "ArrowRight") {
    e.preventDefault();
    applyBpm(bpm + tempoStep, true);
  } else if (lower === "j" || lower === "s" || key === "ArrowDown") {
    e.preventDefault();
    applyBeatsPerBar(beatsPerBar - 1, true);
  } else if (lower === "k" || lower === "w" || key === "ArrowUp") {
    e.preventDefault();
    applyBeatsPerBar(beatsPerBar + 1, true);
  } else if (lower === "t") {
    if (!e.repeat) handleTap();
  }
});

// Flash the current beat's dot in sync with the audio clock.
function flashDueBeats(): void {
  const now = engine.getCurrentTime();
  const due = engine.isPlaying ? engine.drainDueBeats(now) : [];
  for (const beat of due) {
    const dot = dotEls[beat.beatNumber];
    if (!dot) continue;
    dot.classList.remove("is-active");
    void dot.offsetWidth;
    dot.classList.add("is-active");
    window.setTimeout(() => dot.classList.remove("is-active"), 140);
  }
  requestAnimationFrame(flashDueBeats);
}

// --- initial render ---

applyBpm(bpm, false);
applyBeatsPerBar(beatsPerBar, false);
pendulum.start();
requestAnimationFrame(flashDueBeats);
