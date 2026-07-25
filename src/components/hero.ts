import "./hero.css";
import { MIN_BPM, MAX_BPM } from "../storage";

export interface Hero {
  el: HTMLElement;
  tapZoneEl: HTMLElement;
  tapStateEl: HTMLElement;
  pendulumStageEl: HTMLElement;
  bpmNumberEl: HTMLElement;
  markingNameEl: HTMLElement;
  markingGlossEl: HTMLElement;
  beatDotsEl: HTMLElement;
  bpmSliderEl: HTMLInputElement;
  bpmMinusEl: HTMLButtonElement;
  bpmPlusEl: HTMLButtonElement;
  beatsNumberEl: HTMLElement;
  beatsMinusEl: HTMLButtonElement;
  beatsPlusEl: HTMLButtonElement;
  tapButtonEl: HTMLButtonElement;
}

export function createHero(): Hero {
  const el = document.createElement("div");
  el.className = "hero";
  el.innerHTML = `
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
  `;

  return {
    el,
    tapZoneEl: el.querySelector<HTMLElement>("#tap-zone")!,
    tapStateEl: el.querySelector<HTMLElement>("#tap-state")!,
    pendulumStageEl: el.querySelector<HTMLElement>("#pendulum-stage")!,
    bpmNumberEl: el.querySelector<HTMLElement>("#bpm-number")!,
    markingNameEl: el.querySelector<HTMLElement>("#marking-name")!,
    markingGlossEl: el.querySelector<HTMLElement>("#marking-gloss")!,
    beatDotsEl: el.querySelector<HTMLElement>("#beat-dots")!,
    bpmSliderEl: el.querySelector<HTMLInputElement>("#bpm-slider")!,
    bpmMinusEl: el.querySelector<HTMLButtonElement>("#bpm-minus")!,
    bpmPlusEl: el.querySelector<HTMLButtonElement>("#bpm-plus")!,
    beatsNumberEl: el.querySelector<HTMLElement>("#beats-number")!,
    beatsMinusEl: el.querySelector<HTMLButtonElement>("#beats-minus")!,
    beatsPlusEl: el.querySelector<HTMLButtonElement>("#beats-plus")!,
    tapButtonEl: el.querySelector<HTMLButtonElement>("#tap-button")!,
  };
}
