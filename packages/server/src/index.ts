import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded regardless of process launch directory
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), 'packages/server/.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { lessonRateLimiter, qaRateLimiter } from './middleware/rateLimiter.js';
import {
  generateLessonHandler,
  getPresetsHandler,
  getPresetByIdHandler,
  healthCheckHandler,
  getAiProvidersHandler,
} from './controllers/lesson.controller.js';
import { askQuestionHandler } from './controllers/qa.controller.js';
import { synthesizeSpeechHandler, getVoicesHandler } from './controllers/tts.controller.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security & utility middleware
const corsOriginEnv = process.env.CORS_ORIGIN;
const allowedOrigins = corsOriginEnv && corsOriginEnv !== '*'
  ? corsOriginEnv.split(',').map((o) => o.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

// Health check & AI provider discovery
app.get('/api/health', healthCheckHandler);
app.get('/api/ai/providers', getAiProvidersHandler);

// Lesson endpoints
app.post('/api/lessons/generate', lessonRateLimiter, generateLessonHandler);
app.get('/api/presets', getPresetsHandler);
app.get('/api/presets/:id', getPresetByIdHandler);

// Q&A endpoints
app.post('/api/qa/ask', qaRateLimiter, askQuestionHandler);

// Human Neural Voice Speech Synthesis endpoints (Microsoft Edge Neural TTS)
app.post('/api/tts/synthesize', synthesizeSpeechHandler);
app.get('/api/tts/audio', synthesizeSpeechHandler);
app.get('/api/tts/voices', getVoicesHandler);

// Serve static frontend in single-container production deployment if public directory exists
const publicDir = path.resolve(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// 404 handler for API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if ((err as any).type === 'entity.parse.failed' || (err as any).status === 400) {
    res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body',
    });
    return;
  }

  console.error('[Server] Uncaught exception:', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected internal server error occurred',
  });
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Process] Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`[Whiteboard Tutor Server] Listening on http://localhost:${PORT}`);
  console.log(`[Whiteboard Tutor Server] Health endpoint: http://localhost:${PORT}/api/health`);
});
