import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AskQuestionRequestDTO,
  AskQuestionResponseDTO,
  AskQuestionResponseSchema,
} from '../schemas/qa.schema.js';
import { TimedActionSchema } from '../schemas/lesson.schema.js';

function sanitizeQaActions(actions: any[]): any[] {
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

    if (!act.id) act.id = `qa-act-${Date.now()}-${idx + 1}`;
    if (typeof act.timeOffset !== 'number' || isNaN(act.timeOffset)) {
      act.timeOffset = 0;
    }

    if (act.type === 'node') {
      act.x = Math.max(10, Math.min(990, Number(act.x) || 500));
      act.y = Math.max(10, Math.min(640, Number(act.y) || 250));
      act.radius = Math.max(10, Math.min(80, Number(act.radius) || 28));
      act.label = String(act.label || 'Node');
    } else if (act.type === 'box') {
      act.x = Math.max(10, Math.min(950, Number(act.x) || 400));
      act.y = Math.max(10, Math.min(600, Number(act.y) || 250));
      act.width = Math.max(20, Math.min(900, Number(act.width) || 160));
      act.height = Math.max(20, Math.min(500, Number(act.height) || 70));
      act.label = String(act.label || 'Concept');
    } else if (act.type === 'arrow') {
      if (!act.from || typeof act.from !== 'object') {
        act.from = { x: 380, y: 350 };
      }
      if (!act.to || typeof act.to !== 'object') {
        act.to = { x: 440, y: 430 };
      }
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
      console.warn('[QaService] Filtered invalid QA action:', res.error.issues[0]?.message);
    }
  });

  return validated;
}

export class QaService {
  private genAI: GoogleGenerativeAI | null = null;
  private primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0 && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey.trim());
    }
  }

  public async answerQuestion(payload: AskQuestionRequestDTO): Promise<AskQuestionResponseDTO> {
    const { question, lessonTopic, lessonSummary, currentSegmentTitle, currentElements, chatHistory } = payload;

    if (!this.genAI) {
      console.warn(`[QaService] No GEMINI_API_KEY configured. Returning contextual Socratic fallback.`);
      return this.generateFallbackAnswer(question, lessonTopic, currentElements);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.primaryModel,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const elementContext = currentElements && currentElements.length > 0
        ? `Current visible whiteboard elements:\n${currentElements.map((e) => `- ID: "${e.id}", Type: ${e.type}, Label: "${e.label || ''}"`).join('\n')}`
        : 'No specific elements are active on the board right now.';

      const chatHistoryContext = chatHistory && chatHistory.length > 0
        ? `Prior conversation:\n${chatHistory.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}`
        : 'No prior conversation.';

      const prompt = `You are an expert Socratic AI whiteboard tutor answering a student's follow-up question.
Lesson Topic: "${lessonTopic}"
Lesson Summary: "${lessonSummary || ''}"
Active Chapter / Segment: "${currentSegmentTitle || ''}"

${elementContext}

${chatHistoryContext}

Student's Question: "${question}"

Instructions:
1. Provide a clear, encouraging, Socratic pedagogical answer. Keep it concise (2-4 paragraphs max).
2. If mathematical formulas are relevant, write them in standard KaTeX syntax ($...$ or $$...$$).
3. If referencing any currently visible elements on the board, include their exact IDs in the "highlightIds" array so they can glow/spotlight on the canvas.
4. If illustrating a new concept or node would help (e.g. inserting a node, showing a formula, drawing an arrow), provide new canvas elements in "newActions". Supported types: "node", "box", "arrow", "text", "math". (Coordinates between x: 50-950, y: 50-600).
   Important action format specifications:
   - "node": { "type": "node", "id": "qa-n1", "x": 430, "y": 440, "radius": 26, "label": "5", "subtext": "New Leaf", "strokeColor": "#ec4899" }
   - "arrow": { "type": "arrow", "id": "qa-a1", "from": {"x": 370, "y": 360}, "to": {"x": 420, "y": 420}, "label": "5 > 3", "strokeColor": "#ec4899" }
   - "math": { "type": "math", "id": "qa-m1", "x": 450, "y": 200, "latex": "\\Delta w = -\\eta \\nabla L" }
   - "text": { "type": "text", "id": "qa-t1", "x": 450, "y": 100, "text": "Notice this branch" }
   *Note: For arrows, "from" and "to" MUST be coordinate objects { "x": number, "y": number }, never string IDs.*

5. Output format must be JSON matching this exact structure:
{
  "answer": "<Explanation text with optional KaTeX>",
  "highlightIds": ["<id1>", "<id2>"],
  "newActions": [
    // optional array of visual actions
  ]
}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const parsedJson = JSON.parse(text);

      if (Array.isArray(parsedJson.newActions)) {
        parsedJson.newActions = sanitizeQaActions(parsedJson.newActions);
      }

      const validation = AskQuestionResponseSchema.safeParse(parsedJson);
      if (validation.success) {
        return validation.data;
      }

      console.warn('[QaService] [AI SCHEMA WARNING] Non-fatal schema warning on Gemini response, returning sanitized answer:', validation.error.format());
      return {
        answer: parsedJson.answer || 'Here is an explanation based on the lesson context.',
        highlightIds: Array.isArray(parsedJson.highlightIds) ? parsedJson.highlightIds : [],
        newActions: Array.isArray(parsedJson.newActions) ? parsedJson.newActions : undefined,
      };
    } catch (err) {
      console.error(`[QaService] [AI GENERATION FAILED] AI unable to generate response for question: "${question}" on topic: "${lessonTopic}":`, {
        error: err instanceof Error ? err.message : String(err),
        status: (err as any)?.status,
        timestamp: new Date().toISOString(),
      });
      return this.generateFallbackAnswer(question, lessonTopic, currentElements);
    }
  }

  private generateFallbackAnswer(
    question: string,
    topic: string,
    currentElements?: Array<{ id: string; type: string; label?: string }>
  ): AskQuestionResponseDTO {
    const qLower = question.toLowerCase();
    const highlightIds: string[] = [];

    // Check if user question relates to BST
    if (topic.toLowerCase().includes('bst') || topic.toLowerCase().includes('binary search')) {
      if (qLower.includes('insert') || qLower.includes('add') || qLower.includes('5')) {
        return {
          answer: `Great question about BST insertion! 

To insert a new value like **5**, we begin at the root node ($8$). Since $5 < 8$, we traverse down to the left subtree at node $3$. 

Next, because $5 > 3$, we move to the right child of $3$. Since that position is empty, node $5$ is inserted there as the right child of $3$. The binary search invariant ($L < \\text{Node} < R$) is preserved everywhere!`,
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
              label: '5 > 3 (Right)',
              strokeColor: '#ec4899',
              dashed: true,
              timeOffset: 0,
            },
          ],
        };
      }

      if (qLower.includes('delete') || qLower.includes('remove')) {
        return {
          answer: `When deleting a node in a BST, there are three classic cases to consider:
1. **Leaf Node (0 children):** Simply remove the reference to it.
2. **One Child:** Replace the deleted node with its single child.
3. **Two Children (e.g. Node 8):** Replace it with its *in-order successor* (the smallest value in the right subtree) or *in-order predecessor* (the largest in the left subtree). This guarantees the ordering property remains intact!`,
          highlightIds: ['root-8'],
        };
      }
    }

    // Pythagorean Theorem
    if (topic.toLowerCase().includes('pythagor') || topic.toLowerCase().includes('triangle')) {
      if (qLower.includes('why') || qLower.includes('proof') || qLower.includes('formula')) {
        return {
          answer: `The Pythagorean Theorem states that for any right triangle with legs $a$ and $b$ and hypotenuse $c$:

$$a^2 + b^2 = c^2$$

Visually, think of this as **conservation of geometric area**. If you construct a physical square on side $a$ (area $a^2$) and a square on side $b$ (area $b^2$), their combined area matches the square formed on side $c$ ($c^2$). For sides $3$ and $4$, $3^2 + 4^2 = 9 + 16 = 25 = 5^2$!`,
          highlightIds: ['sq-a', 'sq-b', 'sq-c'],
        };
      }
    }

    // Default intelligent pedagogical reply
    const firstElementId = currentElements && currentElements[0]?.id;
    if (firstElementId) highlightIds.push(firstElementId);

    return {
      answer: `That is an insightful question about **${topic}**! 

When exploring this step, notice how each component interacts directly with the core invariant. In particular, observing the highlighted structure reveals how the system transitions between states without violating its foundational constraints. 

Would you like to explore an edge case, or see another visual walk-through?`,
      highlightIds,
    };
  }
}

export const qaService = new QaService();
