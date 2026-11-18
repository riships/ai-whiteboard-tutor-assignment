import { Request, Response } from 'express';
import { ttsService } from '../services/tts.service.js';

export async function synthesizeSpeechHandler(req: Request, res: Response): Promise<void> {
  try {
    const text = req.method === 'GET' ? (req.query.text as string) : req.body?.text;
    const voice = req.method === 'GET' ? (req.query.voice as string) : req.body?.voice;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing or empty "text" parameter for speech synthesis',
      });
      return;
    }

    const audioBuffer = await ttsService.getAudioBuffer(text, {
      voice: typeof voice === 'string' && voice.trim().length > 0 ? voice.trim() : undefined,
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache identical audio segments for fast replay

    res.end(audioBuffer);
  } catch (error: any) {
    console.error('[TtsController] Error generating speech:', error?.message || error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to synthesize speech',
      });
    }
  }
}

export function getVoicesHandler(req: Request, res: Response): void {
  try {
    const voices = ttsService.getAvailableVoices();
    res.status(200).json({
      success: true,
      data: voices,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve voice list',
    });
  }
}
