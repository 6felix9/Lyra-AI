import { Request, Response } from 'express';
import OpenAI, { toFile } from 'openai';
import { config } from '../config/env.js';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const groqClient = config.groqApiKey
  ? new OpenAI({ apiKey: config.groqApiKey, baseURL: GROQ_BASE_URL })
  : null;

function getRecordingFilename(contentType: string) {
  if (contentType.includes('wav')) return 'recording.wav';
  if (contentType.includes('mpeg')) return 'recording.mp3';
  if (contentType.includes('mp4')) return 'recording.mp4';
  if (contentType.includes('ogg')) return 'recording.ogg';
  return 'recording.webm';
}

export async function transcribeAudio(req: Request, res: Response) {
  if (!groqClient) {
    res.status(500).json({ error: 'Missing GROQ_API_KEY configuration' });
    return;
  }

  const audioBuffer = req.body as Buffer;
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
    res.status(400).json({ error: 'Audio data is required' });
    return;
  }

  const contentTypeHeader = req.headers['content-type'];
  const contentType = Array.isArray(contentTypeHeader)
    ? contentTypeHeader[0]
    : contentTypeHeader || 'audio/webm';
  const filename = getRecordingFilename(contentType);

  try {
    const file = await toFile(audioBuffer, filename, { type: contentType });
    const transcription = await groqClient.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
    });

    res.json({ text: transcription.text ?? '' });
  } catch (error) {
    console.error('[Transcribe] Failed to process audio:', error);
    res.status(502).json({ error: 'Failed to transcribe audio' });
  }
}
