import { promises as fs } from 'fs';
import path from 'path';
import type { WordTiming } from '../utils/wordTimings.js';

export type JobStatus = 'processing' | 'completed' | 'failed';

export type JobRecord = {
  jobId: string;
  status: JobStatus;
  lyrics?: string;
  audioUrl?: string;
  wordTimings?: WordTiming[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const AUDIO_DIR = path.join(process.cwd(), 'audio');
const JOBS_FILE = path.join(AUDIO_DIR, 'jobs.json');

export class StorageService {
  private jobs = new Map<string, JobRecord>();

  async ensureStorage(): Promise<void> {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
    await this.persistJobs();
  }

  createJob(jobId: string): JobRecord {
    const now = new Date().toISOString();
    const record: JobRecord = {
      jobId,
      status: 'processing',
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(jobId, record);
    return record;
  }

  updateJob(jobId: string, updates: Partial<JobRecord>): JobRecord | null {
    const existing = this.jobs.get(jobId);
    if (!existing) {
      return null;
    }

    const updated: JobRecord = {
      ...existing,
      ...updates,
      jobId,
      updatedAt: new Date().toISOString(),
    };

    this.jobs.set(jobId, updated);
    void this.persistJobs();
    return updated;
  }

  getJob(jobId: string): JobRecord | null {
    return this.jobs.get(jobId) || null;
  }

  async saveAudioFile(jobId: string, audioBuffer: Buffer): Promise<string> {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
    const filePath = path.join(AUDIO_DIR, `${jobId}.mp3`);
    await fs.writeFile(filePath, audioBuffer);
    return `/audio/${jobId}.mp3`;
  }

  private async persistJobs(): Promise<void> {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
    const data = Array.from(this.jobs.values());
    await fs.writeFile(JOBS_FILE, JSON.stringify(data, null, 2));
  }
}
