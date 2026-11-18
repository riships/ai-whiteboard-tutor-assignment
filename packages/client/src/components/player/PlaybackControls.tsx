import React, { useEffect } from 'react';
import { useTutorStore } from '../../store/useTutorStore';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
} from 'lucide-react';

interface PlaybackControlsProps {
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ className = '' }) => {
  const lessonPlan = useTutorStore((state) => state.lessonPlan);
  const playbackStatus = useTutorStore((state) => state.playbackStatus);
  const currentTime = useTutorStore((state) => state.currentTime);
  const playbackSpeed = useTutorStore((state) => state.playbackSpeed);
  const isAudioMuted = useTutorStore((state) => state.isAudioMuted);
  const selectedVoice = useTutorStore((state) => state.selectedVoice);

  const play = useTutorStore((state) => state.play);
  const pause = useTutorStore((state) => state.pause);
  const seek = useTutorStore((state) => state.seek);
  const restart = useTutorStore((state) => state.restart);
  const setSpeed = useTutorStore((state) => state.setSpeed);
  const setSelectedVoice = useTutorStore((state) => state.setSelectedVoice);
  const toggleMute = useTutorStore((state) => state.toggleMute);

  const isPlaying = playbackStatus === 'playing';
  const isFinished = playbackStatus === 'finished';
  const totalDuration = lessonPlan?.totalDuration || 120;

  // Spacebar keyboard shortcut for Play/Pause toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(currentTime - 10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(currentTime + 10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, play, pause, seek]);

  const handleSkipBack = () => seek(currentTime - 10);
  const handleSkipForward = () => seek(currentTime + 10);

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    setSpeed(SPEED_OPTIONS[nextIndex]);
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl ${className}`}
    >
      {/* Left: Time counter & chapter */}
      <div className="flex items-center gap-3 min-w-[130px]">
        <div className="font-mono text-xs text-slate-300 font-normal tracking-wider">
          <span className="text-white">{formatTime(currentTime)}</span>
          <span className="text-slate-600 mx-1">/</span>
          <span className="text-slate-500">{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Center: Main Playback Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Restart Button */}
        <button
          onClick={restart}
          title="Restart from Beginning"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Skip Back 10s */}
        <button
          onClick={handleSkipBack}
          title="Rewind 10 Seconds (Left Arrow)"
          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs font-mono font-normal active:scale-95 flex items-center gap-0.5"
        >
          <span>-10s</span>
        </button>

        {/* Primary Play / Pause / Replay Button */}
        <button
          onClick={isPlaying ? pause : play}
          title={isPlaying ? 'Pause (Spacebar)' : isFinished ? 'Replay' : 'Play (Spacebar)'}
          className="p-2.5 sm:px-3.5 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/30 font-medium flex items-center gap-2 transition-all active:scale-95"
        >
          {isFinished ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-normal uppercase tracking-wider">
                Replay
              </span>
            </>
          ) : isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline text-xs font-normal uppercase tracking-wider">
                Pause
              </span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span className="hidden sm:inline text-xs font-normal uppercase tracking-wider">
                Play
              </span>
            </>
          )}
        </button>

        {/* Skip Forward 10s */}
        <button
          onClick={handleSkipForward}
          title="Skip Forward 10 Seconds (Right Arrow)"
          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs font-mono font-normal active:scale-95 flex items-center gap-0.5"
        >
          <span>+10s</span>
        </button>
      </div>

      {/* Right: Audio Mute, Neural Voice & Speed Control */}
      <div className="flex items-center gap-2 min-w-[130px] justify-end">
        {/* Human Neural Voice Selector - Switches immediately */}
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          title="Select Studio Neural Voice (Switches Immediately)"
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer font-normal hidden sm:block"
        >
          <option value="en-US-ChristopherNeural">🎙️ Christopher (Fixed Default)</option>
          <option value="en-US-JennyNeural">🎙️ Jenny (Natural Studio)</option>
          <option value="en-US-GuyNeural">🎙️ Guy (Expressive)</option>
          <option value="en-US-AriaNeural">🎙️ Aria (Clear)</option>
        </select>

        {/* Speed button */}
        <button
          onClick={cycleSpeed}
          title="Change Playback Speed"
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-medium text-slate-300 flex items-center gap-1 transition-colors"
        >
          <Gauge className="w-3.5 h-3.5 text-blue-400" />
          <span>{playbackSpeed}x</span>
        </button>

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          title={isAudioMuted ? 'Unmute Voice Narration' : 'Mute Voice Narration'}
          className={`p-2 rounded-xl transition-colors ${
            isAudioMuted
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
