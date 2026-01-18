# Lyra-Backend

Express-based TypeScript backend that generates songs using OpenAI (for lyrics) and ElevenLabs (for singing). The system accepts song generation requests, processes them asynchronously, and returns downloadable audio files.

## Features

- Asynchronous song generation with job tracking
- OpenAI GPT-4o-mini for lyrics generation
- ElevenLabs text-to-speech for singing (model: eleven_v3)
- RESTful API with CORS support
- Persistent job storage with NeonDB
- Docker support with multi-stage builds

## Prerequisites

- Node.js 20+ (for local development)
- Docker (for containerized deployment)
- NeonDB database (PostgreSQL)
- API Keys:
  - OpenAI API Key
  - ElevenLabs API Key
  - Groq API Key (for speech-to-text)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DATABASE_URL=your_neon_database_connection_string

# Optional
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_VOICE_ID=RfKi1jmIQ2tzPNNiDoi
PORT=3001
FRONTEND_URL=http://localhost:8080
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build TypeScript to dist/
npm run build

# Run production server (after build)
npm start
```

The server runs on port 3001 by default (configurable via PORT env var).

## Docker Deployment

### Building for ARM64 (Apple Silicon)

Build and push the Docker image to Docker Hub using buildx for ARM64 architecture:

```bash
# Create a new buildx builder (first time only)
docker buildx create --name mybuilder --use

# Build and push to Docker Hub for ARM64
docker buildx build --platform linux/arm64 -t felixlmao/lyra-backend:latest --push .
```

### Building for Multiple Architectures

To build for both ARM64 and AMD64:

```bash
docker buildx build --platform linux/arm64 -t felixlmao/lyra-backend:latest --push .
```

### Pulling the Image

Pull the pre-built image from Docker Hub:

```bash
docker pull felixlmao/lyra-backend:latest
```

### Running with Docker

Run the container with your environment variables:

```bash
# Using .env.local file
docker run -d \
  --name lyra-backend \
  -p 3001:3001 \
  --env-file .env \
  -v $(pwd)/audio:/app/audio \
  felixlmao/lyra-backend:latest
```

Or using individual environment variables:

```bash
docker run -d \
  --name lyra-backend \
  -p 3001:3001 \
  -e OPENAI_API_KEY=your_openai_api_key \
  -e ELEVENLABS_API_KEY=your_elevenlabs_api_key \
  -e GROQ_API_KEY=your_groq_api_key \
  -e DATABASE_URL=your_neon_database_connection_string \
  -e ELEVENLABS_VOICE_ID=RfKi1jmIQ2tzPNNiDoi \
  -e PORT=3001 \
  -e FRONTEND_URL=http://localhost:8080 \
  -v $(pwd)/audio:/app/audio \
  felixlmao/lyra-backend:latest
```

### Docker Volume Mount

The `-v $(pwd)/audio:/app/audio` flag mounts a local `audio` directory to persist generated audio files between container restarts. Create the directory first:

```bash
mkdir -p audio
```

### Docker Compose (Optional)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  lyra-backend:
    image: felixlmao/lyra-backend:latest
    container_name: lyra-backend
    ports:
      - "3001:3001"
    env_file:
      - .env.local
    volumes:
      - ./audio:/app/audio
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

## API Endpoints

### Generate Song

```http
POST /api/generate
Content-Type: application/json

{
  "prompt": "A song about summer nights",
  "genre": "pop",
  "tempo": "medium"
}
```

Response:
```json
{
  "jobId": "uuid-v4",
  "status": "processing"
}
```

### Check Job Status

```http
GET /api/status/:jobId
```

Response (processing):
```json
{
  "jobId": "uuid-v4",
  "status": "processing"
}
```

Response (completed):
```json
{
  "jobId": "uuid-v4",
  "status": "completed",
  "audioUrl": "/audio/uuid-v4.mp3"
}
```

Response (failed):
```json
{
  "jobId": "uuid-v4",
  "status": "failed",
  "error": "Error message"
}
```

## Project Structure

```
lyra-backend/
├── src/
│   ├── config/
│   │   └── env.ts                 # Environment validation
│   ├── controllers/
│   │   └── generate.controller.ts # Request handlers
│   ├── routes/
│   │   └── api.ts                 # API route definitions
│   ├── services/
│   │   ├── elevenlabs.ts          # ElevenLabs TTS integration
│   │   ├── lyrics.service.ts      # OpenAI lyrics generation
│   │   └── storage.service.ts     # Job state & audio persistence
│   └── index.ts                   # Express server setup
├── audio/                         # Generated audio files
├── dist/                          # Compiled JavaScript
├── .env.local                     # Environment variables
├── Dockerfile                     # Docker configuration
└── package.json
```

## Architecture

### Request Flow

1. **Client Request** → POST /api/generate with {prompt, genre, tempo}
2. **Job Creation** → Immediate 202 response with jobId, job marked as 'processing'
3. **Async Processing** → Background processing via `processJob()`:
   - Generate lyrics using OpenAI GPT-4o-mini
   - Format lyrics for singing
   - Generate audio using ElevenLabs text-to-speech (model: eleven_v3)
   - Save audio file to `audio/` directory
   - Update job status to 'completed' or 'failed'
4. **Client Polling** → GET /api/status/:jobId to check progress

### Storage

- Jobs are tracked in-memory (Map) and persisted to `audio/jobs.json`
- Generated audio files are saved to `audio/{jobId}.mp3`
- Audio files are served via static middleware at `/audio/{jobId}.mp3`

## License

ISC
