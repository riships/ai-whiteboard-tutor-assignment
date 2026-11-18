import { useEffect, useRef, useState, useCallback } from 'react';
import { useTutorStore } from '../store/useTutorStore';
import { edgeAudio } from '../services/edgeAudio';

/**
 * Spoken voice narration synthesizer powered EXCLUSIVELY by
 * Microsoft Edge Neural Text-to-Speech (Christopher & Jenny studio voices).
 * Synchronizes speech playback with the active timeline segment.
 */
export function useAudioNarrator() {
  const lessonPlan = useTutorStore((state) => state.lessonPlan);
  const playbackStatus = useTutorStore((state) => state.playbackStatus);
  const currentTime = useTutorStore((state) => state.currentTime);
  const playbackSpeed = useTutorStore((state) => state.playbackSpeed);
  const isAudioMuted = useTutorStore((state) => state.isAudioMuted);
  const selectedVoice = useTutorStore((state) => state.selectedVoice);
  const seek = useTutorStore((state) => state.seek);

  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);
  const currentSegmentIdRef = useRef<string | null>(null);
  const lastPlayedVoiceRef = useRef<string>(selectedVoice);
  const advanceTimerRef = useRef<number | null>(null);

  // Register autoplay block handler
  useEffect(() => {
    edgeAudio.setOnBlocked((blocked) => {
      setIsAutoplayBlocked(blocked);
    });

    return () => {
      edgeAudio.setOnBlocked(null);
    };
  }, []);

  // Stop all speech immediately
  const stopSpeech = useCallback(() => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    edgeAudio.stop();
    currentSegmentIdRef.current = null;
  }, []);

  // Find active segment based on current timeline time
  const activeSegment = lessonPlan?.segments.find(
    (seg, index) =>
      currentTime >= seg.startTime &&
      (currentTime < seg.endTime || index === lessonPlan.segments.length - 1)
  );

  // Handle Playback Status Changes (Pause, Stop, Finished, Resume)
  useEffect(() => {
    if (playbackStatus === 'paused') {
      edgeAudio.pause();
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    } else if (playbackStatus === 'ready' || playbackStatus === 'idle' || playbackStatus === 'finished') {
      stopSpeech();
    } else if (playbackStatus === 'playing') {
      edgeAudio.resume();
    }
  }, [playbackStatus, stopSpeech]);

  // Handle Playback Speed updates
  useEffect(() => {
    edgeAudio.setSpeed(playbackSpeed);
  }, [playbackSpeed]);

  // Handle Mute Toggle
  useEffect(() => {
    edgeAudio.setMuted(isAudioMuted);
    if (isAudioMuted) {
      edgeAudio.pause();
    } else if (playbackStatus === 'playing' && activeSegment) {
      currentSegmentIdRef.current = null;
    }
  }, [isAudioMuted, playbackStatus, activeSegment]);

  // Handle Segment Transition & Immediate Voice Changes
  useEffect(() => {
    if (playbackStatus !== 'playing' || isAudioMuted || !activeSegment) {
      return;
    }

    const isNewSegment = currentSegmentIdRef.current !== activeSegment.id;
    const isNewVoice = lastPlayedVoiceRef.current !== selectedVoice;

    // Trigger immediately when entering a new segment OR when voice is changed
    if (isNewSegment || isNewVoice) {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }

      currentSegmentIdRef.current = activeSegment.id;
      lastPlayedVoiceRef.current = selectedVoice;
      const segId = activeSegment.id;
      const targetEndTime = activeSegment.endTime;

      // When voice is changed mid-segment, continue from current elapsed second
      const stateTime = useTutorStore.getState().currentTime;
      const segmentElapsed = isNewVoice ? Math.max(0, stateTime - activeSegment.startTime) : 0;

      edgeAudio.playSegment(segId, activeSegment.narration, {
        voice: selectedVoice,
        speed: playbackSpeed,
        muted: isAudioMuted,
        startTime: segmentElapsed,
        onEnded: () => {
          // Advance smoothly to next segment after a short natural pause
          advanceTimerRef.current = window.setTimeout(() => {
            const state = useTutorStore.getState();
            if (
              state.playbackStatus === 'playing' &&
              currentSegmentIdRef.current === segId &&
              state.currentTime < targetEndTime - 0.2
            ) {
              seek(targetEndTime);
            }
          }, 850);
        },
      });
    }
  }, [activeSegment, playbackStatus, playbackSpeed, isAudioMuted, selectedVoice, seek]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  return {
    isAutoplayBlocked,
    unlockAndPlay: () => {
      edgeAudio.unlock();
      edgeAudio.resume();
      setIsAutoplayBlocked(false);
    },
  };
}
