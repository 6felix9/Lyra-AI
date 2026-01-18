import { Request, Response } from 'express';
import { databaseService } from '../services/database.service.js';

export async function getHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const history = await databaseService.getResultsByUserId(userId);
    const response = history.map((item) => ({
      ...item,
      wordTimings: item.word_timings || [],
    }));
    res.json(response);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}

export async function deleteSong(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const song = await databaseService.getResultById(id);
    if (!song || song.user_id !== userId) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }

    await databaseService.deleteResult(id);
    res.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete song ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete song' });
  }
}

export async function streamAudio(req: Request, res: Response) {
  const { jobId } = req.params;
  try {
    const audio = await databaseService.getAudioData(jobId);
    if (!audio) {
      res.status(404).json({ error: 'Audio not found' });
      return;
    }

    res.setHeader('Content-Type', audio.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(audio.data);
  } catch (error) {
    console.error(`Failed to stream audio for job ${jobId}:`, error);
    res.status(500).json({ error: 'Failed to stream audio' });
  }
}
