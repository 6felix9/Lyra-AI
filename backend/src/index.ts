import express from 'express';
import { config } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/api.js';
import { databaseService } from './services/database.service.js';

const app = express();

// Initialize database schema
databaseService.initSchema().catch(err => {
  console.error('Database initialization failed:', err);
});

// Apply CORS middleware
app.use(corsMiddleware);

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Apply error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server started on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
  console.log(`API endpoint: http://localhost:${config.port}/api/generate`);
  console.log(`Status endpoint: http://localhost:${config.port}/api/status/{jobId}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});
