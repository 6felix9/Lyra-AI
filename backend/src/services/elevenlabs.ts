import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { config } from '../config/env.js';
import type { AlignmentPayload } from '../utils/wordTimings.js';

type RawAlignment = {
  characters?: string[];
  characterStartTimesSeconds?: number[];
  characterEndTimesSeconds?: number[];
  character_start_times_seconds?: number[];
  character_end_times_seconds?: number[];
};

export class ElevenLabsService {
  private client: ElevenLabsClient;
  private readonly voiceId = config.elevenLabsVoiceId;
  private readonly modelId = 'eleven_v3';

  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: config.elevenLabsApiKey,
    });
    console.log('ElevenLabsService initialized with voice ID:', this.voiceId);
  }

  async generateSinging(lyrics: string): Promise<{ audioBuffer: Buffer; alignment?: AlignmentPayload }> {
    try {
      console.log('Generating speech with ElevenLabs...');
      console.log('Voice ID:', this.voiceId);
      console.log('Model ID:', this.modelId);
      console.log('Text length:', lyrics.length);

      const response = await this.client.textToSpeech.convertWithTimestamps(this.voiceId, {
        text: lyrics,
        modelId: this.modelId,
        outputFormat: 'mp3_44100_128',
      });

      const audioBuffer = Buffer.from(response.audioBase64, 'base64');
      console.log('Generated audio:', audioBuffer.length, 'bytes');

      if (audioBuffer.length === 0) {
        throw new Error('ElevenLabs returned empty audio buffer');
      }

      const rawAlignment = (response.normalizedAlignment ?? response.alignment) as RawAlignment | undefined;
      const alignment = rawAlignment
        ? {
            characters: rawAlignment.characters ?? [],
            character_start_times_seconds:
              rawAlignment.characterStartTimesSeconds ?? rawAlignment.character_start_times_seconds ?? [],
            character_end_times_seconds:
              rawAlignment.characterEndTimesSeconds ?? rawAlignment.character_end_times_seconds ?? [],
          }
        : undefined;
      return { audioBuffer, alignment };
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
