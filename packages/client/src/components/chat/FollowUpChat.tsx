import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import { askFollowUpQuestion } from '../../services/api';
import { MathText } from './MathText';
import { CanvasElement } from '../../types/canvas.types';
import { edgeAudio } from '../../services/edgeAudio';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Volume2,
  Square,
} from 'lucide-react';

interface FollowUpChatProps {
  currentElements: CanvasElement[];
  currentSegmentTitle: string;
  currentSegmentIndex: number;
}

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  currentElements,
  currentSegmentTitle,
  currentSegmentIndex,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lessonPlan = useTutorStore((state) => state.lessonPlan);
  const chatHistory = useTutorStore((state) => state.chatHistory);
  const qaAnnotations = useTutorStore((state) => state.qaAnnotations);
  const qaHighlightIds = useTutorStore((state) => state.qaHighlightIds);
  const isAudioMuted = useTutorStore((state) => state.isAudioMuted);
  const playbackSpeed = useTutorStore((state) => state.playbackSpeed);
  const selectedVoice = useTutorStore((state) => state.selectedVoice);
  const activeQaSpeakingId = useTutorStore((state) => state.activeQaSpeakingId);

  const addChatMessage = useTutorStore((state) => state.addChatMessage);
  const setQaAnnotations = useTutorStore((state) => state.setQaAnnotations);
  const setQaHighlights = useTutorStore((state) => state.setQaHighlights);
  const clearAnnotations = useTutorStore((state) => state.clearAnnotations);
  const setActiveQaSpeaking = useTutorStore((state) => state.setActiveQaSpeaking);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSubmitting]);

  // Voice narration synthesizer for Q&A explanations (Exclusively Microsoft Edge Neural Voice)
  const speakAnswer = useCallback((messageId: string, answerText: string) => {
    // If currently speaking this message, toggle off
    if (activeQaSpeakingId === messageId) {
      edgeAudio.stop();
      setActiveQaSpeaking(null);
      return;
    }

    // Cancel prior speech
    edgeAudio.stop();

    setActiveQaSpeaking(messageId, answerText);
    edgeAudio.playDirect(answerText, {
      voice: selectedVoice,
      speed: playbackSpeed,
      onEnded: () => {
        setActiveQaSpeaking(null);
      },
    });
  }, [activeQaSpeakingId, playbackSpeed, selectedVoice, setActiveQaSpeaking]);

  // Immediately switch voice if tutor is actively speaking a Q&A answer
  const lastQaVoiceRef = useRef<string>(selectedVoice);
  useEffect(() => {
    if (lastQaVoiceRef.current !== selectedVoice) {
      lastQaVoiceRef.current = selectedVoice;
      const state = useTutorStore.getState();
      if (state.activeQaSpeakingId && state.activeQaNarration) {
        edgeAudio.playDirect(state.activeQaNarration, {
          voice: selectedVoice,
          speed: playbackSpeed,
          onEnded: () => setActiveQaSpeaking(null),
        });
      }
    }
  }, [selectedVoice, playbackSpeed, setActiveQaSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      edgeAudio.stop();
      setActiveQaSpeaking(null);
    };
  }, [setActiveQaSpeaking]);

  const handleSendMessage = async (textToSend?: string) => {
    const questionText = (textToSend || inputValue).trim();
    if (!questionText || isSubmitting || !lessonPlan) return;

    // Append user question to chat
    const userMsgId = `user-${Date.now()}`;
    addChatMessage({
      id: userMsgId,
      sender: 'user',
      text: questionText,
      timestamp: Date.now(),
    });

    setInputValue('');
    setIsSubmitting(true);

    try {
      // Gather element summary for the AI context
      const elementSummaries = currentElements.map((el) => ({
        id: el.id,
        type: el.type,
        label: 'label' in el ? (el.label as string) : 'text' in el ? (el.text as string) : undefined,
      }));

      const customKey = localStorage.getItem('user_custom_ai_key') || undefined;
      const response = await askFollowUpQuestion({
        question: questionText,
        lessonTopic: lessonPlan.topic,
        lessonSummary: lessonPlan.summary,
        currentSegmentTitle,
        currentSegmentIndex,
        currentElements: elementSummaries,
        chatHistory: chatHistory.slice(-6),
        provider: 'groq',
        apiKey: customKey,
      });

      // Update Q&A canvas annotations and highlights
      if (response.highlightIds && response.highlightIds.length > 0) {
        setQaHighlights(response.highlightIds);
      }

      if (response.newActions && response.newActions.length > 0) {
        // Filter out non-canvas elements if any, keeping visual elements
        const validCanvasElements = response.newActions.filter(
          (a) => a.type === 'node' || a.type === 'box' || a.type === 'arrow' || a.type === 'text' || a.type === 'math'
        ) as CanvasElement[];

        if (validCanvasElements.length > 0) {
          setQaAnnotations([...qaAnnotations, ...validCanvasElements]);
        }
      }

      // Add tutor answer to chat
      const tutorMsgId = `tutor-${Date.now()}`;
      addChatMessage({
        id: tutorMsgId,
        sender: 'tutor',
        text: response.answer,
        timestamp: Date.now(),
        highlightIds: response.highlightIds,
      });

      // Automatically speak explanation out loud unless audio is muted
      if (!isAudioMuted) {
        speakAnswer(tutorMsgId, response.answer);
      }
    } catch (err) {
      console.error('Failed to submit question:', err);
      addChatMessage({
        id: `tutor-err-${Date.now()}`,
        sender: 'tutor',
        text: 'I encountered an issue processing your question. Please try asking again!',
        timestamp: Date.now(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Suggestion chips tailored to topic
  const suggestionChips = [
    'What happens if we insert 5 into this BST?',
    'Can you explain this step in more detail?',
    'What are common edge cases?',
    'Give me a quick question to test my understanding',
  ];

  const hasAnnotations = qaAnnotations.length > 0 || qaHighlightIds.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Annotations active banner */}
      {hasAnnotations && (
        <div className="flex items-center justify-between px-4 py-2 bg-purple-950 border-b border-purple-800 text-xs text-purple-300">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Interactive Q&A annotations active on canvas</span>
          </div>
          <button
            onClick={clearAnnotations}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-white transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Annotations</span>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 px-2">
            <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xs sm:text-sm font-normal text-white mb-1">
              Ask Your Socratic Whiteboard Tutor
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-5 font-normal">
              Ask any follow-up question. The tutor explains out loud with voice narration, spotlights diagrams, and demonstrates steps directly on the whiteboard.
            </p>

            <div className="w-full space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-xs font-normal text-slate-400 uppercase tracking-wider mb-2 font-mono">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Suggested Questions</span>
              </div>
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isSubmitting}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-600 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group font-normal"
                >
                  <span>{chip}</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeakingThis = activeQaSpeakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <MathText text={msg.text} />

                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                      {/* Spoken voice narration toggle button */}
                      <button
                        onClick={() => speakAnswer(msg.id, msg.text)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-normal transition-colors ${
                          isSpeakingThis
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50'
                        }`}
                        title={isSpeakingThis ? 'Pause Voice Explanation' : 'Listen to Spoken Voice Explanation'}
                      >
                        {isSpeakingThis ? (
                          <>
                            <div className="flex items-center gap-0.5 h-3 w-3">
                              <span className="w-0.5 h-2.5 bg-blue-400 rounded-full animate-[pulse_0.5s_infinite]" />
                              <span className="w-0.5 h-3.5 bg-sky-300 rounded-full animate-[pulse_0.3s_infinite]" />
                              <span className="w-0.5 h-2 bg-blue-400 rounded-full animate-[pulse_0.7s_infinite]" />
                            </div>
                            <span>Speaking Explanation...</span>
                            <Square className="w-2.5 h-2.5 ml-1 fill-current" />
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Listen to Explanation</span>
                          </>
                        )}
                      </button>

                      {/* Whiteboard spotlight confirmation badge */}
                      {msg.highlightIds && msg.highlightIds.length > 0 && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-normal">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Spotlighted {msg.highlightIds.length} element(s)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isSubmitting && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
        <div className="relative flex items-center rounded-xl bg-slate-800 border border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            placeholder="Ask a follow-up question..."
            className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none font-normal"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isSubmitting}
            className="m-1 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
