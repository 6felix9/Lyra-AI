export type JobStatus = 'processing' | 'completed' | 'failed';

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface UserProfile {
  name: string;
  age: number | string;
  about: string;
  preferredGenres: string[];
  preferredMoods: string[];
  likedSongIds: string[];
}

export interface GenerateSongRequest {
  prompt: string;
  genre?: string;
  mood?: string;
  userContext?: Omit<UserProfile, 'likedSongIds'>;
}

export interface GenerateSongResponse {
  jobId: string;
  status: JobStatus;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  lyrics?: string;
  audioUrl?: string;
  wordTimings?: WordTiming[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistorySong {
  id: string;
  job_id: string;
  lyrics: string;
  prompt: string;
  genre?: string;
  mood?: string;
  tempo?: string;
  wordTimings?: WordTiming[];
  status: JobStatus;
  error?: string;
  created_at: string;
  updated_at: string;
  audioUrl?: string;
}

export interface DeleteSongResponse {
  success: boolean;
}

export interface PianoTileNote {
  tMs: number;
  lane: number;
  durationMs?: number;
}

export interface PianoTilesChart {
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
}
