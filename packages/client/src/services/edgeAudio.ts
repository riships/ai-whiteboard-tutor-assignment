import { getNeuralAudioUrl } from './api';
import { useTutorStore } from '../store/useTutorStore';

class EdgeAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private isUnlocked: boolean = false;
  private currentSegmentId: string | null = null;
  private onEndCallback: (() => void) | null = null;
  private onBlockedCallback: ((blocked: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.audio.onplay = () => {
      useTutorStore.getState().setIsTutorSpeaking(true);
      if (this.onBlockedCallback) this.onBlockedCallback(false);
    };

    this.audio.onpause = () => {
      useTutorStore.getState().setIsTutorSpeaking(false);
    };

    this.audio.onended = () => {
      useTutorStore.getState().setIsTutorSpeaking(false);
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    this.audio.onerror = (e) => {
      console.warn('[EdgeAudioEngine] Audio error:', e);
      useTutorStore.getState().setIsTutorSpeaking(false);
    };
  }

  /**
   * Must be called during a user gesture (click / touch) to unlock
   * browser autoplay permissions for this HTML5 Audio element.
   */
  public unlock() {
    if (this.isUnlocked || typeof window === 'undefined') return;
    this.initAudio();
    if (this.audio) {
      // Play brief silent micro-action to satisfy browser autoplay policy
      const prevMuted = this.audio.muted;
      this.audio.muted = true;
      this.audio
        .play()
        .then(() => {
          if (this.audio) {
            this.audio.pause();
            this.audio.muted = prevMuted;
          }
          this.isUnlocked = true;
        })
        .catch(() => {
          if (this.audio) this.audio.muted = prevMuted;
        });
    }
  }

  public setOnBlocked(cb: ((blocked: boolean) => void) | null) {
    this.onBlockedCallback = cb;
  }

  public playSegment(
    segmentId: string,
    narrationText: string,
    options?: {
      voice?: string;
      speed?: number;
      muted?: boolean;
      startTime?: number;
      onEnded?: () => void;
    }
  ) {
    this.initAudio();
    if (!this.audio) return;

    this.currentSegmentId = segmentId;
    this.onEndCallback = options?.onEnded || null;

    const audioUrl = getNeuralAudioUrl(narrationText, options?.voice);

    this.audio.pause();
    this.audio.src = audioUrl;
    this.audio.playbackRate = options?.speed || 1.0;
    this.audio.muted = Boolean(options?.muted);

    if (options?.startTime && options.startTime > 0) {
      const targetTime = options.startTime;
      const onLoaded = () => {
        if (this.audio && Number.isFinite(this.audio.duration) && this.audio.duration > targetTime) {
          this.audio.currentTime = targetTime;
        }
      };
      this.audio.addEventListener('loadedmetadata', onLoaded, { once: true });
    }

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name === 'NotAllowedError') {
          console.warn('[EdgeAudioEngine] Browser autoplay blocked audio until user interaction:', err);
          if (this.onBlockedCallback) this.onBlockedCallback(true);
        } else if (err.name !== 'AbortError') {
          console.warn('[EdgeAudioEngine] Audio playback error:', err);
        }
      });
    }
  }

  public playDirect(
    text: string,
    options?: {
      voice?: string;
      speed?: number;
      onEnded?: () => void;
    }
  ) {
    this.initAudio();
    if (!this.audio) return;

    this.onEndCallback = options?.onEnded || null;
    const audioUrl = getNeuralAudioUrl(text, options?.voice);

    this.audio.pause();
    this.audio.src = audioUrl;
    this.audio.playbackRate = options?.speed || 1.0;
    this.audio.muted = useTutorStore.getState().isAudioMuted;

    this.audio.play().catch((err) => {
      console.warn('[EdgeAudioEngine] Direct speech error:', err);
      if (err.name === 'NotAllowedError' && this.onBlockedCallback) {
        this.onBlockedCallback(true);
      }
    });
  }

  public pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  public resume() {
    if (this.audio && this.audio.paused && this.audio.src) {
      this.audio.play().catch((err) => {
        console.warn('[EdgeAudioEngine] Resume error:', err);
      });
    }
  }

  public stop() {
    this.currentSegmentId = null;
    this.onEndCallback = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
    }
    useTutorStore.getState().setIsTutorSpeaking(false);
  }

  public setSpeed(speed: number) {
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
  }

  public setMuted(muted: boolean) {
    if (this.audio) {
      this.audio.muted = muted;
    }
  }

  public getCurrentSegmentId(): string | null {
    return this.currentSegmentId;
  }
}

export const edgeAudio = new EdgeAudioEngine();
