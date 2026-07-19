export const DEFAULT_BPM = 96;
export const DEFAULT_BEATS_PER_BAR = 4;
export const MIN_BPM = 30;
export const MAX_BPM = 260;
export const MIN_BEATS_PER_BAR = 1;
export const MAX_BEATS_PER_BAR = 12;

const KEYS = {
  bpm: "metronome:bpm",
  beats: "metronome:beats",
  theme: "metronome:theme",
} as const;

export type Theme = "light" | "dark";

export interface PersistedState {
  bpm: number;
  beatsPerBar: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function loadState(): PersistedState {
  const rawBpm = Number(localStorage.getItem(KEYS.bpm));
  const rawBeats = Number(localStorage.getItem(KEYS.beats));

  const bpm = Number.isFinite(rawBpm) && rawBpm > 0 ? clamp(Math.round(rawBpm), MIN_BPM, MAX_BPM) : DEFAULT_BPM;
  const beatsPerBar =
    Number.isFinite(rawBeats) && rawBeats > 0
      ? clamp(Math.round(rawBeats), MIN_BEATS_PER_BAR, MAX_BEATS_PER_BAR)
      : DEFAULT_BEATS_PER_BAR;

  return { bpm, beatsPerBar };
}

export function saveBpm(bpm: number): void {
  localStorage.setItem(KEYS.bpm, String(bpm));
}

export function saveBeatsPerBar(beatsPerBar: number): void {
  localStorage.setItem(KEYS.beats, String(beatsPerBar));
}

export function loadTheme(): Theme {
  const raw = localStorage.getItem(KEYS.theme);
  return raw === "dark" || raw === "light" ? raw : "light";
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(KEYS.theme, theme);
}
