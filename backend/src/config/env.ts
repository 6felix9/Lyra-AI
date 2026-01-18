import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env.local') });

// Validate required environment variables
const requiredEnvVars = ['ELEVENLABS_API_KEY', 'OPENAI_API_KEY', 'DATABASE_URL', 'NEON_AUTH_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Export validated configuration
export const config = {
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY as string,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || 'RfKi1jJmIQ2tzPNNiDoi',
  openAiApiKey: process.env.OPENAI_API_KEY as string,
  groqApiKey: process.env.GROQ_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL as string,
  neonAuthUrl: process.env.NEON_AUTH_URL as string,
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
};
