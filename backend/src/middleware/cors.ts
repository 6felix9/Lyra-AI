import cors from 'cors';
import { config } from '../config/env.js';

// Configure CORS to allow requests from the frontend
export const corsMiddleware = cors({
  origin: config.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
