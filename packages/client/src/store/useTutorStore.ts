import { create } from 'zustand';
import { LessonPlan, PlaybackStatus, ChatMessage, CanvasElement } from '../types/canvas.types';
import { edgeAudio } from '../services/edgeAudio';

interface TutorState {
  // Lesson metadata & source
  lessonPlan: LessonPlan | null;
  lessonSource: 'live' | 'preset' | null;
  modelUsed: string | null;

  // Playback state machine
  playbackStatus: PlaybackStatus;
  currentTime: number;
  playbackSpeed: number;
  isAudioMuted: boolean;
  isTutorSpeaking: boolean;
  selectedVoice: string;

  // Chat & Q&A history
  chatHistory: ChatMessage[];
  qaAnnotations: CanvasElement[];
  qaHighlightIds: string[];
  activeQaSpeakingId: string | null;
  activeQaNarration: string | null;

  // Actions
  setLessonPlan: (plan: LessonPlan, source: 'live' | 'preset', modelUsed?: string) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
  setSelectedVoice: (voice: string) => void;
  toggleMute: () => void;
  setIsTutorSpeaking: (speaking: boolean) => void;
  setActiveQaSpeaking: (msgId: string | null, text?: string | null) => void;
  tick: (deltaTime: number) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setQaAnnotations: (elements: CanvasElement[]) => void;
  setQaHighlights: (ids: string[]) => void;
  clearAnnotations: () => void;
  reset: () => void;
}

export const useTutorStore = create<TutorState>((set, get) => ({
  lessonPlan: null,
  lessonSource: null,
  modelUsed: null,

  playbackStatus: 'idle',
  currentTime: 0,
  playbackSpeed: 1.0,
  isAudioMuted: false,
  isTutorSpeaking: false,
  selectedVoice:
    (typeof window !== 'undefined' && localStorage.getItem('user_fixed_voice')) ||
    'en-US-ChristopherNeural',

  chatHistory: [],
  qaAnnotations: [],
  qaHighlightIds: [],
  activeQaSpeakingId: null,
  activeQaNarration: null,

  setLessonPlan: (plan: LessonPlan, source: 'live' | 'preset', modelUsed?: string) => {
    set({
      lessonPlan: plan,
      lessonSource: source,
      modelUsed: modelUsed || null,
      currentTime: 0,
      playbackStatus: 'ready',
      isTutorSpeaking: false,
      qaAnnotations: [],
      qaHighlightIds: [],
      chatHistory: [],
    });
  },

  play: () => {
    const { playbackStatus, currentTime, lessonPlan } = get();
    if (!lessonPlan) return;

    edgeAudio.unlock();

    if (playbackStatus === 'finished' || (lessonPlan && currentTime >= lessonPlan.totalDuration)) {
      set({ currentTime: 0, playbackStatus: 'playing' });
    } else {
      set({ playbackStatus: 'playing' });
    }
  },

  pause: () => {
    set({ playbackStatus: 'paused' });
  },

  seek: (time: number) => {
    const { lessonPlan } = get();
    const duration = lessonPlan ? lessonPlan.totalDuration : 120;
    const clamped = Math.max(0, Math.min(time, duration));

    set((state) => ({
      currentTime: clamped,
      playbackStatus:
        clamped >= duration
          ? 'finished'
          : state.playbackStatus === 'finished'
          ? 'paused'
          : state.playbackStatus,
    }));
  },

  restart: () => {
    edgeAudio.unlock();
    set({
      currentTime: 0,
      playbackStatus: 'playing',
    });
  },

  setSpeed: (speed: number) => {
    set({ playbackSpeed: speed });
  },

  setSelectedVoice: (voice: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_fixed_voice', voice);
    }
    set({ selectedVoice: voice });
  },

  toggleMute: () => {
    set((state) => ({ isAudioMuted: !state.isAudioMuted }));
  },

  setIsTutorSpeaking: (speaking: boolean) => {
    set({ isTutorSpeaking: speaking });
  },

  setActiveQaSpeaking: (msgId: string | null, text?: string | null) => {
    set({
      activeQaSpeakingId: msgId,
      activeQaNarration: text || null,
      isTutorSpeaking: Boolean(msgId),
    });
  },

  tick: (deltaTime: number) => {
    const { currentTime, lessonPlan, playbackStatus, isTutorSpeaking } = get();
    if (playbackStatus !== 'playing' || !lessonPlan) return;

    // If tutor is actively speaking near the boundary of the current segment,
    // hold briefly to ensure speech never gets cut off mid-word
    const activeSegment = lessonPlan.segments.find(
      (seg) => currentTime >= seg.startTime && currentTime < seg.endTime
    );
    if (activeSegment && isTutorSpeaking && currentTime + deltaTime >= activeSegment.endTime - 0.2) {
      set({ currentTime: activeSegment.endTime - 0.2 });
      return;
    }

    const nextTime = currentTime + deltaTime;

    if (nextTime >= lessonPlan.totalDuration) {
      set({
        currentTime: lessonPlan.totalDuration,
        playbackStatus: 'finished',
        isTutorSpeaking: false,
      });
    } else {
      set({ currentTime: nextTime });
    }
  },

  addChatMessage: (msg: ChatMessage) => {
    set((state) => ({ chatHistory: [...state.chatHistory, msg] }));
  },

  setQaAnnotations: (elements: CanvasElement[]) => {
    set({ qaAnnotations: elements });
  },

  setQaHighlights: (ids: string[]) => {
    set({ qaHighlightIds: ids });
  },

  clearAnnotations: () => {
    set({ qaAnnotations: [], qaHighlightIds: [] });
  },

  reset: () => {
    set({
      lessonPlan: null,
      lessonSource: null,
      modelUsed: null,
      playbackStatus: 'idle',
      currentTime: 0,
      chatHistory: [],
      qaAnnotations: [],
      qaHighlightIds: [],
    });
  },
}));
