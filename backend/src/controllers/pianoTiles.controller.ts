import { Request, Response } from 'express';
import { databaseService } from '../services/database.service.js';
import { buildPianoTilesChart } from '../utils/pianoTiles.js';

export async function getPianoTilesChart(req: Request, res: Response) {
  const { jobId } = req.params;

  try {
    const result = await databaseService.getResultByJobId(jobId);
    if (!result) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }

    if (result.status !== 'completed') {
      res.status(409).json({ error: 'Song not ready' });
      return;
    }

    const chart = buildPianoTilesChart({
      jobId: result.job_id,
      audioUrl: `/api/audio/${result.job_id}`,
      wordTimings: result.word_timings ?? [],
      tempo: result.tempo ?? undefined,
      title: result.prompt,
      genre: result.genre ?? undefined,
      mood: result.mood ?? undefined,
      createdAt: result.created_at?.toISOString?.() ?? undefined,
    });

    res.json(chart);
  } catch (error) {
    console.error(`Failed to build piano tiles chart for ${jobId}:`, error);
    res.status(500).json({ error: 'Failed to build piano tiles chart' });
  }
}
