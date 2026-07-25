import "./style.css";
import { MetronomeEngine, TapTempo } from "./audio";
import { Pendulum } from "./pendulum";
import { tempoMarkingFor } from "./tempo";
import { createCornerControls } from "./components/corner-controls";
import {
  loadState,
  saveBpm,
  saveBeatsPerBar,
  MIN_BPM,
  MAX_BPM,
  MIN_BEATS_PER_BAR,
  MAX_BEATS_PER_BAR,
} from "./storage";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="backdrop-grain" aria-hidden="true"></div>
  <div class="backdrop-glow" aria-hidden="true"></div>

  <div class="hero">
  <main id="tap-zone" class="tap-zone" role="button" tabindex="0" aria-pressed="false"
        aria-label="Tap, click, or press space to start or stop the metronome">
    <hgroup class="tempo-marking">
      <h1 id="marking-name" class="marking-name">Moderato</h1>
      <p id="marking-gloss" class="marking-gloss">at a moderate pace</p>
    </hgroup>

    <div id="pendulum-stage" class="pendulum-stage" aria-hidden="true">
      <div class="pendulum-shadow"></div>
      <div class="pendulum-pivot"></div>
      <div class="pendulum-arm">
        <div class="pendulum-rod"></div>
        <div class="pendulum-bob"></div>
      </div>
    </div>
    <p id="tap-state" class="tap-state">tap to start</p>

    <output class="bpm-display" for="bpm-slider" aria-live="off">
      <span id="bpm-number" class="bpm-number">96</span>
      <span class="bpm-unit">BPM</span>
    </output>

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
  </div>

  <div class="scroll-hint-region">
    <a id="scroll-hint" class="scroll-hint" href="#links"
       aria-label="More: source code and support">
      <svg class="icon icon-chevron" viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </a>
  </div>
`;

// Second screen (source + support links) lives as a sibling of #app so it
// sits outside the click-to-start zone and reveals only on deliberate scroll.
const linksSection = document.createElement("section");
linksSection.id = "links";
linksSection.className = "links-section";
linksSection.innerHTML = `
  <div class="links-inner">
    <hgroup class="colophon">
      <h2 class="colophon-name">Just a Metronome</h2>
      <p class="colophon-gloss">no ads. no subscriptions. just a metronome.</p>
    </hgroup>
    <hr class="hairline">
    <nav class="link-row" aria-label="Links">
    <a class="link-card" href="https://github.com/blackzarifa/just-a-metronome"
       target="_blank" rel="noopener noreferrer">
      <svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.48
                 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62
                 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07
                 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 2.5-.34c.85 0 1.71.12 2.5.34
                 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9
                 0 1.37-.01 2.480-.01 2.82 0 .27.18.59.69.48A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"></path>
      </svg>
      <div class="link-text">
        <span class="link-label">GitHub</span>
        <span class="link-sub">Source &amp; issues</span>
      </div>
    </a>

    <a class="link-card" href="#" data-placeholder="donation"
       target="_blank" rel="noopener noreferrer">
      <svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8h13a3 3 0 0 1 0 6h-1"></path>
        <path d="M4 8v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8z"></path>
        <line x1="7" y1="2.5" x2="7" y2="4.5"></line>
        <line x1="10.5" y1="2.5" x2="10.5" y2="4.5"></line>
        <line x1="14" y1="2.5" x2="14" y2="4.5"></line>
      </svg>
      <div class="link-text">
        <span class="link-label">Buy me a coffee</span>
        <span class="link-sub">If it helped</span>
      </div>
    </a>
    </nav>
  </div>
`;
document.body.appendChild(linksSection);

const cornerControls = createCornerControls();
app.querySelector(".hero")!.before(cornerControls.el);

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
const scrollHintEl = document.querySelector<HTMLAnchorElement>("#scroll-hint")!;

// Always open on the metronome (first screen). The browser otherwise restores
// the previous scroll position, and a leftover #links hash would jump straight
// to the links screen — both would drop a returning visitor onto the wrong page.
history.scrollRestoration = "manual";
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
window.scrollTo({ top: 0, left: 0, behavior: "instant" });

// Reveal the links screen without writing a #links hash into the URL (which is
// what made the next load reopen there).
scrollHintEl.addEventListener("click", e => {
  e.preventDefault();
  linksSection.scrollIntoView({ behavior: "smooth" });
});

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

function updateSliderFill(): void {
  const f = (bpm - MIN_BPM) / (MAX_BPM - MIN_BPM);
  bpmSliderEl.style.setProperty("--fill", `${f * 100}%`);
}

function applyBpm(newBpm: number, persist: boolean): void {
  bpm = clamp(Math.round(newBpm), MIN_BPM, MAX_BPM);
  engine.setBpm(bpm);
  bpmNumberEl.textContent = String(bpm);
  bpmSliderEl.value = String(bpm);
  updateSliderFill();
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

// --- wire up interactions ---

// Anywhere on the page starts/stops the beat, except the control panel and
// corner buttons, which have their own click behavior — delegated on #app
// rather than a listener per element, so it also covers empty space outside
// the tap zone (margins, the gap around the panel, etc). A click while the
// help popover is open just closes it, rather than also toggling playback
// underneath.
app.addEventListener("click", e => {
  const target = e.target as HTMLElement;
  if (target.closest(".control-panel") || target.closest(".corner-btn") || target.closest(".scroll-hint")) return;
  if (cornerControls.isHelpOpen()) {
    if (!target.closest(".help-popover")) cornerControls.closeHelp(false);
    return;
  }
  handleToggle();
});
// Space is handled by the single window-level listener below (it already
// covers the tap zone whenever a button isn't focused) — a second listener
// here would double-fire on Space since this element is inside that bubble
// path, toggling start then immediately stop. Enter isn't Space's concern,
// so it's handled locally per standard role="button" semantics.
tapZoneEl.addEventListener("keydown", e => {
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
window.addEventListener("resize", updateSliderFill);
beatsMinusEl.addEventListener("click", () => applyBeatsPerBar(beatsPerBar - 1, true));
beatsPlusEl.addEventListener("click", () => applyBeatsPerBar(beatsPerBar + 1, true));
tapButtonEl.addEventListener("click", () => {
  handleTap();
  pulseTapButton();
});

window.addEventListener("keydown", e => {
  const isButtonFocused = document.activeElement instanceof HTMLButtonElement;
  const key = e.key;

  if (key === "Escape") {
    cornerControls.closeHelp(true);
    return;
  }

  if (key === "?") {
    e.preventDefault();
    cornerControls.toggleHelp();
    return;
  }

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
