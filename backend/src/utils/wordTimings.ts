export type AlignmentPayload = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type WordTiming = {
  word: string;
  start: number;
  end: number;
};

export function buildWordTimings(alignment: AlignmentPayload): WordTiming[] {
  const characters = alignment.characters ?? [];
  const starts = alignment.character_start_times_seconds ?? [];
  const ends = alignment.character_end_times_seconds ?? [];

  const length = Math.min(characters.length, starts.length, ends.length);
  if (length === 0) return [];

  const wordTimings: WordTiming[] = [];
  let currentWord = '';
  let wordStart = 0;
  let wordEnd = 0;

  for (let i = 0; i < length; i += 1) {
    const character = characters[i] ?? '';
    const start = starts[i];
    const end = ends[i];

    if (character.trim() === '') {
      if (currentWord) {
        wordTimings.push({ word: currentWord, start: wordStart, end: wordEnd });
        currentWord = '';
      }
      continue;
    }

    if (!currentWord) {
      wordStart = start;
    }
    currentWord += character;
    wordEnd = end;
  }

  if (currentWord) {
    wordTimings.push({ word: currentWord, start: wordStart, end: wordEnd });
  }

  return wordTimings;
}
