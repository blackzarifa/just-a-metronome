# Metronome

A small metronome web app. Vanilla TypeScript + Vite, no framework, no backend.
Timing uses the Web Audio API with a lookahead scheduler (`src/audio.ts`), not
`setInterval`, so the beat doesn't drift.

## Keyboard shortcuts

| Key               | Action                    |
| ----------------- | ------------------------- |
| `Space`           | Start / stop              |
| `h` / `←`         | Tempo −1 BPM              |
| `l` / `→`         | Tempo +1 BPM              |
| `Shift` + `h`/`←` | Tempo −5 BPM              |
| `Shift` + `l`/`→` | Tempo +5 BPM              |
| `j` / `↓`         | Beats per bar −1          |
| `k` / `↑`         | Beats per bar +1          |
| `t`               | Tap tempo (tap in rhythm) |

You can also tap/click anywhere in the upper area to start or stop, use the
`TAP` button for tap tempo, and use the on-screen −/+ steppers or slider.

BPM and beats-per-bar are saved to `localStorage` per device (no accounts, no
sync). Theme (light/dark) is saved the same way.

## Local preview

```sh
npm install
npm run dev
```

Open the printed `localhost` URL.
