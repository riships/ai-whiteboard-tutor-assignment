import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { Readable } from 'stream';

export interface TtsOptions {
  voice?: string;
  rate?: number; // e.g. 1.0
  pitch?: number;
}

export interface VoiceInfo {
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
}

export const AVAILABLE_NEURAL_VOICES: VoiceInfo[] = [
  {
    id: 'en-US-ChristopherNeural',
    name: 'Christopher (Neural)',
    gender: 'male',
    description: 'Enthusiastic, clear, pedagogical male tutor',
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (Neural)',
    gender: 'female',
    description: 'Warm, articulate, natural female tutor',
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (Neural)',
    gender: 'male',
    description: 'Conversational, deep, engaging male instructor',
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (Neural)',
    gender: 'female',
    description: 'Dynamic, positive, expressive female instructor',
  },
];

/**
 * Normalizes mathematical formulas, LaTeX, and markdown symbols into
 * natural spoken English for phonetically authentic speech synthesis.
 */
function sanitizeTextForNeuralTts(text: string): string {
  if (!text) return '';

  let speech = text;

  // Math conversions
  speech = speech.replace(/\$?O\(\\log\s*n\)\$?/gi, 'Big O of log n');
  speech = speech.replace(/\$?O\(n\s*\\log\s*n\)\$?/gi, 'Big O of n log n');
  speech = speech.replace(/\$?O\(n\^2\)\$?/gi, 'Big O of n squared');
  speech = speech.replace(/\$?O\(1\)\$?/gi, 'Big O of one');
  speech = speech.replace(/\$?O\(n\)\$?/gi, 'Big O of n');
  speech = speech.replace(/\$?O\(([a-zA-Z0-9_+*\s]+)\)\$?/gi, 'Big O of $1');

  // Common formulas
  speech = speech.replace(/\$?a\^2\s*\+\s*b\^2\s*=\s*c\^2\$?/gi, 'a squared plus b squared equals c squared');
  speech = speech.replace(/\b([a-zA-Z0-9])\^2\b/g, '$1 squared');
  speech = speech.replace(/\b([a-zA-Z0-9])\^3\b/g, '$1 cubed');

  // Invariants and inequalities
  speech = speech.replace(/<=|\\le/g, ' is less than or equal to ');
  speech = speech.replace(/>=|\\ge/g, ' is greater than or equal to ');
  speech = speech.replace(/<|\\lt/g, ' is less than ');
  speech = speech.replace(/>|\\gt/g, ' is greater than ');
  speech = speech.replace(/!=|\\neq/g, ' does not equal ');
  speech = speech.replace(/=/g, ' equals ');

  // Strip math delimiters
  speech = speech.replace(/\$\$([^\$]+)\$\$/g, '$1');
  speech = speech.replace(/\$([^\$]+)\$/g, '$1');

  // Strip markdown
  speech = speech.replace(/```[\s\S]*?```/g, '');
  speech = speech.replace(/`([^`]+)`/g, '$1');
  speech = speech.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
  speech = speech.replace(/#{1,6}\s+/g, '');
  speech = speech.replace(/^\s*[-*+]\s+/gm, '');
  speech = speech.replace(/^\s*\d+\.\s+/gm, '');

  // Punctuation and whitespace
  speech = speech.replace(/[\r\n]+/g, '. ');
  speech = speech.replace(/\s+/g, ' ');
  speech = speech.replace(/\.{2,}/g, '.');

  return speech.trim();
}

export class TtsService {
  private defaultVoice = 'en-US-ChristopherNeural';
  private audioCache = new Map<string, Buffer>();

  public async getAudioBuffer(text: string, options?: TtsOptions): Promise<Buffer> {
    const cleanText = sanitizeTextForNeuralTts(text);
    if (!cleanText) {
      throw new Error('No readable text provided for speech synthesis');
    }

    const voice = options?.voice || this.defaultVoice;
    const cacheKey = `${voice}:${cleanText}`;
    const cached = this.audioCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(cleanText);

    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      audioStream.on('end', () => {
        const fullBuffer = Buffer.concat(chunks);
        // Cache up to 100 recent segments in memory
        if (this.audioCache.size > 100) {
          const firstKey = this.audioCache.keys().next().value;
          if (firstKey) this.audioCache.delete(firstKey);
        }
        this.audioCache.set(cacheKey, fullBuffer);
        resolve(fullBuffer);
      });
      audioStream.on('error', reject);
    });
  }

  public async getAudioStream(text: string, options?: TtsOptions): Promise<Readable> {
    const cleanText = sanitizeTextForNeuralTts(text);
    if (!cleanText) {
      throw new Error('No readable text provided for speech synthesis');
    }

    const voice = options?.voice || this.defaultVoice;
    const tts = new MsEdgeTTS();

    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(cleanText);

    return audioStream;
  }

  public getAvailableVoices(): VoiceInfo[] {
    return AVAILABLE_NEURAL_VOICES;
  }
}

export const ttsService = new TtsService();
