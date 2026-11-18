import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Shapes, Mic, CheckCircle2, ArrowLeft } from 'lucide-react';

interface AIGenerationOverlayProps {
  topic: string;
  onCancel?: () => void;
}

const GENERATION_STEPS = [
  {
    icon: Brain,
    title: 'Pedagogical Synthesis',
    description: 'Analyzing learning objectives and structuring multi-chapter curriculum...',
  },
  {
    icon: Shapes,
    title: 'Whiteboard Visual Design',
    description: 'Computing 2D coordinates, connecting branches, nodes, and KaTeX formulas...',
  },
  {
    icon: Mic,
    title: 'Voice Narration Tuning',
    description: 'Writing natural human tutor cadence with exact audio timecodes...',
  },
  {
    icon: Sparkles,
    title: 'Finalizing Whiteboard Canvas',
    description: 'Validating timeline synchronizer and preparing playback studio...',
  },
];

export const AIGenerationOverlay: React.FC<AIGenerationOverlayProps> = ({
  topic,
  onCancel,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Animate through generation steps smoothly
  useEffect(() => {
    const intervals = [4000, 7000, 7000];
    const timers: NodeJS.Timeout[] = [];

    let elapsed = 0;
    intervals.forEach((delay, idx) => {
      elapsed += delay;
      timers.push(
        setTimeout(() => {
          setActiveStepIndex(idx + 1);
        }, elapsed)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Top badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-normal mb-4">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Antigravity AI Tutor Engine</span>
        </div>

        {/* Topic Title */}
        <h2 className="text-xl font-normal text-white mb-2">
          Crafting Your Whiteboard Lesson
        </h2>
        <p className="text-slate-300 text-sm font-normal mb-6 max-w-md">
          Designing a personalized, visual whiteboard experience for{' '}
          <span className="text-blue-400 font-normal underline decoration-blue-500 underline-offset-4">
            "{topic}"
          </span>
        </p>

        {/* Step Ticker */}
        <div className="w-full space-y-2.5 mb-6 text-left">
          {GENERATION_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <div
                key={step.title}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-blue-950 border-blue-700 shadow-sm'
                    : isDone
                    ? 'bg-slate-950 border-slate-800 opacity-70'
                    : 'bg-slate-950 border-slate-900 opacity-40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isDone
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-sm animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-normal ${
                        isCurrent ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-mono font-normal text-blue-300 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-normal">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Helpful Human Tip */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mb-5 text-xs text-slate-400 flex items-center justify-center gap-1.5 font-normal">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-normal text-slate-300">Tip:</span>
          <span>Press Spacebar anytime to pause, or click any chapter node.</span>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and choose different topic</span>
          </button>
        )}
      </div>
    </div>
  );
};
