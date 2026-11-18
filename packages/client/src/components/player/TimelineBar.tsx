import React, { useState, useRef } from 'react';
import { useTutorStore } from '../../store/useTutorStore';

interface TimelineBarProps {
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({ className = '' }) => {
  const lessonPlan = useTutorStore((state) => state.lessonPlan);
  const currentTime = useTutorStore((state) => state.currentTime);
  const seek = useTutorStore((state) => state.seek);

  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverTitle, setHoverTitle] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const totalDuration = lessonPlan?.totalDuration || 120;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    const targetSeconds = ratio * totalDuration;

    setHoverPosition(clickX);
    setHoverTime(targetSeconds);

    if (lessonPlan?.segments) {
      const match = lessonPlan.segments.find(
        (seg, i) =>
          targetSeconds >= seg.startTime &&
          (targetSeconds < seg.endTime || i === lessonPlan.segments.length - 1)
      );
      setHoverTitle(match ? match.title : null);
    }
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
    setHoverTime(null);
    setHoverTitle(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetSeconds = (clickX / rect.width) * totalDuration;
    seek(targetSeconds);
  };

  return (
    <div className={`relative w-full flex flex-col gap-1 select-none ${className}`}>
      {/* Hover Chapter Tooltip */}
      {hoverPosition !== null && hoverTime !== null && (
        <div
          className="absolute -top-10 z-30 pointer-events-none transform -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${hoverPosition}px` }}
        >
          <div className="bg-slate-900 border border-slate-700 text-xs px-2.5 py-1 rounded-md shadow-xl text-slate-100 font-mono whitespace-nowrap flex items-center gap-1.5">
            <span>{formatTime(hoverTime)}</span>
            {hoverTitle && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-blue-400 font-sans font-medium">{hoverTitle}</span>
              </>
            )}
          </div>
          <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 transform rotate-45 -mt-1" />
        </div>
      )}

      {/* Interactive Bar Track */}
      <div
        ref={barRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative w-full h-3.5 bg-slate-800/80 hover:bg-slate-800 rounded-full cursor-pointer flex items-center transition-all overflow-visible"
      >
        {/* Background track */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Filled progress bar */}
          <div
            className="h-full bg-blue-500 transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Chapter tick markers */}
        {lessonPlan?.segments.map((seg, i) => {
          if (i === 0) return null;
          const leftPercent = (seg.startTime / totalDuration) * 100;
          return (
            <div
              key={seg.id}
              className="absolute top-0 bottom-0 w-[2px] bg-slate-950/80 z-10 pointer-events-none"
              style={{ left: `${leftPercent}%` }}
              title={seg.title}
            />
          );
        })}

        {/* Scrubber thumb handle */}
        <div
          className="absolute z-20 w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-md transform -translate-x-1/2 scale-75 group-hover:scale-100 transition-transform"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
