import { useEffect, useRef } from 'react';
import { useTutorStore } from '../store/useTutorStore';

/**
 * High-precision timeline clock driven by requestAnimationFrame.
 * Advances the store's currentTime while playbackStatus === 'playing'.
 */
export function useTimelineClock() {
  const playbackStatus = useTutorStore((state) => state.playbackStatus);
  const playbackSpeed = useTutorStore((state) => state.playbackSpeed);
  const tick = useTutorStore((state) => state.tick);

  const lastFrameTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (playbackStatus !== 'playing') {
      lastFrameTimeRef.current = null;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    const frameLoop = (timestamp: number) => {
      if (lastFrameTimeRef.current !== null) {
        const rawDeltaSeconds = (timestamp - lastFrameTimeRef.current) / 1000;
        // Clamp to prevent huge jumps if browser tab was inactive
        const clampedDelta = Math.min(rawDeltaSeconds, 0.1);
        const effectiveDelta = clampedDelta * playbackSpeed;
        tick(effectiveDelta);
      }

      lastFrameTimeRef.current = timestamp;
      animFrameIdRef.current = requestAnimationFrame(frameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(frameLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [playbackStatus, playbackSpeed, tick]);
}
