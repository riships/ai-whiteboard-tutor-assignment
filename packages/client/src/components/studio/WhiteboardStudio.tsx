import React, { useState, useMemo, useEffect } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { useTimelineClock } from '../../hooks/useTimelineClock';
import { useAudioNarrator } from '../../hooks/useAudioNarrator';
import { getCanvasStateAtTime } from '../../lib/getCanvasStateAtTime';
import { Whiteboard } from '../canvas/Whiteboard';
import { TimelineBar } from '../player/TimelineBar';
import { PlaybackControls } from '../player/PlaybackControls';
import { NarrationSubtitles } from '../player/NarrationSubtitles';
import { FollowUpChat } from '../chat/FollowUpChat';
import { CanvasElement } from '../../types/canvas.types';
import {
  Sparkles,
  ArrowLeft,
  Info,
  CheckCircle2,
  Clock,
  BookOpen,
  ListOrdered,
  MessageSquare,
  Volume2,
} from 'lucide-react';

interface WhiteboardStudioProps {
  topic: string;
  onBack: () => void;
}

export const WhiteboardStudio: React.FC<WhiteboardStudioProps> = ({ topic, onBack }) => {
  // Activate rAF continuous clock and Microsoft Edge Neural Audio narration engine
  useTimelineClock();
  const { isAutoplayBlocked, unlockAndPlay } = useAudioNarrator();

  const lessonPlan = useTutorStore((state) => state.lessonPlan);
  const lessonSource = useTutorStore((state) => state.lessonSource);
  const modelUsed = useTutorStore((state) => state.modelUsed);
  const currentTime = useTutorStore((state) => state.currentTime);
  const playbackStatus = useTutorStore((state) => state.playbackStatus);
  const isAudioMuted = useTutorStore((state) => state.isAudioMuted);
  const isTutorSpeaking = useTutorStore((state) => state.isTutorSpeaking);
  const activeQaSpeakingId = useTutorStore((state) => state.activeQaSpeakingId);
  const activeQaNarration = useTutorStore((state) => state.activeQaNarration);
  const seek = useTutorStore((state) => state.seek);
  const qaAnnotations = useTutorStore((state) => state.qaAnnotations);
  const qaHighlightIds = useTutorStore((state) => state.qaHighlightIds);
  const chatHistory = useTutorStore((state) => state.chatHistory);

  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'qa'>('curriculum');

  // Automatically open Q&A tab when lesson finishes
  useEffect(() => {
    if (playbackStatus === 'finished') {
      setActiveTab('qa');
    }
  }, [playbackStatus]);

  // Compute live visual canvas state as a pure function of currentTime
  const computedState = useMemo(() => {
    if (!lessonPlan) {
      return {
        elements: [],
        pointer: { x: 500, y: 300, visible: false },
        activeNarration: '',
        activeSegmentIndex: 0,
        activeChapterTitle: '',
      };
    }
    return getCanvasStateAtTime(lessonPlan.segments, currentTime);
  }, [lessonPlan, currentTime]);

  // Merge dynamic Q&A annotations and spotlights with cumulative timeline elements
  const activeElements = useMemo(() => {
    const merged = [...computedState.elements, ...qaAnnotations];
    if (qaHighlightIds.length === 0) return merged;

    return merged.map((el) => {
      if (qaHighlightIds.includes(el.id)) {
        return { ...el, isHighlighted: true };
      }
      return el;
    });
  }, [computedState.elements, qaAnnotations, qaHighlightIds]);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Studio Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Topic</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs sm:text-sm font-normal text-white truncate max-w-md">
              {lessonPlan?.title || topic}
            </h2>
          </div>
        </div>

        {/* Status Badge & Duration */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{lessonPlan?.totalDuration || 120}s Lesson</span>
          </div>

          {lessonSource === 'live' ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live AI ({modelUsed || 'Llama 3.3 / Gemini'})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Interactive Preset Demo</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row p-3 sm:p-4 gap-3 sm:gap-4 overflow-hidden">
        {/* Left Column: Whiteboard + Subtitles + Playback Controls */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 h-full overflow-hidden">
          {/* Top: Interactive Whiteboard Canvas */}
          <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden relative">
            {isAutoplayBlocked && (
              <button
                onClick={unlockAndPlay}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white shadow-xl animate-bounce hover:bg-blue-500 text-xs font-normal"
              >
                <Volume2 className="w-4 h-4" />
                <span>Click to Enable Tutor Voice Narration</span>
              </button>
            )}
            <Whiteboard
              elements={activeElements}
              pointer={computedState.pointer}
              onElementClick={(el) => setSelectedElement(el)}
            />
          </div>

          {/* Middle: Live Synchronized Subtitles (Supports Timeline Lesson & Interactive Q&A Speech) */}
          <NarrationSubtitles
            narration={Boolean(activeQaSpeakingId && activeQaNarration) ? activeQaNarration! : computedState.activeNarration}
            chapterTitle={Boolean(activeQaSpeakingId && activeQaNarration) ? 'Tutor Voice Explanation (Q&A)' : computedState.activeChapterTitle}
            isPlaying={Boolean(activeQaSpeakingId && activeQaNarration) || (playbackStatus === 'playing' && isTutorSpeaking)}
            isMuted={isAudioMuted}
            isQaMode={Boolean(activeQaSpeakingId && activeQaNarration)}
          />

          {/* Bottom: Master Timeline Bar & Playback Controller */}
          <div className="flex flex-col gap-2 shrink-0">
            <TimelineBar />
            <PlaybackControls />
          </div>
        </div>

        {/* Right Column: Tabbed Sidebar (Curriculum & Socratic Q&A) */}
        <div className="w-full lg:w-80 xl:w-96 bg-slate-900 border border-slate-800 rounded-xl flex flex-col shrink-0 shadow-xl overflow-hidden">
          {/* Tab Selection Header */}
          <div className="flex items-center border-b border-slate-800 p-1 bg-slate-950">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-normal transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
              <span>Curriculum</span>
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-normal transition-all relative ${
                activeTab === 'qa'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Socratic Q&A</span>
              {chatHistory.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-normal">
                  {chatHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'curriculum' ? (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <h3 className="text-xs font-normal text-white">Lesson Structure</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Segment {computedState.activeSegmentIndex + 1} of{' '}
                    {lessonPlan?.segments.length || 5}
                  </span>
                </div>

                {/* Current Concept Summary */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-normal">
                  <div className="flex items-start gap-1.5 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="font-normal text-white">
                      {computedState.activeChapterTitle || 'Overview'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs font-normal">
                    {lessonPlan?.summary || 'Interactive whiteboard teaching session.'}
                  </p>
                </div>

                {/* Clickable Chapter Outline (Jump to any timestamp) */}
                <div>
                  <div className="text-xs font-normal text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                    <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
                    <span>Timeline Chapters</span>
                  </div>
                  <div className="space-y-1.5">
                    {lessonPlan?.segments.map((seg, i) => {
                      const isActive = i === computedState.activeSegmentIndex;
                      return (
                        <button
                          key={seg.id}
                          onClick={() => seek(seg.startTime)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-blue-950 border border-blue-800 text-blue-200 font-normal'
                              : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono shrink-0 ${
                                isActive
                                  ? 'bg-blue-500 text-white font-normal'
                                  : 'bg-slate-800 text-slate-400 font-normal'
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className="truncate">{seg.title}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-400 shrink-0 ml-2">
                            {Math.floor(seg.startTime / 60)}:
                            {String(Math.floor(seg.startTime % 60)).padStart(2, '0')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Element Inspector */}
                {selectedElement && (
                  <div className="bg-blue-950 border border-blue-800 rounded-xl p-3 text-xs font-normal">
                    <div className="flex items-center gap-1.5 text-blue-400 font-normal mb-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Inspected Element: #{selectedElement.id}</span>
                    </div>
                    <div className="text-slate-300 font-mono">
                      Type: <span className="text-amber-300">{selectedElement.type}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <FollowUpChat
                currentElements={activeElements}
                currentSegmentTitle={computedState.activeChapterTitle}
                currentSegmentIndex={computedState.activeSegmentIndex}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
