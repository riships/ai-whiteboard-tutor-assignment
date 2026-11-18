import {
  LessonSegment,
  CanvasElement,
  TutorPointerState,
} from '../types/canvas.types';

export interface CanvasStateAtTime {
  elements: CanvasElement[];
  pointer: TutorPointerState;
  activeNarration: string;
  activeSegmentIndex: number;
  activeChapterTitle: string;
}

/**
 * Pure function that calculates the cumulative canvas state, pointer position,
 * and active narration segment for any given lesson timestamp.
 */
export function getCanvasStateAtTime(
  segments: LessonSegment[],
  currentTime: number
): CanvasStateAtTime {
  const elementMap = new Map<string, CanvasElement>();
  let pointer: TutorPointerState = { x: 500, y: 300, visible: false };
  let activeNarration = '';
  let activeSegmentIndex = 0;
  let activeChapterTitle = '';

  if (!segments || segments.length === 0) {
    return {
      elements: [],
      pointer,
      activeNarration,
      activeSegmentIndex: 0,
      activeChapterTitle: '',
    };
  }

  // 1. Determine active segment index, narration, and chapter title
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (currentTime >= seg.startTime && (currentTime < seg.endTime || i === segments.length - 1)) {
      activeSegmentIndex = i;
      activeNarration = seg.narration;
      activeChapterTitle = seg.title;
      break;
    }
  }

  // Fallback if before start or beyond end
  if (!activeChapterTitle && segments.length > 0) {
    if (currentTime < segments[0].startTime) {
      activeSegmentIndex = 0;
      activeNarration = segments[0].narration;
      activeChapterTitle = segments[0].title;
    } else {
      activeSegmentIndex = segments.length - 1;
      activeNarration = segments[segments.length - 1].narration;
      activeChapterTitle = segments[segments.length - 1].title;
    }
  }

  // 2. Reconstruct cumulative visual state up to currentTime
  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    if (seg.startTime > currentTime) break;

    // Smart Anti-Overlap: If final summary chapter introduces a large takeaway/recap card
    // and lacks an explicit clear action, clear previous scratchpad drawings so elements never overlap
    const isFinalSegment = sIdx === segments.length - 1;
    const hasExplicitClear = seg.actions.some((a) => a.type === 'clear');
    const isSummarySegment =
      isFinalSegment &&
      seg.actions.some(
        (a) =>
          a.type === 'box' &&
          Boolean(
            (a.title && /takeaway|summary|recap|core|key/i.test(a.title)) ||
            (a.width && a.width >= 350) ||
            (a.label && a.label.length > 50)
          )
      );

    if (isSummarySegment && !hasExplicitClear && currentTime >= seg.startTime) {
      elementMap.clear();
    }

    for (const action of seg.actions) {
      const actionTime = seg.startTime + (action.timeOffset ?? 0);
      if (actionTime <= currentTime) {
        if (action.type === 'clear') {
          elementMap.clear();
        } else if (action.type === 'highlight') {
          const target = elementMap.get(action.targetId);
          if (target) {
            elementMap.set(action.targetId, { ...target, isHighlighted: true });
          }
        } else if (action.type === 'pointer') {
          pointer = {
            x: action.x,
            y: action.y,
            visible: action.visible,
            label: action.label,
          };
        } else {
          // Standard CanvasElement: upsert by ID
          elementMap.set(action.id, action as CanvasElement);
        }
      }
    }
  }

  return {
    elements: Array.from(elementMap.values()),
    pointer,
    activeNarration,
    activeSegmentIndex,
    activeChapterTitle,
  };
}
