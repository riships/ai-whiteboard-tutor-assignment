import { LessonPlanDTO, LessonPlanSchema, TimedActionSchema } from '../schemas/lesson.schema.js';
import { AskQuestionRequestDTO } from '../schemas/qa.schema.js';

export function buildLessonPrompt(topic: string): string {
  return `You are an expert interactive whiteboard tutor.
Create a structured 90-to-120-second visual whiteboard lesson teaching the topic: "${topic}".

Canvas Layout Constraints:
- The virtual whiteboard canvas has dimensions width: 1000, height: 650.
- All (x, y) coordinates must be comfortably within bounds (x between 70 and 930, y between 70 and 590).
- Do not overlap elements unless deliberately connecting them.
- Use visually distinct coordinates so diagrams look clean, well-spaced, and pedagogical.

Format Requirements:
Output must be a single valid JSON object following this exact structure:
{
  "id": "lesson-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  "topic": "${topic}",
  "title": "<Concise Engaging Title>",
  "summary": "<1-2 sentence overview of what will be learned>",
  "totalDuration": 100,
  "segments": [
    {
      "id": "seg-1",
      "title": "<Segment 1 Title>",
      "startTime": 0,
      "endTime": 25,
      "narration": "<Conversational, energetic human tutor explanation with spoken cues without markdown or LaTeX symbols>",
      "actions": [
        // Array of timed canvas visual actions
      ]
    }
    // Exactly 4 continuous segments spanning 0 to totalDuration
  ]
}

Action Specifications (Every action MUST have "type" and "timeOffset" in seconds relative to segment startTime):
1. "node": { "type": "node", "id": "n1", "x": 500, "y": 150, "radius": 28, "label": "Text", "subtext": "optional", "fillColor": "#1e293b", "strokeColor": "#38bdf8", "timeOffset": 0.5 }
2. "box": { "type": "box", "id": "b1", "x": 100, "y": 200, "width": 180, "height": 80, "label": "Box text", "title": "Optional Header", "fillColor": "#0f172a", "strokeColor": "#60a5fa", "timeOffset": 1.0 }
3. "arrow": { "type": "arrow", "id": "a1", "from": {"x": 500, "y": 178}, "to": {"x": 350, "y": 280}, "label": "edge label", "strokeColor": "#94a3b8", "curve": "none", "timeOffset": 2.0 }
4. "text": { "type": "text", "id": "t1", "x": 500, "y": 80, "text": "Clear Heading", "fontSize": 20, "fontWeight": "bold", "color": "#f8fafc", "timeOffset": 0 }
5. "math": { "type": "math", "id": "m1", "x": 500, "y": 300, "latex": "a^2 + b^2 = c^2", "fontSize": 22, "timeOffset": 1.5 }
6. "highlight": { "type": "highlight", "targetId": "n1", "timeOffset": 3.0 }
7. "pointer": { "type": "pointer", "x": 500, "y": 150, "visible": true, "label": "Look here", "timeOffset": 2.5 }
8. "clear": { "type": "clear", "timeOffset": 0 }

Rules:
1. Ensure segment times connect smoothly (segment N startTime equals segment N-1 endTime).
2. Canvas Anti-Overlap Rule: Always start Segments 2, 3, and 4 with a { "type": "clear", "timeOffset": 0 } action so previous diagrams do not clutter or overlap with new content, UNLESS the segment directly builds upon the same diagram. In the final summary/recap segment, ALWAYS clear the whiteboard first.
3. Clean Box Spacing: When creating a box with both "title" and "label", set width >= 160 and height >= 75 so the header and body text never touch. Keep "label" short (max 8 words).
4. Short Bullet Points: Never output a single long paragraph in a "text" element. Keep text concise (max 10 words per text action), or split items across separate Y coordinates (e.g., y=200, y=260, y=320).
5. Human Tutor Persona: Speak like an engaging, enthusiastic human whiteboard tutor in a 1-on-1 session ("Notice how...", "Watch what happens right here...", "Look closely at this branch!"). Use short natural sentences with commas so speech synthesis breathes naturally.
6. Natural Pacing: Speak in phonetically natural English (say "A squared plus B squared equals C squared" in narration, while writing "a^2 + b^2 = c^2" in the math action).
7. Synchronize whiteboard actions with what is being spoken at that moment via "timeOffset".`;
}

export function buildQaPrompt(dto: AskQuestionRequestDTO): string {
  const { question, lessonTopic, lessonSummary, currentSegmentTitle, currentSegmentIndex, currentElements, chatHistory } = dto;

  const elementsSummary = currentElements && currentElements.length > 0
    ? currentElements.map((el) => `[ID: ${el.id}, Type: ${el.type}${el.label ? `, Label: "${el.label}"` : ''}]`).join(', ')
    : 'None currently rendered';

  const historySummary = chatHistory && chatHistory.length > 0
    ? chatHistory.slice(-4).map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')
    : 'No previous messages';

  return `You are an expert, supportive Socratic whiteboard tutor explaining a concept in response to a student's follow-up question.

Lesson Topic: "${lessonTopic}"
Lesson Overview: ${lessonSummary || 'Visual whiteboard instruction session'}
Current Chapter: ${currentSegmentTitle || 'General Overview'} (Step ${(currentSegmentIndex ?? 0) + 1})
Currently Visible Canvas Elements: ${elementsSummary}

Previous Conversation:
${historySummary}

Student Question: "${question}"

Instructions:
1. Thorough Pedagogical Explanation: Provide a clear, insightful, step-by-step explanation. Break down the intuition, the underlying mechanics, and give a concrete example. Sound like an energetic, passionate 1-on-1 human tutor explaining at the whiteboard.
2. Voice-Friendly Formatting: Write in natural, spoken English sentences with commas and periods so speech synthesis reads it fluently.
3. Math Formatting: If formulas or complexities are discussed, wrap inline math in $...$ (e.g. $O(\\log n)$) and block math in $$...$$.
4. Whiteboard Demonstration Actions: ALWAYS visually illustrate your explanation on the whiteboard! Provide 1 to 4 new canvas elements in "newActions" placed in clean, unoccupied areas (canvas size: 1000x650; suggested area: x: 380-780, y: 340-520):
   - "node": { "type": "node", "id": "qa-n1", "x": 480, "y": 420, "radius": 26, "label": "5", "subtext": "New Leaf", "strokeColor": "#ec4899" }
   - "arrow": { "type": "arrow", "id": "qa-a1", "from": { "x": 420, "y": 350 }, "to": { "x": 480, "y": 410 }, "label": "5 > 3 (Right)", "strokeColor": "#ec4899" }
   - "box": { "type": "box", "id": "qa-b1", "x": 400, "y": 360, "width": 180, "height": 75, "title": "Complexity", "label": "O(log n) average" }
   - "text": { "type": "text", "id": "qa-t1", "x": 500, "y": 110, "text": "Notice this transition step" }
   - "math": { "type": "math", "id": "qa-m1", "x": 500, "y": 460, "latex": "T(n) = T(n/2) + O(1)" }
   *Note: For arrows, "from" and "to" MUST be coordinate objects { "x": number, "y": number }, never string IDs.*
5. Canvas Spotlight: If existing elements on the canvas are referenced in your explanation, include their exact IDs in "highlightIds" so they glow on the whiteboard.

Output format must be valid JSON:
{
  "answer": "<Thorough explanation text with optional KaTeX>",
  "highlightIds": ["<id1>", "<id2>"],
  "newActions": [
    // array of 1 to 4 visual canvas actions illustrating the answer
  ]
}`;
}

export function sanitizeRawLessonPlan(raw: any, topic: string): any {
  if (!raw || typeof raw !== 'object') return raw;
  if (!raw.id) raw.id = `lesson-${Date.now()}`;
  if (!raw.topic) raw.topic = topic;
  if (!raw.title) raw.title = topic;
  if (!raw.summary) raw.summary = `Interactive visual whiteboard lesson on ${topic}.`;
  if (!raw.totalDuration || typeof raw.totalDuration !== 'number') raw.totalDuration = 100;

  if (Array.isArray(raw.segments)) {
    raw.segments = raw.segments.map((seg: any, sIdx: number) => {
      if (!seg.id) seg.id = `seg-${sIdx + 1}`;
      if (!seg.title) seg.title = `Step ${sIdx + 1}`;
      if (typeof seg.startTime !== 'number') seg.startTime = sIdx * 25;
      if (typeof seg.endTime !== 'number') seg.endTime = (sIdx + 1) * 25;
      if (!seg.narration) seg.narration = `Let us explore step ${sIdx + 1} of ${topic}.`;

      if (Array.isArray(seg.actions)) {
        // Anti-overlap safeguard: prepend clear action to final summary segment if missing
        const isFinalSegment = sIdx === raw.segments.length - 1;
        const hasClear = seg.actions.some((a: any) => String(a?.type || a?.actionType || '').toLowerCase().trim() === 'clear');
        const hasSummaryBox = isFinalSegment && seg.actions.some((a: any) => {
          const t = String(a?.title || '');
          const l = String(a?.label || '');
          return /takeaway|summary|recap|core|key/i.test(t) || l.length > 40 || Number(a?.width) >= 350;
        });

        if (hasSummaryBox && !hasClear) {
          seg.actions.unshift({ type: 'clear', timeOffset: 0 });
        }

        const validatedActions: any[] = [];
        seg.actions.forEach((act: any, aIdx: number) => {
          if (!act || typeof act !== 'object') return;

          let type = String(act.type || act.actionType || act.kind || '').toLowerCase().trim();
          if (type === 'circle') type = 'node';
          if (type === 'rect' || type === 'rectangle') type = 'box';
          if (type === 'line' || type === 'edge' || type === 'connector') type = 'arrow';
          if (type === 'equation' || type === 'formula') type = 'math';
          if (type === 'label' || type === 'heading') type = 'text';
          act.type = type;

          if (typeof act.timeOffset !== 'number' || isNaN(act.timeOffset)) {
            act.timeOffset = Math.max(0, aIdx * 2);
          }

          if (act.type === 'node') {
            if (!act.id) act.id = `node-${sIdx + 1}-${aIdx + 1}`;
            act.x = Math.max(50, Math.min(950, Number(act.x) || 500));
            act.y = Math.max(100, Math.min(590, Number(act.y) || 250));
            act.radius = Math.max(24, Math.min(60, Number(act.radius) || 28));
            act.label = String(act.label || 'Node');
          } else if (act.type === 'box') {
            if (!act.id) act.id = `box-${sIdx + 1}-${aIdx + 1}`;
            act.x = Math.max(10, Math.min(950, Number(act.x) || 400));
            act.y = Math.max(10, Math.min(600, Number(act.y) || 250));
            act.width = Math.max(140, Math.min(900, Number(act.width) || 180));
            // Ensure boxes with a title header or long text have ample height
            const hasTitle = Boolean(act.title);
            const isLong = String(act.label || '').length > 40;
            const minHeight = hasTitle ? (isLong ? 110 : 70) : (isLong ? 85 : 45);
            act.height = Math.max(minHeight, Math.min(500, Number(act.height) || 75));
            act.label = String(act.label || 'Concept');
          } else if (act.type === 'arrow') {
            if (!act.id) act.id = `arrow-${sIdx + 1}-${aIdx + 1}`;
            if (!act.from || typeof act.from !== 'object') act.from = { x: 350, y: 250 };
            if (!act.to || typeof act.to !== 'object') act.to = { x: 550, y: 250 };
            act.from = {
              x: Math.max(0, Math.min(1000, Number(act.from.x) || 350)),
              y: Math.max(0, Math.min(650, Number(act.from.y) || 250)),
            };
            act.to = {
              x: Math.max(0, Math.min(1000, Number(act.to.x) || 550)),
              y: Math.max(0, Math.min(650, Number(act.to.y) || 250)),
            };
            if (act.curve !== 'left' && act.curve !== 'right' && act.curve !== 'none') {
              act.curve = 'none';
            }
          } else if (act.type === 'text') {
            if (!act.id) act.id = `text-${sIdx + 1}-${aIdx + 1}`;
            act.text = String(act.text || 'Key Concept');
            act.fontSize = Math.max(10, Math.min(48, Number(act.fontSize) || 20));
            // Ensure top titles/headers never collide with fullscreen UI notifications
            act.y = Math.max(85, Math.min(640, Number(act.y) || 100));
            // If centered title or heading, align x to 500
            const isCenter = (Number(act.x) >= 300 && Number(act.x) <= 700) || act.y <= 110;
            act.x = isCenter ? 500 : Math.max(10, Math.min(990, Number(act.x) || 500));
            if (act.fontWeight !== 'normal' && act.fontWeight !== 'bold') {
              act.fontWeight = act.fontWeight === '600' || act.fontWeight === '700' ? 'bold' : 'normal';
            }
          } else if (act.type === 'math') {
            if (!act.id) act.id = `math-${sIdx + 1}-${aIdx + 1}`;
            act.x = Math.max(10, Math.min(990, Number(act.x) || 500));
            act.y = Math.max(10, Math.min(640, Number(act.y) || 200));
            act.latex = String(act.latex || 'f(x)');
            act.fontSize = Math.max(12, Math.min(40, Number(act.fontSize) || 22));
          } else if (act.type === 'highlight') {
            act.targetId = String(act.targetId || act.id || 'target-node');
            delete act.id;
          } else if (act.type === 'pointer') {
            act.x = Math.max(10, Math.min(990, Number(act.x) || 500));
            act.y = Math.max(10, Math.min(640, Number(act.y) || 250));
            act.visible = Boolean(act.visible !== false);
            delete act.id;
          } else if (act.type === 'clear') {
            delete act.id;
          }

          const parsedAction = TimedActionSchema.safeParse(act);
          if (parsedAction.success) {
            validatedActions.push(parsedAction.data);
          } else {
            console.warn(`[AI Sanitizer] Filtered non-conforming action (${act.type}):`, parsedAction.error.issues[0]?.message);
          }
        });
        seg.actions = validatedActions;
      } else {
        seg.actions = [];
      }
      return seg;
    });
  }
  return raw;
}

export function sanitizeQaActions(actions: any[]): any[] {
  if (!Array.isArray(actions)) return [];

  const validated: any[] = [];
  actions.forEach((act, idx) => {
    if (!act || typeof act !== 'object') return;

    let type = String(act.type || act.actionType || act.kind || '').toLowerCase().trim();
    if (type === 'circle') type = 'node';
    if (type === 'rect' || type === 'rectangle') type = 'box';
    if (type === 'line' || type === 'edge' || type === 'connector') type = 'arrow';
    if (type === 'equation' || type === 'formula') type = 'math';
    if (type === 'label' || type === 'heading') type = 'text';
    act.type = type;

    if (!act.id) act.id = `qa-${act.type}-${Date.now()}-${idx}`;
    if (typeof act.timeOffset !== 'number') act.timeOffset = 0;

    if (act.type === 'node') {
      act.x = Math.max(10, Math.min(990, Number(act.x) || 450));
      act.y = Math.max(10, Math.min(640, Number(act.y) || 350));
      act.radius = Math.max(10, Math.min(80, Number(act.radius) || 26));
      act.label = String(act.label || 'Node');
    } else if (act.type === 'box') {
      act.x = Math.max(10, Math.min(950, Number(act.x) || 400));
      act.y = Math.max(10, Math.min(600, Number(act.y) || 300));
      act.width = Math.max(40, Math.min(900, Number(act.width) || 160));
      act.height = Math.max(act.title ? 65 : 35, Math.min(500, Number(act.height) || 65));
      act.label = String(act.label || 'Concept');
    } else if (act.type === 'arrow') {
      if (!act.from || typeof act.from !== 'object') act.from = { x: 380, y: 350 };
      if (!act.to || typeof act.to !== 'object') act.to = { x: 440, y: 430 };
      act.from = {
        x: Math.max(0, Math.min(1000, Number(act.from.x) || 380)),
        y: Math.max(0, Math.min(650, Number(act.from.y) || 350)),
      };
      act.to = {
        x: Math.max(0, Math.min(1000, Number(act.to.x) || 440)),
        y: Math.max(0, Math.min(650, Number(act.to.y) || 430)),
      };
      if (act.curve !== 'left' && act.curve !== 'right' && act.curve !== 'none') {
        act.curve = 'none';
      }
    } else if (act.type === 'text') {
      act.x = Math.max(10, Math.min(990, Number(act.x) || 500));
      act.y = Math.max(10, Math.min(640, Number(act.y) || 100));
      act.text = String(act.text || 'Annotation');
      act.fontSize = Math.max(10, Math.min(48, Number(act.fontSize) || 18));
      if (act.fontWeight !== 'normal' && act.fontWeight !== 'bold') {
        act.fontWeight = act.fontWeight === '600' || act.fontWeight === '700' ? 'bold' : 'normal';
      }
    } else if (act.type === 'math') {
      act.x = Math.max(10, Math.min(990, Number(act.x) || 500));
      act.y = Math.max(10, Math.min(640, Number(act.y) || 200));
      act.latex = String(act.latex || 'f(x)');
      act.fontSize = Math.max(12, Math.min(40, Number(act.fontSize) || 20));
    } else if (act.type === 'highlight') {
      act.targetId = String(act.targetId || act.id || 'target-node');
      delete act.id;
    } else if (act.type === 'pointer') {
      act.x = Math.max(10, Math.min(990, Number(act.x) || 500));
      act.y = Math.max(10, Math.min(640, Number(act.y) || 250));
      act.visible = Boolean(act.visible !== false);
      delete act.id;
    } else if (act.type === 'clear') {
      delete act.id;
    }

    const res = TimedActionSchema.safeParse(act);
    if (res.success) {
      validated.push(res.data);
    } else {
      console.warn('[AI Sanitizer] Filtered invalid QA action:', res.error.issues[0]?.message);
    }
  });

  return validated;
}
