import { LessonPlanDTO } from '../schemas/lesson.schema.js';

export const PRESET_LESSONS: Record<string, LessonPlanDTO> = {
  bst: {
    id: 'preset-bst',
    topic: 'Binary Search Trees',
    title: 'Binary Search Trees (BST)',
    summary:
      'A binary search tree is an ordered hierarchical data structure where every node enforces the invariant: left child < parent < right child, providing logarithmic search efficiency.',
    totalDuration: 120,
    segments: [
      {
        id: 'bst-seg-1',
        title: 'The BST Invariant',
        startTime: 0,
        endTime: 22,
        narration:
          "Hey there! Welcome to the whiteboard! Today, we're going to break down Binary Search Trees together. The golden rule is super simple: everything smaller goes to the left, and everything bigger goes to the right! Watch the board right now as we bring up our first property.",
        actions: [
          {
            type: 'text',
            id: 'title-1',
            timeOffset: 1,
            x: 360,
            y: 70,
            text: 'Binary Search Tree (BST)',
            fontSize: 26,
            fontWeight: 'bold',
            color: '#60a5fa',
          },
          {
            type: 'text',
            id: 'prop-1',
            timeOffset: 6,
            x: 330,
            y: 110,
            text: 'Invariant: Left Subtree < Root < Right Subtree',
            fontSize: 16,
            handwritten: true,
            color: '#94a3b8',
          },
          {
            type: 'math',
            id: 'math-1',
            timeOffset: 12,
            x: 500,
            y: 155,
            latex: 'O(\\log n) \\text{ Average Search Time}',
            fontSize: 18,
          },
          {
            type: 'pointer',
            timeOffset: 14,
            x: 500,
            y: 155,
            visible: true,
            label: 'Logarithmic Efficiency',
          },
        ],
      },
      {
        id: 'bst-seg-2',
        title: 'Inserting Root Node 8',
        startTime: 22,
        endTime: 45,
        narration:
          "Let's put our very first number on the board: root node eight. See that circle right at the top? Every single value we add from now on gets compared against this eight. Take a look!",
        actions: [
          {
            type: 'node',
            id: 'node-8',
            timeOffset: 2,
            x: 500,
            y: 250,
            radius: 28,
            label: '8',
            subtext: 'Root',
            fillColor: '#1e3a8a',
            strokeColor: '#3b82f6',
          },
          {
            type: 'pointer',
            timeOffset: 6,
            x: 500,
            y: 250,
            visible: true,
            label: 'Root Node: 8',
          },
        ],
      },
      {
        id: 'bst-seg-3',
        title: 'Branching Left: Inserting 3',
        startTime: 45,
        endTime: 70,
        narration:
          "Now, let's insert the number three. Because three is less than eight, we go left! See that blue arrow forming? Node three locks right into place on the left branch.",
        actions: [
          {
            type: 'arrow',
            id: 'arrow-8-3',
            timeOffset: 2,
            from: { x: 480, y: 270 },
            to: { x: 370, y: 350 },
            label: '3 < 8 (Go Left)',
            strokeColor: '#38bdf8',
          },
          {
            type: 'node',
            id: 'node-3',
            timeOffset: 6,
            x: 350,
            y: 370,
            radius: 24,
            label: '3',
            subtext: 'Left',
            fillColor: '#0f766e',
            strokeColor: '#14b8a6',
          },
          {
            type: 'pointer',
            timeOffset: 10,
            x: 350,
            y: 370,
            visible: true,
            label: '3 < 8',
          },
        ],
      },
      {
        id: 'bst-seg-4',
        title: 'Branching Right: Inserting 10',
        startTime: 70,
        endTime: 95,
        narration:
          "Next up, let's add the number ten. Ten is greater than eight, so where does it go? Right to the right side! Notice how cleanly the tree stays organized.",
        actions: [
          {
            type: 'arrow',
            id: 'arrow-8-10',
            timeOffset: 2,
            from: { x: 520, y: 270 },
            to: { x: 630, y: 350 },
            label: '10 > 8 (Go Right)',
            strokeColor: '#f59e0b',
          },
          {
            type: 'node',
            id: 'node-10',
            timeOffset: 6,
            x: 650,
            y: 370,
            radius: 24,
            label: '10',
            subtext: 'Right',
            fillColor: '#78350f',
            strokeColor: '#f59e0b',
          },
          {
            type: 'pointer',
            timeOffset: 10,
            x: 650,
            y: 370,
            visible: true,
            label: '10 > 8',
          },
        ],
      },
      {
        id: 'bst-seg-5',
        title: 'Subtree Traversal & Final Summary',
        startTime: 95,
        endTime: 120,
        narration:
          "Now for the fun part: let's insert node six! Watch my pointer: six is less than eight, so we move left to three. But six is greater than three, so it branches right! In just two quick comparisons, we found its perfect spot.",
        actions: [
          {
            type: 'arrow',
            id: 'arrow-3-6',
            timeOffset: 2,
            from: { x: 370, y: 390 },
            to: { x: 430, y: 460 },
            label: '6 > 3',
            strokeColor: '#a855f7',
          },
          {
            type: 'node',
            id: 'node-6',
            timeOffset: 5,
            x: 445,
            y: 480,
            radius: 22,
            label: '6',
            subtext: 'Right of 3',
            fillColor: '#581c87',
            strokeColor: '#a855f7',
          },
          {
            type: 'box',
            id: 'box-summary',
            timeOffset: 10,
            x: 180,
            y: 540,
            width: 640,
            height: 60,
            title: 'Tutor Key Takeaway',
            label: 'Every step eliminates half the remaining subtree search space!',
          },
        ],
      },
    ],
  },
  pythagoras: {
    id: 'preset-pythagoras',
    topic: 'The Pythagorean Theorem',
    title: 'The Pythagorean Theorem',
    summary:
      'In any right-angled triangle, the square of the hypotenuse equals the sum of the squares on the other two sides: a² + b² = c².',
    totalDuration: 110,
    segments: [
      {
        id: 'pyth-seg-1',
        title: 'The Geometric Premise',
        startTime: 0,
        endTime: 20,
        narration:
          'Welcome! The Pythagorean Theorem is one of the most fundamental relations in geometry. For any right-angled triangle with perpendicular legs a and b, and hypotenuse c, the sum of areas a squared plus b squared exactly equals c squared.',
        actions: [
          {
            type: 'text',
            id: 'pyth-title',
            timeOffset: 1,
            x: 350,
            y: 65,
            text: 'The Pythagorean Theorem',
            fontSize: 26,
            fontWeight: 'bold',
            color: '#38bdf8',
          },
          {
            type: 'math',
            id: 'pyth-formula',
            timeOffset: 10,
            x: 500,
            y: 155,
            latex: 'a^2 + b^2 = c^2',
            fontSize: 24,
          },
        ],
      },
      {
        id: 'pyth-seg-2',
        title: 'Constructing the Right Triangle',
        startTime: 20,
        endTime: 42,
        narration:
          'Let us construct a right triangle. We draw a vertical leg a of length three units, a horizontal base leg b of length four units, and connect them with hypotenuse c of length five units.',
        actions: [
          {
            type: 'arrow',
            id: 'side-a',
            timeOffset: 2,
            from: { x: 380, y: 440 },
            to: { x: 380, y: 260 },
            label: 'Leg a = 3',
            strokeColor: '#38bdf8',
          },
          {
            type: 'arrow',
            id: 'side-b',
            timeOffset: 7,
            from: { x: 380, y: 440 },
            to: { x: 620, y: 440 },
            label: 'Leg b = 4',
            strokeColor: '#fbbf24',
          },
          {
            type: 'arrow',
            id: 'side-c',
            timeOffset: 12,
            from: { x: 380, y: 260 },
            to: { x: 620, y: 440 },
            label: 'Hypotenuse c = 5',
            strokeColor: '#a855f7',
          },
        ],
      },
      {
        id: 'pyth-seg-3',
        title: 'Area on Leg a: 3² = 9',
        startTime: 42,
        endTime: 65,
        narration:
          'Constructing a square along leg a with length three gives a total area of three times three, which equals nine square units.',
        actions: [
          {
            type: 'box',
            id: 'sq-a',
            timeOffset: 3,
            x: 230,
            y: 280,
            width: 140,
            height: 140,
            title: 'Area a²',
            label: '3² = 9',
            fillColor: 'rgba(56, 189, 248, 0.2)',
            strokeColor: '#38bdf8',
          },
        ],
      },
      {
        id: 'pyth-seg-4',
        title: 'Area on Leg b: 4² = 16',
        startTime: 65,
        endTime: 88,
        narration:
          'Similarly, a square on horizontal leg b with side length four yields an area of sixteen square units. Nine plus sixteen equals twenty-five.',
        actions: [
          {
            type: 'box',
            id: 'sq-b',
            timeOffset: 3,
            x: 400,
            y: 460,
            width: 200,
            height: 100,
            title: 'Area b²',
            label: '4² = 16',
            fillColor: 'rgba(251, 191, 36, 0.2)',
            strokeColor: '#fbbf24',
          },
        ],
      },
      {
        id: 'pyth-seg-5',
        title: 'Proof on Hypotenuse: c² = 25',
        startTime: 88,
        endTime: 110,
        narration:
          'Constructing a square on hypotenuse c gives twenty-five square units. Since nine plus sixteen equals twenty-five, the square root gives hypotenuse c equals five. Proven!',
        actions: [
          {
            type: 'box',
            id: 'sq-c',
            timeOffset: 2,
            x: 520,
            y: 220,
            width: 180,
            height: 150,
            title: 'Hypotenuse c²',
            label: 'Area = 25',
            fillColor: 'rgba(168, 85, 247, 0.2)',
            strokeColor: '#a855f7',
          },
          {
            type: 'math',
            id: 'proof-sum',
            timeOffset: 6,
            x: 500,
            y: 130,
            latex: '9 + 16 = 25 \\implies c = 5',
            fontSize: 20,
          },
        ],
      },
    ],
  },
  neuralNet: {
    id: 'preset-neural-net',
    topic: 'Neural Network Backpropagation',
    title: 'Neural Network Backpropagation',
    summary:
      'Backpropagation uses the calculus chain rule to compute loss gradients with respect to each weight, guiding gradient descent to minimize model errors.',
    totalDuration: 120,
    segments: [
      {
        id: 'nn-seg-1',
        title: 'The Optimization Goal',
        startTime: 0,
        endTime: 22,
        narration:
          'Welcome! Today we study how Neural Networks learn through Backpropagation. Neural networks improve by making predictions, measuring error using a loss function, and propagating gradients backward using the calculus chain rule.',
        actions: [
          {
            type: 'text',
            id: 'nn-title',
            timeOffset: 1,
            x: 310,
            y: 65,
            text: 'Neural Network Backpropagation',
            fontSize: 26,
            fontWeight: 'bold',
            color: '#ec4899',
          },
          {
            type: 'text',
            id: 'nn-sub',
            timeOffset: 6,
            x: 300,
            y: 105,
            text: 'Gradient descent computes how weights contribute to prediction error:',
            fontSize: 16,
            handwritten: true,
            color: '#94a3b8',
          },
          {
            type: 'math',
            id: 'loss-formula',
            timeOffset: 12,
            x: 500,
            y: 155,
            latex: '\\mathcal{L} = \\frac{1}{2}(y - \\hat{y})^2',
            fontSize: 22,
          },
        ],
      },
      {
        id: 'nn-seg-2',
        title: 'Input Layer Neurons',
        startTime: 22,
        endTime: 45,
        narration:
          'First, our training features arrive at the input layer. Here we have two input neurons: x one and x two. These numerical inputs represent measurable signals like pixels or sensory measurements.',
        actions: [
          {
            type: 'node',
            id: 'in-1',
            timeOffset: 4,
            x: 270,
            y: 260,
            radius: 26,
            label: 'x₁',
            subtext: 'Input 1',
            fillColor: '#0c4a6e',
            strokeColor: '#38bdf8',
          },
          {
            type: 'node',
            id: 'in-2',
            timeOffset: 8,
            x: 270,
            y: 390,
            radius: 26,
            label: 'x₂',
            subtext: 'Input 2',
            fillColor: '#0c4a6e',
            strokeColor: '#38bdf8',
          },
        ],
      },
      {
        id: 'nn-seg-3',
        title: 'Forward Pass to Hidden Layer',
        startTime: 45,
        endTime: 70,
        narration:
          'During the forward pass, inputs are multiplied by trainable synaptic weights w one and w two. These weighted signals sum at hidden neuron h one, which applies a non-linear activation function like sigmoid.',
        actions: [
          {
            type: 'arrow',
            id: 'fwd-1',
            timeOffset: 2,
            from: { x: 298, y: 260 },
            to: { x: 472, y: 325 },
            label: 'w₁',
            strokeColor: '#38bdf8',
          },
          {
            type: 'arrow',
            id: 'fwd-2',
            timeOffset: 4,
            from: { x: 298, y: 390 },
            to: { x: 472, y: 325 },
            label: 'w₂',
            strokeColor: '#38bdf8',
          },
          {
            type: 'node',
            id: 'hidden-1',
            timeOffset: 8,
            x: 500,
            y: 325,
            radius: 28,
            label: 'h₁',
            subtext: 'σ(w·x)',
            fillColor: '#4c1d95',
            strokeColor: '#a855f7',
          },
        ],
      },
      {
        id: 'nn-seg-4',
        title: 'Output Prediction & Error Loss',
        startTime: 70,
        endTime: 95,
        narration:
          'The activated signal moves forward through weight w out to output neuron y-hat, yielding our model prediction. We immediately compare y-hat against true label y to evaluate how far off our prediction is.',
        actions: [
          {
            type: 'arrow',
            id: 'fwd-out',
            timeOffset: 2,
            from: { x: 528, y: 325 },
            to: { x: 692, y: 325 },
            label: 'w_out',
            strokeColor: '#ec4899',
          },
          {
            type: 'node',
            id: 'out-1',
            timeOffset: 6,
            x: 720,
            y: 325,
            radius: 28,
            label: 'ŷ',
            subtext: 'Prediction',
            fillColor: '#831843',
            strokeColor: '#ec4899',
          },
        ],
      },
      {
        id: 'nn-seg-5',
        title: 'Backward Pass: Gradient Descent Update',
        startTime: 95,
        endTime: 120,
        narration:
          'Now backpropagation begins! The red dashed gradient arrows flow backward from output to input. Using the chain rule, we compute partial derivatives of loss with respect to each weight, updating every weight against the error gradient.',
        actions: [
          {
            type: 'arrow',
            id: 'back-grad-1',
            timeOffset: 2,
            from: { x: 695, y: 350 },
            to: { x: 525, y: 350 },
            label: '∂L/∂w_out',
            strokeColor: '#f43f5e',
            dashed: true,
            curve: 'left',
          },
          {
            type: 'math',
            id: 'chain-rule',
            timeOffset: 9,
            x: 500,
            y: 475,
            latex: 'w \\leftarrow w - \\eta \\cdot \\frac{\\partial \\mathcal{L}}{\\partial w}',
            fontSize: 22,
          },
        ],
      },
    ],
  },
};

export class PresetService {
  public getAvailablePresets(): Array<{ id: string; topic: string; title: string; summary: string }> {
    return Object.values(PRESET_LESSONS).map((p) => ({
      id: p.id,
      topic: p.topic,
      title: p.title,
      summary: p.summary,
    }));
  }

  public getPresetById(id: string): LessonPlanDTO | null {
    const found = Object.values(PRESET_LESSONS).find((p) => p.id === id);
    return found || null;
  }

  public findMatchingPreset(topic: string): LessonPlanDTO {
    const norm = topic.toLowerCase();
    if (norm.includes('bst') || norm.includes('binary search') || norm.includes('tree') || norm.includes('algorithm')) {
      return PRESET_LESSONS.bst;
    }
    if (norm.includes('pythagor') || norm.includes('triangle') || norm.includes('geometry') || norm.includes('math')) {
      return PRESET_LESSONS.pythagoras;
    }
    if (norm.includes('neural') || norm.includes('backprop') || norm.includes('deep learn') || norm.includes('gradient')) {
      return PRESET_LESSONS.neuralNet;
    }
    // Default fallback to BST if no direct match
    return PRESET_LESSONS.bst;
  }
}

export const presetService = new PresetService();

