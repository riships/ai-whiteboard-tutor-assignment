import React, { useState } from 'react';
import { TopicInput } from './components/chat/TopicInput';
import { WhiteboardStudio } from './components/studio/WhiteboardStudio';
import { AIGenerationOverlay } from './components/chat/AIGenerationOverlay';
import { useTutorStore } from './store/useTutorStore';
import { requestLessonGeneration, AiProviderChoice } from './services/api';
import { getLessonPlanForTopic } from './presets/demoLessonPlans';
import { AlertCircle, RotateCcw, PlayCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [pendingTopic, setPendingTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [generationError, setGenerationError] = useState<{ topic: string; message: string } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AiProviderChoice>('groq');
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('user_custom_ai_key') || '');

  const setLessonPlan = useTutorStore((state) => state.setLessonPlan);
  const resetStore = useTutorStore((state) => state.reset);
  const play = useTutorStore((state) => state.play);

  const handleTopicSubmit = async (
    topic: string,
    provider: AiProviderChoice = selectedProvider,
    apiKey: string = customApiKey
  ) => {
    setGenerationError(null);
    setPendingTopic(topic);
    setSelectedProvider(provider);
    if (apiKey) {
      setCustomApiKey(apiKey);
      localStorage.setItem('user_custom_ai_key', apiKey);
    }
    setIsLoading(true);

    try {
      const response = await requestLessonGeneration(topic, { provider, apiKey });
      setActiveTopic(topic);
      setLessonPlan(response.lessonPlan, response.source, response.modelUsed);
      play(); // Automatically start playback with narration & visual drawing
    } catch (err: any) {
      const errorMsg = err?.message || 'The AI service was not able to generate a response.';
      console.error(`[App] [AI GENERATION FAILED] AI unable to generate lesson response for topic "${topic}":`, {
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      setGenerationError({
        topic,
        message: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetTopic: string) => {
    setGenerationError(null);
    const preset = getLessonPlanForTopic(presetTopic);
    setActiveTopic(presetTopic);
    setLessonPlan(preset, 'preset');
    play();
  };

  const handleBackToLanding = () => {
    resetStore();
    setActiveTopic(null);
    setGenerationError(null);
    setPendingTopic('');
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center font-sans relative">
      {/* AI Generation State Overlay */}
      {isLoading && (
        <AIGenerationOverlay
          topic={pendingTopic}
          onCancel={() => setIsLoading(false)}
        />
      )}

      {/* Main Content */}
      {!activeTopic ? (
        <div className="w-full flex flex-col items-center justify-center p-4">
          {/* Generation Error Banner if any */}
          {generationError && (
            <div className="w-full max-w-xl mx-auto mb-6 p-4 rounded-xl bg-rose-950 border border-rose-800 shadow-xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-normal text-rose-200">
                    AI Whiteboard Generation Notice
                  </h2>
                  <p className="text-xs sm:text-sm text-rose-300 mt-1 font-normal">
                    {generationError.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-rose-900">
                <button
                  onClick={() => handleTopicSubmit(generationError.topic)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-normal flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry AI Generation</span>
                </button>
                <button
                  onClick={() => handleSelectPreset(generationError.topic)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-normal flex items-center gap-1.5 transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Load Preset Demo Instead</span>
                </button>
              </div>
            </div>
          )}

          <TopicInput
            onSubmit={handleTopicSubmit}
            onSelectPreset={handleSelectPreset}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <WhiteboardStudio topic={activeTopic} onBack={handleBackToLanding} />
      )}
    </div>
  );
};

export default App;