import "./style.css";
import { MetronomeEngine, TapTempo } from "./audio";
import { Pendulum } from "./pendulum";
import { tempoMarkingFor } from "./tempo";
import { createCornerControls } from "./components/corner-controls";
import { createLinksSection } from "./components/links-section";
import { createHero } from "./components/hero";
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
const linksSection = createLinksSection();
document.body.appendChild(linksSection.el);

const hero = createHero();
app.querySelector(".scroll-hint-region")!.before(hero.el);

const cornerControls = createCornerControls();
hero.el.before(cornerControls.el);

const {
  tapZoneEl,
  tapStateEl,
  pendulumStageEl,
  bpmNumberEl,
  markingNameEl,
  markingGlossEl,
  beatDotsEl,
  bpmSliderEl,
  bpmMinusEl,
  bpmPlusEl,
  beatsNumberEl,
  beatsMinusEl,
  beatsPlusEl,
  tapButtonEl,
} = hero;
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
  linksSection.el.scrollIntoView({ behavior: "smooth" });
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

  if (e.ctrlKey || e.metaKey || e.altKey) return; // don't hijack browser shortcuts like Ctrl+L

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

applyBpm(bpm, false);
applyBeatsPerBar(beatsPerBar, false);
pendulum.start();
requestAnimationFrame(flashDueBeats);
