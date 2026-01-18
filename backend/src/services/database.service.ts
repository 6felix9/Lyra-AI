import { neon } from '@neondatabase/serverless';
import { config } from '../config/env.js';
import type { WordTiming } from '../utils/wordTimings.js';

export interface ResultRecord {
  id: string;
  job_id: string;
  user_id?: string;
  audio_data: Buffer;
  audio_mime_type: string;
  lyrics: string;
  prompt: string;
  genre?: string;
  mood?: string;
  tempo?: string;
  word_timings?: WordTiming[];
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  created_at: Date;
  updated_at: Date;
}

export type HistoryItem = Omit<ResultRecord, 'audio_data'>;

export interface UserProfileRecord {
  id: string;
  user_id: string;
  display_name: string | null;
  preferences: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export class DatabaseService {
  private sql;

  constructor() {
    this.sql = neon(config.databaseUrl);
  }

  async initSchema() {
    try {
      // Create table
      await this.sql`
        CREATE TABLE IF NOT EXISTS results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id VARCHAR(255) UNIQUE NOT NULL,
          audio_data BYTEA NOT NULL,
          audio_mime_type VARCHAR(50) DEFAULT 'audio/mpeg',
          lyrics TEXT NOT NULL,
          prompt TEXT NOT NULL,
          genre VARCHAR(100),
          mood VARCHAR(100),
          tempo VARCHAR(50),
          word_timings JSONB,
          status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
          error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await this.sql`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE NOT NULL,
          display_name VARCHAR(255),
          preferences JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      await this.sql`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)`;
      await this.sql`ALTER TABLE IF EXISTS user_profiles ALTER COLUMN preferences DROP DEFAULT`;

      await this.sql`
        ALTER TABLE results
        ADD COLUMN IF NOT EXISTS user_id UUID
      `;

      // Create indexes separately as neon() handles one query at a time
      await this.sql`CREATE INDEX IF NOT EXISTS idx_results_job_id ON results(job_id)`;
      await this.sql`CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC)`;
      await this.sql`CREATE INDEX IF NOT EXISTS idx_results_status ON results(status)`;
      await this.sql`CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id)`;

      console.log('Database schema initialized');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  async createResult(data: {
    job_id: string;
    user_id?: string;
    audio_data: Buffer;
    lyrics: string;
    prompt: string;
    genre?: string;
    mood?: string;
    tempo?: string;
    word_timings?: WordTiming[];
    status: 'completed' | 'failed';
    error?: string;
  }) {
    // Convert word_timings array to JSON string for JSONB column
    const wordTimingsJson = data.word_timings ? JSON.stringify(data.word_timings) : null;
    
    const results = await this.sql`
      INSERT INTO results (
        job_id, user_id, audio_data, lyrics, prompt, genre, mood, tempo, word_timings, status, error
      ) VALUES (
        ${data.job_id}, ${data.user_id || null}, ${data.audio_data}, ${data.lyrics}, ${data.prompt},
        ${data.genre || null}, ${data.mood || null}, ${data.tempo || null},
        ${wordTimingsJson}, ${data.status}, ${data.error || null}
      )
      RETURNING *
    `;
    return results[0];
  }

  async getAllResults(): Promise<HistoryItem[]> {
    const results = await this.sql`
      SELECT id, job_id, user_id, audio_mime_type, lyrics, prompt, genre, mood, tempo, word_timings, status, error, created_at, updated_at
      FROM results
      ORDER BY created_at DESC
    `;
    return results as unknown as HistoryItem[];
  }

  async getResultsByUserId(userId: string): Promise<HistoryItem[]> {
    const results = await this.sql`
      SELECT id, job_id, user_id, audio_mime_type, lyrics, prompt, genre, mood, tempo, word_timings, status, error, created_at, updated_at
      FROM results
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return results as unknown as HistoryItem[];
  }

  async getResultById(id: string): Promise<ResultRecord | null> {
    const results = await this.sql`
      SELECT *
      FROM results
      WHERE id = ${id}
      LIMIT 1
    `;
    return (results[0] as unknown as ResultRecord) || null;
  }

  async getResultByJobId(jobId: string): Promise<HistoryItem | null> {
    const results = await this.sql`
      SELECT id, job_id, user_id, audio_mime_type, lyrics, prompt, genre, mood, tempo, word_timings, status, error, created_at, updated_at
      FROM results
      WHERE job_id = ${jobId}
    `;
    return (results[0] as unknown as HistoryItem) || null;
  }

  async getAudioData(jobId: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const results = await this.sql`
      SELECT audio_data, audio_mime_type
      FROM results
      WHERE job_id = ${jobId}
    `;
    if (results.length === 0) return null;
    return {
      data: Buffer.from(results[0].audio_data),
      mimeType: results[0].audio_mime_type,
    };
  }

  async deleteResult(id: string) {
    await this.sql`
      DELETE FROM results
      WHERE id = ${id}
    `;
  }

  async ensureUserProfile(userId: string, displayName?: string | null): Promise<boolean> {
    const results = await this.sql`
      INSERT INTO user_profiles (user_id, display_name, preferences)
      VALUES (${userId}, ${displayName || null}, ${null})
      ON CONFLICT (user_id) DO UPDATE
      SET display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name)
      RETURNING id
    `;
    return results.length > 0;
  }

  async getUserProfile(userId: string): Promise<UserProfileRecord | null> {
    const results = await this.sql`
      SELECT id, user_id, display_name, preferences, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `;
    return (results[0] as unknown as UserProfileRecord) || null;
  }

  async updateUserProfile(
    userId: string,
    data: {
      display_name?: string | null;
      preferences?: Record<string, unknown> | null;
    }
  ): Promise<UserProfileRecord> {
    const results = await this.sql`
      UPDATE user_profiles
      SET 
        display_name = COALESCE(${data.display_name ?? null}, display_name),
        preferences = COALESCE(${data.preferences ? JSON.stringify(data.preferences) : null}::jsonb, preferences),
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING id, user_id, display_name, preferences, created_at, updated_at
    `;
    return results[0] as unknown as UserProfileRecord;
  }

  async close() {
    // neon() client doesn't need explicit closing as it's connectionless (HTTP)
  }
}

export const databaseService = new DatabaseService();
