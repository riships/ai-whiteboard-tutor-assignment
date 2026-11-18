export type ElementType = 'node' | 'box' | 'arrow' | 'text' | 'math' | 'clear' | 'highlight' | 'pointer';

export interface BaseCanvasElement {
  id: string;
  color?: string;
  opacity?: number;
  isHighlighted?: boolean;
  timeOffset?: number;
}

export interface NodeElement extends BaseCanvasElement {
  type: 'node';
  x: number;
  y: number;
  radius: number;
  label: string;
  subtext?: string;
  fillColor?: string;
  strokeColor?: string;
}

export interface BoxElement extends BaseCanvasElement {
  type: 'box';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  title?: string;
  fillColor?: string;
  strokeColor?: string;
}

export interface ArrowElement extends BaseCanvasElement {
  type: 'arrow';
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  dashed?: boolean;
  strokeColor?: string;
  curve?: 'left' | 'right' | 'none';
}

export interface TextElement extends BaseCanvasElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  handwritten?: boolean;
}

export interface MathElement extends BaseCanvasElement {
  type: 'math';
  x: number;
  y: number;
  latex: string;
  fontSize?: number;
}

export interface TutorPointerState {
  x: number;
  y: number;
  visible: boolean;
  isDrawing?: boolean;
  label?: string;
}

export type CanvasElement = NodeElement | BoxElement | ArrowElement | TextElement | MathElement;

export interface ClearAction {
  type: 'clear';
  timeOffset?: number;
}

export interface HighlightAction {
  type: 'highlight';
  targetId: string;
  timeOffset?: number;
}

export interface PointerAction {
  type: 'pointer';
  x: number;
  y: number;
  visible: boolean;
  label?: string;
  timeOffset?: number;
}

export type TimedCanvasAction =
  | CanvasElement
  | ClearAction
  | HighlightAction
  | PointerAction;

export interface LessonSegment {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  narration: string;
  actions: TimedCanvasAction[];
}

export interface LessonPlan {
  id: string;
  topic: string;
  title: string;
  summary: string;
  totalDuration: number;
  segments: LessonSegment[];
}

export type PlaybackStatus = 'idle' | 'generating' | 'ready' | 'playing' | 'paused' | 'finished';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
  highlightIds?: string[];
}
