import { LessonPlan, CanvasElement, ChatMessage } from '../types/canvas.types';

export type AiProviderChoice = 'auto' | 'groq' | 'gemini';

export interface ProviderInfo {
  id: 'groq' | 'gemini';
  name: string;
  model: string;
  speed: string;
  freeTier: string;
  isConfigured: boolean;
  isRecommended: boolean;
}

export interface AiProvidersResponse {
  providers: ProviderInfo[];
  defaultProvider: 'groq' | 'gemini';
}

export interface LessonGenerationResponse {
  lessonPlan: LessonPlan;
  source: 'live' | 'preset';
  modelUsed?: string;
  errorNotice?: string;
}

export interface AskQuestionPayload {
  question: string;
  lessonTopic: string;
  lessonSummary?: string;
  currentSegmentTitle?: string;
  currentSegmentIndex?: number;
  currentElements?: Array<{ id: string; type: string; label?: string }>;
  chatHistory?: ChatMessage[];
  provider?: AiProviderChoice;
  apiKey?: string;
}

export interface AskQuestionResult {
  answer: string;
  highlightIds?: string[];
  newActions?: CanvasElement[];
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

/**
 * Returns the direct URL for streaming Microsoft Edge Neural TTS audio.
 */
export function getNeuralAudioUrl(text: string, voice?: string): string {
  const params = new URLSearchParams({
    text: text.trim(),
    voice: voice || 'en-US-ChristopherNeural',
  });
  return `${API_BASE}/api/tts/audio?${params.toString()}`;
}

/**
 * Synthesizes studio-quality human neural speech using Microsoft Edge Neural TTS.
 * Returns an object URL for high-fidelity HTML5 Audio playback.
 */
export async function synthesizeNeuralSpeech(text: string, voice?: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  if (!res.ok) {
    throw new Error(`TTS synthesis returned HTTP ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function fetchAiProviders(customApiKey?: string): Promise<AiProvidersResponse> {
  try {
    const url = customApiKey
      ? `${API_BASE}/api/ai/providers?apiKey=${encodeURIComponent(customApiKey)}`
      : `${API_BASE}/api/ai/providers`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as AiProvidersResponse;
      }
    }
  } catch (err) {
    console.warn('[API] Could not fetch AI providers list:', err);
  }

  return {
    providers: [
      {
        id: 'groq',
        name: 'Groq Cloud (Llama 3.3 70B)',
        model: 'llama-3.3-70b-versatile',
        speed: 'Ultra-Fast (~1.2s)',
        freeTier: '14,400 req/day (Free)',
        isConfigured: false,
        isRecommended: true,
      },
      {
        id: 'gemini',
        name: 'Google Gemini (2.5 Flash)',
        model: 'gemini-2.5-flash',
        speed: 'Standard (~5-15s)',
        freeTier: '20 req/day (Free Tier)',
        isConfigured: true,
        isRecommended: false,
      },
    ],
    defaultProvider: 'gemini',
  };
}

export async function askFollowUpQuestion(payload: AskQuestionPayload): Promise<AskQuestionResult> {
  try {
    const res = await fetch(`${API_BASE}/api/qa/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as AskQuestionResult;
      }
    } else {
      let errText = `Status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error) errText = errJson.error;
      } catch {}
      console.error(`[API] [AI QA GENERATION ERROR] Server returned error for question "${payload.question}": ${errText}`);
    }

    console.warn('[API] Live QA unavailable or rate-limited; activating local tutor fallback.');
  } catch (err) {
    console.error(`[API] [AI QA GENERATION FAILED] Network or server error when asking "${payload.question}":`, err);
  }

  // Client-side fallback if server is unreachable or quota exhausted
  return getClientFallbackAnswer(payload.question, payload.lessonTopic, payload.currentElements);
}

function getClientFallbackAnswer(
  question: string,
  topic: string,
  currentElements?: Array<{ id: string; type: string; label?: string }>
): AskQuestionResult {
  const q = question.toLowerCase();

  if (topic.toLowerCase().includes('bst') || topic.toLowerCase().includes('binary search')) {
    if (q.includes('insert') || q.includes('5')) {
      return {
        answer: `To insert **5** into this BST:\n\n1. Compare $5 < 8$ (Root), so move left to node $3$.\n2. Compare $5 > 3$, so move right.\n3. The right spot of $3$ is empty, so insert **5** as $3$'s right child.\n\nAll BST ordering invariants are preserved!`,
        highlightIds: ['root-8', 'node-3'],
        newActions: [
          {
            type: 'node',
            id: 'qa-node-5',
            x: 430,
            y: 440,
            radius: 26,
            label: '5',
            subtext: 'New Leaf',
            fillColor: '#1e293b',
            strokeColor: '#ec4899',
            timeOffset: 0,
          },
          {
            type: 'arrow',
            id: 'qa-arrow-3-5',
            from: { x: 370, y: 360 },
            to: { x: 420, y: 420 },
            label: '5 > 3',
            strokeColor: '#ec4899',
            dashed: true,
            timeOffset: 0,
          },
        ],
      };
    }
  }

  const highlightIds = currentElements && currentElements.length > 0 ? [currentElements[0].id] : [];
  return {
    answer: `Great observation! In **${topic}**, notice how the highlighted elements enforce the governing rules of the system. Understanding this relationship helps build intuition for edge cases.`,
    highlightIds,
  };
}


export async function requestLessonGeneration(
  topic: string,
  options?: { provider?: AiProviderChoice; apiKey?: string }
): Promise<LessonGenerationResponse> {
  const controller = new AbortController();
  const timeoutMs = 80000; // 80 seconds timeout for comprehensive whiteboard lesson synthesis
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}/api/lessons/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        provider: options?.provider || 'auto',
        apiKey: options?.apiKey,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorDetail = `AI generation service responded with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error) {
          errorDetail = errJson.error;
        }
      } catch {
        // ignore json parse error
      }
      console.error(`[API] [AI LESSON GENERATION FAILED] Server rejected generation for "${topic}":`, {
        status: res.status,
        error: errorDetail,
        timestamp: new Date().toISOString(),
      });
      throw new Error(errorDetail);
    }

    const json = await res.json();
    if (json.success && json.data) {
      return {
        lessonPlan: json.data as LessonPlan,
        source: json.source === 'live' ? 'live' : 'preset',
        modelUsed: json.modelUsed,
      };
    }

    throw new Error('AI generation returned an unexpected response structure.');
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    let errorMessage = err instanceof Error ? err.message : String(err);
    if (err instanceof Error && (err.name === 'AbortError' || errorMessage.toLowerCase().includes('aborted'))) {
      errorMessage = `AI lesson synthesis timed out after ${timeoutMs / 1000}s. The AI model took longer than expected to generate the visual whiteboard plan.`;
    }
    console.error(`[API] [AI RESPONSE GENERATION ERROR] Unable to generate AI whiteboard lesson for "${topic}":`, {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw new Error(errorMessage);
  }
}
