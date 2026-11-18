import { LessonPlanSchema } from '../schemas/lesson.schema.js';
import { AskQuestionRequestDTO, AskQuestionResponseDTO, AskQuestionResponseSchema } from '../schemas/qa.schema.js';
import { GenerationResult } from './gemini.service.js';
import { buildLessonPrompt, buildQaPrompt, sanitizeRawLessonPlan, sanitizeQaActions } from './ai.prompt.js';

export class GroqService {
  private defaultApiKey: string | null = null;
  private primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  private fallbackModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

  constructor() {
    const key = process.env.GROQ_API_KEY;
    if (key && key.trim().length > 0 && key !== 'your_groq_api_key_here') {
      this.defaultApiKey = key.trim();
    }
  }

  private getApiKey(customKey?: string): string | null {
    const key = customKey || process.env.GROQ_API_KEY || this.defaultApiKey;
    if (key && key.trim().length > 5 && key !== 'your_groq_api_key_here') {
      return key.trim();
    }
    return null;
  }

  public hasApiKey(customKey?: string): boolean {
    return this.getApiKey(customKey) !== null;
  }

  private cleanJsonString(content: string): any {
    let clean = content.trim();

    // Strip markdown code fences if wrapped
    if (clean.startsWith('```json')) {
      clean = clean.slice(7);
    } else if (clean.startsWith('```')) {
      clean = clean.slice(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.slice(0, -3);
    }
    clean = clean.trim();

    // If there is any leading commentary before the first '{', find it
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(clean);
  }

  public async generateLesson(topic: string, customApiKey?: string): Promise<GenerationResult> {
    const apiKey = this.getApiKey(customApiKey);
    if (!apiKey) {
      const err = new Error('Groq API key is not configured. Set GROQ_API_KEY in packages/server/.env or provide a key in the UI.');
      console.error('[GroqService] [AI ERROR] Missing key:', err.message);
      throw err;
    }

    const prompt = buildLessonPrompt(topic);
    const modelsToTry = [this.primaryModel, ...this.fallbackModels.filter((m) => m !== this.primaryModel)];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[GroqService] Requesting lesson for "${topic}" using ${modelName}...`);
        const startTime = Date.now();

        // Note: Reasoning models (e.g. gpt-oss-120b, gpt-oss-20b) conflict with Groq's grammar-based
        // json_object response_format due to internal reasoning tokens. We enforce strict JSON via prompt
        // and parse it reliably with cleanJsonString.
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'system',
                content: 'You are an expert AI whiteboard tutor. You MUST output ONLY raw valid JSON matching the exact specification. Do not include markdown fences, comments, or surrounding text.',
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 8192,
            temperature: 0.1,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Groq API responded with status ${res.status}: ${errText}`);
        }

        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('Groq returned empty completion content.');
        }

        const parsedJson = this.cleanJsonString(content);
        const sanitized = sanitizeRawLessonPlan(parsedJson, topic);
        const validation = LessonPlanSchema.safeParse(sanitized);

        if (!validation.success) {
          console.error(`[GroqService] [AI SCHEMA ERROR] Model "${modelName}" schema mismatch:`, validation.error.format());
          throw new Error(`Groq generated JSON did not pass schema validation: ${JSON.stringify(validation.error.issues)}`);
        }

        console.log(`[GroqService] Successfully generated lesson using ${modelName} in ${Date.now() - startTime}ms!`);
        return {
          lessonPlan: validation.data,
          source: 'live',
          modelUsed: `Groq (${modelName})`,
        };
      } catch (err: any) {
        lastError = err;
        console.error(`[GroqService] [AI MODEL ERROR] Model ${modelName} failed for "${topic}":`, err?.message || err);
      }
    }

    console.error(`[GroqService] [AI GENERATION FAILED] All Groq models failed for "${topic}":`, lastError);
    throw new Error(`Groq lesson generation failed across candidate models: ${lastError?.message || 'Unknown error'}`);
  }

  public async answerQuestion(dto: AskQuestionRequestDTO, customApiKey?: string): Promise<AskQuestionResponseDTO> {
    const apiKey = this.getApiKey(customApiKey);
    if (!apiKey) {
      throw new Error('Groq API key not configured for Q&A.');
    }

    const prompt = buildQaPrompt(dto);
    const modelName = this.primaryModel;

    try {
      console.log(`[GroqService] Answering Q&A with ${modelName}...`);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are a friendly Socratic whiteboard tutor. Output ONLY raw valid JSON answering student questions without markdown fences.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2048,
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq Q&A responded with status ${res.status}: ${errText}`);
      }

      const data: any = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty Q&A response from Groq');
      }

      const parsedJson = this.cleanJsonString(content);
      if (Array.isArray(parsedJson.newActions)) {
        parsedJson.newActions = sanitizeQaActions(parsedJson.newActions);
      }

      const validation = AskQuestionResponseSchema.safeParse(parsedJson);
      if (validation.success) {
        return validation.data;
      }

      console.warn('[GroqService] [AI SCHEMA WARNING] Non-fatal schema warning on Q&A:', validation.error.format());
      return {
        answer: parsedJson.answer || 'Here is an explanation based on the lesson context.',
        highlightIds: Array.isArray(parsedJson.highlightIds) ? parsedJson.highlightIds : [],
        newActions: Array.isArray(parsedJson.newActions) ? parsedJson.newActions : undefined,
      };
    } catch (err: any) {
      console.error(`[GroqService] [AI GENERATION FAILED] Q&A failure:`, err?.message || err);
      throw err;
    }
  }
}

export const groqService = new GroqService();
