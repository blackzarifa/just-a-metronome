export interface TempoMarking {
  name: string;
  gloss: string;
}

// Ranges cover the app's full 30-260 BPM span with no gaps, adapted from
// standard tempo-marking tables to the nine terms requested.
const MARKINGS: Array<{ maxBpm: number } & TempoMarking> = [
  { maxBpm: 45, name: "Largo", gloss: "very slow and broad" },
  { maxBpm: 59, name: "Adagio", gloss: "slow and stately" },
  { maxBpm: 75, name: "Andante", gloss: "at a walking pace" },
  { maxBpm: 91, name: "Moderato", gloss: "at a moderate pace" },
  { maxBpm: 101, name: "Allegretto", gloss: "moderately fast" },
  { maxBpm: 139, name: "Allegro", gloss: "fast and bright" },
  { maxBpm: 171, name: "Vivace", gloss: "lively and fast" },
  { maxBpm: 199, name: "Presto", gloss: "very fast" },
  { maxBpm: Infinity, name: "Prestissimo", gloss: "as fast as possible" },
];

export function tempoMarkingFor(bpm: number): TempoMarking {
  const found = MARKINGS.find((m) => bpm <= m.maxBpm);
  return found ?? MARKINGS[MARKINGS.length - 1]!;
}
