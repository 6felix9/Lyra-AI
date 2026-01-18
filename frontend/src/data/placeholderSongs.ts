export type PlaceholderSong = {
  id: string;
  title: string;
  genre: string;
  mood: string;
  durationMs: number;
  bpm: number;
  createdAt: string;
};

export const placeholderSongs: PlaceholderSong[] = [
  {
    id: "summer-lights",
    title: "Summer Lights on the Pier",
    genre: "pop",
    mood: "happy",
    durationMs: 94000,
    bpm: 118,
    createdAt: "2025-02-12",
  },
  {
    id: "neon-echoes",
    title: "Neon Echoes at Midnight",
    genre: "electronic",
    mood: "energetic",
    durationMs: 108000,
    bpm: 132,
    createdAt: "2025-02-03",
  },
  {
    id: "ocean-letters",
    title: "Letters from the Ocean",
    genre: "ambient",
    mood: "calm",
    durationMs: 126000,
    bpm: 76,
    createdAt: "2025-01-28",
  },
  {
    id: "golden-hour",
    title: "Golden Hour Drive",
    genre: "lo-fi",
    mood: "romantic",
    durationMs: 88000,
    bpm: 92,
    createdAt: "2025-01-22",
  },
  {
    id: "storm-signal",
    title: "Storm Signal",
    genre: "rock",
    mood: "dark",
    durationMs: 101000,
    bpm: 124,
    createdAt: "2025-01-17",
  },
  {
    id: "stargazer",
    title: "Stargazer Waltz",
    genre: "classical",
    mood: "melancholic",
    durationMs: 112000,
    bpm: 84,
    createdAt: "2025-01-12",
  },
];
