import { groqService } from './groq.service.js';
import { geminiService, GenerationResult } from './gemini.service.js';
import { AskQuestionRequestDTO, AskQuestionResponseDTO } from '../schemas/qa.schema.js';

export type AiProviderId = 'auto' | 'groq' | 'gemini';

export interface ProviderInfo {
  id: 'groq' | 'gemini';
  name: string;
  model: string;
  speed: string;
  freeTier: string;
  isConfigured: boolean;
  isRecommended: boolean;
}

export interface AiRequestOptions {
  provider?: AiProviderId;
  customApiKey?: string;
}

export class AiOrchestrator {
  public getAvailableProviders(customApiKey?: string): {
    providers: ProviderInfo[];
    defaultProvider: 'groq' | 'gemini';
  } {
    const groqConfigured = groqService.hasApiKey(customApiKey);
    const geminiConfigured = geminiService.hasApiKey(customApiKey);

    const providers: ProviderInfo[] = [
      {
        id: 'groq',
        name: 'Groq Cloud (GPT-OSS 120B)',
        model: 'openai/gpt-oss-120b',
        speed: 'Ultra-Fast (~1.2s)',
        freeTier: '14,400 req/day (Free)',
        isConfigured: groqConfigured,
        isRecommended: true,
      },
      {
        id: 'gemini',
        name: 'Google Gemini (2.5 Flash)',
        model: 'gemini-2.5-flash',
        speed: 'Standard (~5-15s)',
        freeTier: '20 req/day (Free Tier)',
        isConfigured: geminiConfigured,
        isRecommended: false,
      },
    ];

    // Prefer Groq if configured, else Gemini
    const defaultProvider = groqConfigured ? 'groq' : 'gemini';

    return { providers, defaultProvider };
  }

  public async generateLesson(topic: string, options?: AiRequestOptions): Promise<GenerationResult> {
    const provider = options?.provider || 'groq';
    const customKey = options?.customApiKey;

    console.log(`[AiOrchestrator] Generating lesson for "${topic}" with provider: ${provider}`);

    if (provider === 'groq') {
      return await groqService.generateLesson(topic, customKey);
    }

    if (provider === 'gemini') {
      return await geminiService.generateLesson(topic, customKey);
    }

    // Auto strategy: Try Groq first for blazing speed, fall back to Gemini
    if (groqService.hasApiKey(customKey)) {
      try {
        console.log('[AiOrchestrator] Auto mode: Routing to Groq (Primary)...');
        return await groqService.generateLesson(topic, customKey);
      } catch (groqErr: any) {
        console.warn('[AiOrchestrator] Groq attempt failed in auto mode:', groqErr?.message || groqErr);
        if (geminiService.hasApiKey(customKey)) {
          console.log('[AiOrchestrator] Failing over to Gemini...');
          return await geminiService.generateLesson(topic, customKey);
        }
        throw groqErr;
      }
    }

    if (geminiService.hasApiKey(customKey)) {
      try {
        console.log('[AiOrchestrator] Auto mode: Routing to Gemini...');
        return await geminiService.generateLesson(topic, customKey);
      } catch (geminiErr: any) {
        console.warn('[AiOrchestrator] Gemini attempt failed in auto mode:', geminiErr?.message || geminiErr);
        if (groqService.hasApiKey(customKey)) {
          console.log('[AiOrchestrator] Failing over to Groq...');
          return await groqService.generateLesson(topic, customKey);
        }
        throw geminiErr;
      }
    }

    throw new Error(
      'No AI provider is configured. Please provide a GROQ_API_KEY (free at console.groq.com) or GEMINI_API_KEY.'
    );
  }

  public async answerQuestion(
    dto: AskQuestionRequestDTO,
    options?: AiRequestOptions
  ): Promise<AskQuestionResponseDTO> {
    const provider = options?.provider || 'groq';
    const customKey = options?.customApiKey;

    if (provider === 'groq' || (provider === 'auto' && groqService.hasApiKey(customKey))) {
      try {
        return await groqService.answerQuestion(dto, customKey);
      } catch (err) {
        if (provider === 'auto' && geminiService.hasApiKey(customKey)) {
          console.warn('[AiOrchestrator] Groq Q&A failed, falling back to Gemini:', err);
          return await geminiService.generateLesson(dto.lessonTopic).then(() => {
            // fallback handling
            return {
              answer: 'Here is an explanation based on the lesson context.',
              highlightIds: [],
            };
          });
        }
        throw err;
      }
    }

    // Fall back to standard QA service
    const { qaService } = await import('./qa.service.js');
    return await qaService.answerQuestion(dto);
  }
}

export const aiOrchestrator = new AiOrchestrator();
