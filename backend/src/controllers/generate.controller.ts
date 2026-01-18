import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LyricsService } from '../services/lyrics.service.js';
import { formatLyricsForSinging } from '../utils/textFormatter.js';
import { ElevenLabsService } from '../services/elevenlabs.js';
import { StorageService } from '../services/storage.service.js';
import { databaseService } from '../services/database.service.js';
import { buildWordTimings } from '../utils/wordTimings.js';

const lyricsService = new LyricsService();
const elevenLabsService = new ElevenLabsService();
const storageService = new StorageService();

void storageService.ensureStorage();

type GenerateRequest = {
  prompt?: string;
  genre?: string;
  tempo?: string;
  userContext?: {
    name?: string;
    age?: number | string;
    about?: string;
    preferredGenres?: string[];
    preferredMoods?: string[];
  };
};

function validateGenerateRequest(body: GenerateRequest) {
  if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
    return 'prompt is required';
  }
  // Genre and tempo are now optional
  if (body.genre !== undefined && (typeof body.genre !== 'string' || !body.genre.trim())) {
    return 'genre must be a non-empty string if provided';
  }
  if (body.tempo !== undefined && (typeof body.tempo !== 'string' || !body.tempo.trim())) {
    return 'tempo must be a non-empty string if provided';
  }
  return null;
}

async function processJob(
  jobId: string,
  request: Required<Pick<GenerateRequest, 'prompt'>> &
    Omit<GenerateRequest, 'prompt'> & {
      userId?: string;
    }
) {
  try {
    console.log(`[Job ${jobId}] Starting generation for prompt: "${request.prompt}"`);
    if (request.genre) console.log(`[Job ${jobId}] Genre: ${request.genre}`);
    if (request.tempo) console.log(`[Job ${jobId}] Tempo: ${request.tempo}`);
    if (request.userContext) console.log(`[Job ${jobId}] User context provided for ${request.userContext.name || 'anonymous'}`);

    const rawLyrics = await lyricsService.generateLyrics({
      prompt: request.prompt,
      genre: request.genre,
      tempo: request.tempo,
      userContext: request.userContext,
    });

    const lyrics = formatLyricsForSinging(rawLyrics);
    console.log(`[Job ${jobId}] Generated lyrics:\n${lyrics}`);

    console.log(`[Job ${jobId}] Sending to ElevenLabs for singing...`);
    const { audioBuffer, alignment } = await elevenLabsService.generateSinging(lyrics);
    const wordTimings = alignment ? buildWordTimings(alignment) : [];
    
    console.log(`[Job ${jobId}] Audio generated, saving to database...`);
    await databaseService.createResult({
      job_id: jobId,
      user_id: request.userId,
      audio_data: audioBuffer,
      lyrics,
      prompt: request.prompt,
      genre: request.genre,
      tempo: request.tempo,
      word_timings: wordTimings,
      status: 'completed',
    });

    const audioUrl = `/api/audio/${jobId}`;
    console.log(`[Job ${jobId}] Result saved to database. Audio URL: ${audioUrl}`);

    storageService.updateJob(jobId, {
      status: 'completed',
      lyrics,
      audioUrl,
      wordTimings,
    });
    console.log(`[Job ${jobId}] Job completed successfully`);
  } catch (error) {
    console.error(`[Job ${jobId}] Job processing failed:`, error);
    
    // Save failure to database
    try {
      await databaseService.createResult({
        job_id: jobId,
        user_id: request.userId,
        audio_data: Buffer.alloc(0),
        lyrics: '',
        prompt: request.prompt,
        genre: request.genre,
        tempo: request.tempo,
        word_timings: [],
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (dbError) {
      console.error(`[Job ${jobId}] Failed to save failure status to database:`, dbError);
    }

    storageService.updateJob(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function generateSong(req: Request, res: Response) {
  const userId = req.user?.id; // Required - authMiddleware ensures req.user.id exists

  const body = req.body as GenerateRequest;
  const validationError = validateGenerateRequest(body);

  if (validationError) {
    console.warn('Invalid generation request:', validationError);
    res.status(400).json({ error: validationError });
    return;
  }

  const jobId = uuidv4();
  console.log(`[Generate] Received request. Assigned Job ID: ${jobId}`);
  console.log(` - Prompt: ${body.prompt}`);
  console.log(` - Genre: ${body.genre}`);
  console.log(` - Tempo: ${body.tempo}`);

  storageService.createJob(jobId);

  res.status(202).json({ jobId, status: 'processing' });

  void processJob(jobId, {
    prompt: body.prompt!.trim(),
    genre: body.genre?.trim(),
    tempo: body.tempo?.trim(),
    userContext: body.userContext,
    userId,
  });
}

export async function getStatus(req: Request, res: Response) {
  const jobId = req.params.jobId;
  let job = storageService.getJob(jobId);

  if (!job) {
    // Check database if not in memory
    const dbResult = await databaseService.getResultByJobId(jobId);
    if (dbResult) {
      console.log(`[Status] Job ${jobId} found in database: ${dbResult.status}`);
      res.json({
        jobId: dbResult.job_id,
        status: dbResult.status,
        lyrics: dbResult.lyrics,
        audioUrl: `/api/audio/${dbResult.job_id}`,
        wordTimings: dbResult.word_timings || [],
        error: dbResult.error,
        createdAt: dbResult.created_at,
        updatedAt: dbResult.updated_at,
      });
      return;
    }

    console.warn(`[Status] Job not found: ${jobId}`);
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  console.log(`[Status] Job ${jobId} status in memory: ${job.status}`);
  res.json({
    jobId: job.jobId,
    status: job.status,
    lyrics: job.lyrics,
    audioUrl: job.audioUrl,
    wordTimings: job.wordTimings || [],
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
}
