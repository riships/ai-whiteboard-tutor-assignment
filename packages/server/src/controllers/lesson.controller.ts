import { Request, Response } from 'express';
import { GenerateLessonRequestSchema } from '../schemas/lesson.schema.js';
import { aiOrchestrator } from '../services/ai.orchestrator.js';
import { geminiService } from '../services/gemini.service.js';
import { groqService } from '../services/groq.service.js';
import { presetService } from '../services/preset.service.js';

export async function generateLessonHandler(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = GenerateLessonRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const { topic, provider, apiKey } = parseResult.data;
    console.log(`[LessonController] Generating lesson for topic: "${topic}" using provider: "${provider}"`);

    const result = await aiOrchestrator.generateLesson(topic, { provider, customApiKey: apiKey });

    res.status(200).json({
      success: true,
      data: result.lessonPlan,
      source: result.source,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An internal server error occurred while generating the lesson plan';
    console.error(`[LessonController] [AI RESPONSE GENERATION ERROR] Unable to generate AI lesson response for topic: "${req.body?.topic || 'unknown'}":`, {
      message,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export function getAiProvidersHandler(req: Request, res: Response): void {
  try {
    const customKey = typeof req.query.apiKey === 'string' ? req.query.apiKey : undefined;
    const data = aiOrchestrator.getAvailableProviders(customKey);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[LessonController] Error retrieving AI providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AI providers',
    });
  }
}

export function getPresetsHandler(_req: Request, res: Response): void {
  try {
    const presets = presetService.getAvailablePresets();
    res.status(200).json({
      success: true,
      data: presets,
    });
  } catch (error) {
    console.error('[LessonController] Error retrieving presets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve presets',
    });
  }
}

export function getPresetByIdHandler(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const preset = presetService.getPresetById(id);

    if (!preset) {
      res.status(404).json({
        success: false,
        error: `Preset with id "${id}" not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: preset,
      source: 'preset',
    });
  } catch (error) {
    console.error('[LessonController] Error retrieving preset by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve preset',
    });
  }
}

export function healthCheckHandler(_req: Request, res: Response): void {
  const { providers, defaultProvider } = aiOrchestrator.getAvailableProviders();
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    aiConfigured: groqService.hasApiKey() || geminiService.hasApiKey(),
    defaultProvider,
    providers,
  });
}
