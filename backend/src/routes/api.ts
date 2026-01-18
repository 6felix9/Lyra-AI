import express, { Router } from 'express';
import { generateSong, getStatus } from '../controllers/generate.controller.js';
import { getHistory, deleteSong, streamAudio } from '../controllers/history.controller.js';
import { getPianoTilesChart } from '../controllers/pianoTiles.controller.js';
import { bootstrapProfile, getProfile, updateProfile } from '../controllers/profile.controller.js';
import { transcribeAudio } from '../controllers/transcribe.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/generate
router.post('/generate', authMiddleware, generateSong);

// GET /api/status/:jobId
router.get('/status/:jobId', getStatus);

// POST /api/transcribe
router.post('/transcribe', authMiddleware, express.raw({ type: '*/*', limit: '12mb' }), transcribeAudio);

// History routes
router.get('/history', authMiddleware, getHistory);
router.delete('/history/:id', authMiddleware, deleteSong);

// User profile routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile/bootstrap', authMiddleware, bootstrapProfile);

// Audio streaming
router.get('/audio/:jobId', streamAudio);

// Piano tiles chart
router.get('/piano-tiles/:jobId', getPianoTilesChart);

export default router;
