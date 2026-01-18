import OpenAI from 'openai';
import { config } from '../config/env.js';

export type LyricsRequest = {
  prompt: string;
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

export class LyricsService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.openAiApiKey });
  }

  async generateLyrics({ prompt, genre, tempo, userContext }: LyricsRequest): Promise<string> {
    const systemPrompt = `
You are a songwriter creating simple, singable lyrics.
Keep lines short.
Use repetition.
Avoid complex metaphors.
`;

    // Build user prompt with optional genre and tempo
    let userPrompt = 'Write a song';
    
    // Use preferred genre if none provided
    const effectiveGenre = genre || (userContext?.preferredGenres && userContext.preferredGenres.length > 0 ? userContext.preferredGenres[0] : null);
    
    if (effectiveGenre) {
      userPrompt += ` in the ${effectiveGenre} genre`;
    }
    
    if (tempo) {
      userPrompt += ` at ${tempo} tempo`;
    }
    
    userPrompt += `.
Theme: ${prompt}
`;

    if (userContext) {
      userPrompt += `
The user this song is for:
- Age: ${userContext.age || 'Unknown'}
- About: ${userContext.about || 'N/A'}
- Preferred Moods: ${userContext.preferredMoods?.join(', ') || 'N/A'}

Incorporate these details or this vibe into the lyrics to make it feel personalized.
`;
    }

    userPrompt += `
Verse + Chorus only.
`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt.trim() },
        { role: 'user', content: userPrompt.trim() },
      ],
      temperature: 0.8,
    });

    const lyrics = response.choices[0]?.message?.content;
    console.log('[LyricsService] OpenAI response received');

    if (!lyrics) {
      throw new Error('No lyrics returned from OpenAI');
    }

    return lyrics;
  }
}
