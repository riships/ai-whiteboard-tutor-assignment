import { GoogleGenerativeAI } from '@google/generative-ai';
import { LessonPlanDTO, LessonPlanSchema } from '../schemas/lesson.schema.js';
import { buildLessonPrompt, sanitizeRawLessonPlan } from './ai.prompt.js';

export interface GenerationResult {
  lessonPlan: LessonPlanDTO;
  source: 'live' | 'preset';
  modelUsed?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  private fallbackModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0 && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey.trim());
    }
  }

  public hasApiKey(customKey?: string): boolean {
    if (customKey && customKey.trim().length > 5) return true;
    return this.genAI !== null;
  }

  public async generateLesson(topic: string, customApiKey?: string): Promise<GenerationResult> {
    const key = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
    const client = customApiKey ? new GoogleGenerativeAI(key!) : this.genAI;

    if (!client) {
      const noKeyError = new Error(
        'Gemini API key is not configured on the server. Live AI lesson generation requires GEMINI_API_KEY to be set in packages/server/.env.'
      );
      console.error('[GeminiService] [AI ERROR] Missing API key:', noKeyError.message);
      throw noKeyError;
    }

    const prompt = buildLessonPrompt(topic);
    const modelsToTry = [this.primaryModel, ...this.fallbackModels.filter((m) => m !== this.primaryModel)];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[GeminiService] Attempting generation with model: ${modelName} for "${topic}"`);
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const response = await model.generateContent(prompt);
        const text = response.response.text();

        const parsedJson = JSON.parse(text);
        const sanitized = sanitizeRawLessonPlan(parsedJson, topic);
        const validation = LessonPlanSchema.safeParse(sanitized);

        if (!validation.success) {
          console.error(`[GeminiService] [AI SCHEMA ERROR] Model "${modelName}" output did not conform to schema:`, validation.error.format());
          throw new Error(`AI generated JSON did not pass schema validation: ${JSON.stringify(validation.error.issues)}`);
        }

        console.log(`[GeminiService] Successfully generated live lesson using ${modelName} for "${topic}"`);
        return {
          lessonPlan: validation.data,
          source: 'live',
          modelUsed: modelName,
        };
      } catch (err: any) {
        lastError = err;
        console.error(`[GeminiService] [AI MODEL ERROR] Model "${modelName}" failed for topic "${topic}":`, {
          message: err?.message || String(err),
          status: err?.status,
          statusText: err?.statusText,
          timestamp: new Date().toISOString(),
        });
        // If transient spike (503/429), pause 1.2s before trying alternative model
        if (err?.status === 503 || err?.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    }

    const isQuotaError =
      lastError?.status === 429 ||
      /quota|rate-limit|too many requests|resource_exhausted/i.test(lastError?.message || '');

    console.error(`[GeminiService] [AI GENERATION FAILED] Unable to generate AI lesson response for topic "${topic}". All candidate models exhausted.`, {
      topic,
      attemptedModels: modelsToTry,
      isQuotaError,
      lastErrorMessage: lastError?.message,
      lastErrorStatus: lastError?.status,
      timestamp: new Date().toISOString(),
    });

    if (isQuotaError) {
      throw new Error(
        `Gemini API quota exceeded (HTTP 429). The free-tier daily request quota (20 requests/day) for this API key has been exhausted. Please retry after your daily quota resets or provide an updated GEMINI_API_KEY.`
      );
    }

    throw new Error(
      `AI lesson generation failed across all models for topic "${topic}". Details: ${lastError?.message || 'Service Unavailable'}`
    );
  }
}

export const geminiService = new GeminiService();
