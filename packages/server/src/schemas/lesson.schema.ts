import { z } from 'zod';

export const NodeActionSchema = z.object({
  type: z.literal('node'),
  id: z.string(),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(650),
  radius: z.number().min(10).max(80).default(28),
  label: z.string(),
  subtext: z.string().optional(),
  fillColor: z.string().optional(),
  strokeColor: z.string().optional(),
  timeOffset: z.number().min(0).optional().default(0),
});

export const BoxActionSchema = z.object({
  type: z.literal('box'),
  id: z.string(),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(650),
  width: z.number().min(20).max(900),
  height: z.number().min(20).max(500),
  label: z.string(),
  title: z.string().optional(),
  fillColor: z.string().optional(),
  strokeColor: z.string().optional(),
  timeOffset: z.number().min(0).optional().default(0),
});

export const ArrowActionSchema = z.object({
  type: z.literal('arrow'),
  id: z.string(),
  from: z.object({
    x: z.number().min(0).max(1000),
    y: z.number().min(0).max(650),
  }),
  to: z.object({
    x: z.number().min(0).max(1000),
    y: z.number().min(0).max(650),
  }),
  label: z.string().optional(),
  dashed: z.boolean().optional(),
  strokeColor: z.string().optional(),
  curve: z.enum(['left', 'right', 'none']).optional(),
  timeOffset: z.number().min(0).optional().default(0),
});

export const TextActionSchema = z.object({
  type: z.literal('text'),
  id: z.string(),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(650),
  text: z.string(),
  fontSize: z.number().min(10).max(48).optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(),
  handwritten: z.boolean().optional(),
  color: z.string().optional(),
  timeOffset: z.number().min(0).optional().default(0),
});

export const MathActionSchema = z.object({
  type: z.literal('math'),
  id: z.string(),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(650),
  latex: z.string(),
  fontSize: z.number().min(12).max(40).optional(),
  timeOffset: z.number().min(0).optional().default(0),
});

export const ClearActionSchema = z.object({
  type: z.literal('clear'),
  timeOffset: z.number().min(0).optional().default(0),
});

export const HighlightActionSchema = z.object({
  type: z.literal('highlight'),
  targetId: z.string(),
  timeOffset: z.number().min(0).optional().default(0),
});

export const PointerActionSchema = z.object({
  type: z.literal('pointer'),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(650),
  visible: z.boolean(),
  label: z.string().optional(),
  timeOffset: z.number().min(0).optional().default(0),
});

export const TimedActionSchema = z.discriminatedUnion('type', [
  NodeActionSchema,
  BoxActionSchema,
  ArrowActionSchema,
  TextActionSchema,
  MathActionSchema,
  ClearActionSchema,
  HighlightActionSchema,
  PointerActionSchema,
]);

export const LessonSegmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  startTime: z.number().min(0),
  endTime: z.number().min(1),
  narration: z.string().min(5),
  actions: z.array(TimedActionSchema),
});

export const LessonPlanSchema = z.object({
  id: z.string(),
  topic: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(5),
  totalDuration: z.number().min(30).max(300),
  segments: z.array(LessonSegmentSchema).min(3),
});

export const GenerateLessonRequestSchema = z.object({
  topic: z
    .string()
    .min(2, { message: 'Topic must be at least 2 characters long' })
    .max(120, { message: 'Topic must not exceed 120 characters' }),
  provider: z.enum(['auto', 'groq', 'gemini']).optional().default('auto'),
  apiKey: z.string().optional(),
});

export type LessonPlanDTO = z.infer<typeof LessonPlanSchema>;
export type LessonSegmentDTO = z.infer<typeof LessonSegmentSchema>;
export type TimedActionDTO = z.infer<typeof TimedActionSchema>;
