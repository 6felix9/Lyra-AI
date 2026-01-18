import { API_BASE_URL } from './constants';
import { GenerateSongRequest, GenerateSongResponse, JobStatusResponse, HistorySong, DeleteSongResponse, UserProfile, PianoTilesChart } from './types';
import { authClient } from '../auth';

const MOOD_TO_TEMPO: Record<string, string> = {
  joyful: 'upbeat',
  peaceful: 'slow',
  nostalgic: 'moderate',
  hopeful: 'moderate',
  grateful: 'moderate',
  loving: 'slow',
};

export async function generateSong(data: GenerateSongRequest): Promise<GenerateSongResponse> {
  // Only include tempo if mood is provided
  const tempo = data.mood ? (MOOD_TO_TEMPO[data.mood.toLowerCase()] || 'moderate') : undefined;

  // Build request body with only provided fields
  const requestBody: { prompt: string; genre?: string; tempo?: string; userContext?: any } = {
    prompt: data.prompt,
  };

  if (data.genre) {
    requestBody.genre = data.genre;
  }

  if (tempo) {
    requestBody.tempo = tempo;
  }

  if (data.userContext) {
    requestBody.userContext = data.userContext;
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to generate song: ${response.statusText}`);
  }

  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/status/${jobId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to get job status: ${response.statusText}`);
  }

  return response.json();
}

export async function getHistory(): Promise<HistorySong[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/history`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch history: ${response.statusText}`);
  }

  const data: Array<HistorySong & { word_timings?: HistorySong['wordTimings'] }> = await response.json();
  // Map audioUrl for each song
  return data.map(song => ({
    ...song,
    wordTimings: song.wordTimings ?? song.word_timings ?? undefined,
    audioUrl: `${API_BASE_URL}/api/audio/${song.job_id}`
  }));
}

export async function deleteSong(id: string): Promise<DeleteSongResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/history/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete song: ${response.statusText}`);
  }

  return response.json();
}

export async function bootstrapUserProfile(name?: string): Promise<{ created: boolean }> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/profile/bootstrap`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create profile: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/profile`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch profile: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform database format to frontend format
  const preferences = (data.preferences as Record<string, unknown>) || {};
  return {
    name: data.display_name || '',
    age: (preferences.age as number | string) || '',
    about: (preferences.about as string) || '',
    preferredGenres: (preferences.preferredGenres as string[]) || [],
    preferredMoods: (preferences.preferredMoods as string[]) || [],
    likedSongIds: (preferences.likedSongIds as string[]) || [],
  };
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const { name, ...preferences } = data;
  
  const response = await fetchWithAuth(`${API_BASE_URL}/api/profile`, {
    method: 'PUT',
    body: JSON.stringify({
      display_name: name,
      preferences: {
        age: preferences.age,
        about: preferences.about,
        preferredGenres: preferences.preferredGenres,
        preferredMoods: preferences.preferredMoods,
        likedSongIds: preferences.likedSongIds,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update profile: ${response.statusText}`);
  }

  const updated = await response.json();
  
  // Transform database format to frontend format
  const prefs = (updated.preferences as Record<string, unknown>) || {};
  return {
    name: updated.display_name || '',
    age: (prefs.age as number | string) || '',
    about: (prefs.about as string) || '',
    preferredGenres: (prefs.preferredGenres as string[]) || [],
    preferredMoods: (prefs.preferredMoods as string[]) || [],
    likedSongIds: (prefs.likedSongIds as string[]) || [],
  };
}

export async function transcribeAudio(audio: Blob): Promise<{ text: string }> {
  const contentType = audio.type || 'audio/webm';
  const response = await fetchWithAuth(`${API_BASE_URL}/api/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
    },
    body: audio,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to transcribe audio: ${response.statusText}`);
  }

  return response.json();
}

export function getAudioUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

export async function getPianoTilesChart(jobId: string): Promise<PianoTilesChart> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/piano-tiles/${jobId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to get piano tiles chart: ${response.statusText}`);
  }

  return response.json();
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const sessionResult = await authClient.getSession();
  const sessionData = 'data' in sessionResult ? sessionResult.data : null;
  const accessToken =
    (sessionData as { session?: { accessToken?: string; access_token?: string; token?: string } })?.session?.accessToken ??
    (sessionData as { session?: { access_token?: string; token?: string } })?.session?.access_token ??
    (sessionData as { session?: { token?: string } })?.session?.token ??
    null;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof Blob) && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(url, { ...options, headers });
}
