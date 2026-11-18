import React, { useState } from 'react';
import { Sparkles, ArrowRight, BookOpen, BrainCircuit, Activity, Compass, Zap } from 'lucide-react';
import { AiProviderChoice } from '../../services/api';

interface TopicInputProps {
  onSubmit: (topic: string, provider?: AiProviderChoice, apiKey?: string) => void;
  onSelectPreset?: (presetTopic: string) => void;
  isLoading?: boolean;
}

const PRESET_TOPICS = [
  {
    topic: 'Binary Search Trees',
    category: 'Computer Science',
    icon: BrainCircuit,
    description: 'Hierarchical node insertion, left/right subtree traversal & binary search logic',
  },
  {
    topic: 'The Pythagorean Theorem',
    category: 'Mathematics',
    icon: Compass,
    description: 'Visual geometric proof with squares a² + b² = c² and right-angle triangle proofs',
  },
  {
    topic: 'Neural Network Backpropagation',
    category: 'Deep Learning',
    icon: Activity,
    description: 'Forward propagation activations, error loss gradients & weight delta updates',
  },
];

export const TopicInput: React.FC<TopicInputProps> = ({
  onSubmit,
  onSelectPreset,
  isLoading = false,
}) => {
  const [topic, setTopic] = useState('');
  const selectedProvider: AiProviderChoice = 'groq';
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('user_custom_ai_key') || '');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onSubmit(topic.trim(), selectedProvider, customApiKey.trim() || undefined);
    }
  };

  const handlePresetClick = (presetTopic: string) => {
    if (onSelectPreset) {
      onSelectPreset(presetTopic);
    } else {
      onSubmit(presetTopic, selectedProvider, customApiKey.trim() || undefined);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 text-center">
      {/* Top Engine Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-normal mb-5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
        <span>AI-Powered Interactive Whiteboard Tutor</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-2xl font-normal text-white mb-3">
        What would you like to{' '}
        <span className="text-blue-400 underline decoration-blue-500 underline-offset-4">
          understand today?
        </span>
      </h1>
      <p className="text-slate-300 text-sm max-w-lg mb-6 font-normal">
        Enter any topic to synthesize a synchronized whiteboard lesson with step-by-step visual
        diagrams, mathematical formulas, and natural voice narration.
      </p>

      {/* AI Engine - Fixed to Groq Cloud */}
      <div className="w-full max-w-xl mb-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono text-slate-400 font-normal flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Model Engine (Fixed):</span>
          </span>
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors font-normal flex items-center gap-1"
          >
            <span>{customApiKey ? 'Custom Key Active' : 'Enter Groq Key'}</span>
          </button>
        </div>

        {/* Fixed Groq Engine Banner */}
        <div className="flex items-center justify-between px-3 py-2 bg-blue-950/60 border border-blue-800/80 rounded-lg text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-normal text-white flex items-center gap-1.5">
                <span>⚡ Groq Cloud (Fixed Active Engine)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700">
                  GPT-OSS 120B / Llama 3.3
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-normal">
                Ultra-fast lesson synthesis (~1.2s) • 14,400 free requests/day
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-normal shrink-0">Free & Ready</span>
        </div>

        {/* Optional Custom API Key input drawer */}
        {showKeyInput && (
          <div className="mt-1 pt-2 border-t border-slate-800 flex flex-col gap-1.5 text-left px-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-normal">
              <span>{selectedProvider === 'groq' ? 'Groq Key (starts with gsk_)' : 'Gemini Key'}</span>
              {selectedProvider === 'groq' && (
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline font-normal"
                >
                  Free Key Link
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => {
                  setCustomApiKey(e.target.value);
                  localStorage.setItem('user_custom_ai_key', e.target.value);
                }}
                placeholder={selectedProvider === 'groq' ? 'gsk_...' : 'AIzaSy...'}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-normal focus:outline-none focus:border-blue-500"
              />
              {customApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomApiKey('');
                    localStorage.removeItem('user_custom_ai_key');
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg bg-slate-800 font-normal"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Topic Input Form */}
      <form onSubmit={handleSubmit} className="w-full mb-8">
        <div className="relative flex items-center shadow-xl rounded-xl bg-slate-900 border border-slate-700 focus-within:border-blue-500 transition-all p-1">
          <BookOpen className="w-4 h-4 text-slate-400 ml-3.5 pointer-events-none shrink-0" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How does Quantum Superposition work? or Dijkstra's Algorithm..."
            disabled={isLoading}
            className="w-full bg-transparent px-3 py-2.5 text-slate-100 placeholder-slate-400 focus:outline-none text-sm font-normal"
          />
          <button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-normal text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Curated Pre-built Demonstrations Section */}
      <div className="w-full text-left">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="flex items-center gap-1.5 text-xs font-normal text-slate-400 uppercase font-mono m-0">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Curated Showcase Demonstrations</span>
          </h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full font-normal">
            Instant Offline Playback
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_TOPICS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.topic}
                onClick={() => handlePresetClick(p.topic)}
                disabled={isLoading}
                className="flex flex-col text-left p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-700 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 group-hover:text-blue-300 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-blue-400 block truncate font-normal">
                      {p.category}
                    </span>
                    <h3 className="text-sm font-normal text-slate-200 group-hover:text-white truncate">
                      {p.topic}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 font-normal">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
