# Lyra - AI Song Generator

Transform your memories into personalized music. Describe a moment, choose a genre and mood, and let AI generate custom lyrics and audio for you.

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation & Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd lyra

# Install dependencies
npm i

# Start the development server (runs on http://localhost:8080)
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:3001
```

If not set, the app defaults to `http://localhost:3001`.

### Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run lint         # Run ESLint
npm test             # Run tests
npm test:watch       # Run tests in watch mode
npm run preview      # Preview production build
```

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** TanStack Query (React Query)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library
- **Routing:** React Router v6

## How It Works

1. **User Input**: Users describe a memory or moment in natural language
2. **Selection**: Choose a genre (pop, rock, jazz, etc.) and mood (joyful, peaceful, nostalgic, etc.)
3. **Generation**: The app sends a request to the backend API which generates:
   - Custom lyrics based on the user's story
   - Audio file matching the selected genre and mood
4. **Progressive Display**: Results appear as they're generated (lyrics first, then audio)
5. **Playback**: Listen to the generated song with the built-in audio player

## Architecture Highlights

- **Polling Architecture**: Uses TanStack Query to poll job status every 2 seconds until completion
- **Progressive Loading**: Displays lyrics and audio as soon as each becomes available
- **Type-Safe API**: Full TypeScript types for all API interactions
- **Error Handling**: Comprehensive error states with user-friendly toast notifications

For detailed architecture documentation, see [CLAUDE.md](./CLAUDE.md).

## Development Notes

- Dev server runs on port 8080 (not the default 5173)
- Path alias `@/*` maps to `./src/*`
- UI components in `src/components/ui/` are from shadcn/ui - modify with caution
- TypeScript is configured with relaxed strictness (noImplicitAny: false)

## Deployment

This project can be deployed via [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID):

1. Open your Lovable project
2. Click Share → Publish

For custom domains, navigate to Project > Settings > Domains and click Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
