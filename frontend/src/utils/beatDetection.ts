export type BeatNote = {
  tMs: number;
  lane: number;
};

const WINDOW_SIZE = 2048; // FFT window size
const HOP_SIZE = 512; // Hop size for analysis
const ENERGY_THRESHOLD = 0.3; // Energy threshold for beat detection (30% above local average)
const LOCAL_ENERGY_WINDOW = 43; // Lookback window for local energy
const MIN_TILE_SPACING_MS = 350; // Minimum milliseconds between tiles
const NUM_LANES = 4;

/**
 * Stable hash function for consistent lane assignment
 */
const stableHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Analyzes audio buffer to detect beats and generate notes for piano tiles game
 * @param audioBuffer Decoded audio buffer from Web Audio API
 * @returns Array of beat notes with timestamps and lane assignments
 */
export async function analyzeBeatDetection(audioBuffer: AudioBuffer): Promise<BeatNote[]> {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const length = channelData.length;
  const duration = audioBuffer.duration;

  // Parameters for beat detection
  const energyHistory: number[] = [];

  // Calculate spectral flux (simplified beat detection)
  for (let i = 0; i < length - WINDOW_SIZE; i += HOP_SIZE) {
    let energy = 0;

    // Calculate energy in this window
    for (let j = i; j < i + WINDOW_SIZE && j < length; j++) {
      energy += Math.abs(channelData[j]);
    }

    energy /= WINDOW_SIZE;
    energyHistory.push(energy);
  }

  // Extract beats from energy history
  const beats: number[] = [];
  for (let i = LOCAL_ENERGY_WINDOW; i < energyHistory.length; i++) {
    const energy = energyHistory[i];
    let localAvg = 0;
    for (let k = i - LOCAL_ENERGY_WINDOW; k < i; k++) {
      localAvg += energyHistory[k];
    }
    localAvg /= LOCAL_ENERGY_WINDOW;

    if (energy > localAvg * (1 + ENERGY_THRESHOLD)) {
      const timeInSeconds = (i * HOP_SIZE) / sampleRate;
      beats.push(timeInSeconds * 1000); // Convert to milliseconds
    }
  }

  console.log('[BeatDetection] Raw beats detected:', beats.length);

  // If no beats detected, generate based on estimated BPM
  if (beats.length === 0) {
    console.log('[BeatDetection] No beats found, generating fallback beats');
    // Estimate BPM (rough calculation)
    const estimatedBPM = Math.round(60 / (duration / 30));
    const beatInterval = (60 / estimatedBPM) * 1000;

    for (let t = 1000; t < duration * 1000; t += beatInterval) {
      beats.push(t);
    }
    console.log('[BeatDetection] Generated', beats.length, 'fallback beats at', estimatedBPM, 'BPM');
  }

  // Sort beats by time
  beats.sort((a, b) => a - b);

  // Filter beats to ensure minimum spacing (so player only presses one at a time)
  const spacedBeats: number[] = [];

  for (const beatTime of beats) {
    // Only add beat if it's far enough from the last one
    if (
      spacedBeats.length === 0 ||
      beatTime - spacedBeats[spacedBeats.length - 1] >= MIN_TILE_SPACING_MS
    ) {
      spacedBeats.push(beatTime);
    }
  }

  // Generate notes with random lane assignment from spaced beats
  const notes: BeatNote[] = spacedBeats.map((tMs, index) => {
    // Use stable hash for consistent lane assignment
    const baseLane = stableHash(`${tMs}-${index}`) % NUM_LANES;
    return {
      tMs,
      lane: baseLane,
    };
  });

  console.log('[BeatDetection] Final notes:', {
    count: notes.length,
    firstFew: notes.slice(0, 5),
    lastFew: notes.slice(-3),
  });

  return notes;
}
