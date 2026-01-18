import type { WordTiming } from './wordTimings.js';

export type PianoTileNote = {
  tMs: number;
  lane: number;
  durationMs?: number;
};

export type PianoTilesChart = {
  jobId: string;
  title?: string;
  genre?: string;
  mood?: string;
  durationMs: number;
  bpm: number;
  lanes: 4;
  audioUrl: string;
  notes: PianoTileNote[];
  createdAt?: string;
};

const DEFAULT_DURATION_MS = 120000;
const MIN_HOLD_MS = 160;
const MAX_HOLD_MS = 1200;

const TEMPO_TO_BPM: Record<string, number> = {
  slow: 80,
  moderate: 110,
  upbeat: 140,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const stableHash = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const tempoToBpm = (tempo?: string) => {
  if (!tempo) return TEMPO_TO_BPM.moderate;
  return TEMPO_TO_BPM[tempo] ?? TEMPO_TO_BPM.moderate;
};

export const buildPianoTilesChart = ({
  jobId,
  audioUrl,
  wordTimings,
  tempo,
  title,
  genre,
  mood,
  createdAt,
}: {
  jobId: string;
  audioUrl: string;
  wordTimings?: WordTiming[];
  tempo?: string;
  title?: string;
  genre?: string;
  mood?: string;
  createdAt?: string;
}): PianoTilesChart => {
  const timings = wordTimings ?? [];
  let previousLane = -1;

  const notes: PianoTileNote[] = timings.map((timing, index) => {
    const baseLane = stableHash(`${timing.word}-${index}`) % 4;
    const lane = baseLane === previousLane ? (baseLane + 1) % 4 : baseLane;
    previousLane = lane;

    const durationMs = clamp(
      Math.round((timing.end - timing.start) * 1000),
      MIN_HOLD_MS,
      MAX_HOLD_MS
    );

    return {
      tMs: Math.round(timing.start * 1000),
      lane,
      durationMs,
    };
  });

  const lastTiming = timings[timings.length - 1];
  const durationMs = lastTiming
    ? Math.ceil(lastTiming.end * 1000)
    : DEFAULT_DURATION_MS;

  return {
    jobId,
    title,
    genre,
    mood,
    durationMs,
    bpm: tempoToBpm(tempo),
    lanes: 4,
    audioUrl,
    notes,
    createdAt,
  };
};
