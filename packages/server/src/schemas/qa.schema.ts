import { z } from 'zod';
import { TimedActionSchema } from './lesson.schema.js';

export const ChatMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(['user', 'tutor']),
  text: z.string(),
  timestamp: z.number().optional(),
});

export const AskQuestionRequestSchema = z.object({
  question: z.string().min(1).max(500),
  lessonTopic: z.string().min(1),
  lessonSummary: z.string().optional(),
  currentSegmentTitle: z.string().optional(),
  currentSegmentIndex: z.number().optional(),
  currentElements: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        label: z.string().optional(),
      })
    )
    .optional(),
  chatHistory: z.array(ChatMessageSchema).optional(),
  provider: z.enum(['auto', 'groq', 'gemini']).optional().default('auto'),
  apiKey: z.string().optional(),
});

export const AskQuestionResponseSchema = z.object({
  answer: z.string().min(1),
  highlightIds: z.array(z.string()).optional(),
  newActions: z.array(TimedActionSchema).optional(),
});

export type AskQuestionRequestDTO = z.infer<typeof AskQuestionRequestSchema>;
export type AskQuestionResponseDTO = z.infer<typeof AskQuestionResponseSchema>;
