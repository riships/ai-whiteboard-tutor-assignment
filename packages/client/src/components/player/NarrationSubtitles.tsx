import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface NarrationSubtitlesProps {
  narration: string;
  chapterTitle?: string;
  isPlaying?: boolean;
  isMuted?: boolean;
  isQaMode?: boolean;
}

export const NarrationSubtitles: React.FC<NarrationSubtitlesProps> = ({
  narration,
  chapterTitle,
  isPlaying = false,
  isMuted = false,
  isQaMode = false,
}) => {
  if (!narration) return null;

  return (
    <div
      className={`w-full rounded-2xl p-3.5 shadow-xl flex items-start gap-3 backdrop-blur-md transition-all ${
        isQaMode
          ? 'bg-purple-950/90 border border-purple-800 text-purple-100'
          : 'bg-slate-900/95 border border-slate-800 text-slate-200'
      }`}
    >
      {/* Voice animation or mute indicator */}
      <div
        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
          isQaMode
            ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
            : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
        }`}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-slate-500" />
        ) : isPlaying ? (
          <div className="flex items-center gap-0.5 h-4 w-4 justify-center">
            <span
              className={`w-0.5 h-3 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] ${
                isQaMode ? 'bg-purple-400' : 'bg-blue-400'
              }`}
            />
            <span
              className={`w-0.5 h-4 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] ${
                isQaMode ? 'bg-pink-300' : 'bg-sky-300'
              }`}
            />
            <span
              className={`w-0.5 h-2 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] ${
                isQaMode ? 'bg-purple-400' : 'bg-blue-400'
              }`}
            />
          </div>
        ) : (
          <Volume2 className={`w-4 h-4 ${isQaMode ? 'text-purple-400' : 'text-blue-400'}`} />
        )}
      </div>

      {/* Narration text */}
      <div className="flex-1 min-w-0">
        {chapterTitle && (
          <div
            className={`text-xs font-normal uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono ${
              isQaMode ? 'text-purple-300' : 'text-blue-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{chapterTitle}</span>
          </div>
        )}
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
          "{narration}"
        </p>
      </div>
    </div>
  );
};
