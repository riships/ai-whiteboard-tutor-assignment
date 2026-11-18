import { Request, Response } from 'express';
import { AskQuestionRequestSchema } from '../schemas/qa.schema.js';
import { aiOrchestrator } from '../services/ai.orchestrator.js';

export async function askQuestionHandler(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = AskQuestionRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const { provider, apiKey } = parseResult.data;
    const result = await aiOrchestrator.answerQuestion(parseResult.data, {
      provider,
      customApiKey: apiKey,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[QaController] Error handling question:', error);
    res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing the follow-up question',
    });
  }
}
