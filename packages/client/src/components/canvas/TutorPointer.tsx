import React from 'react';
import { TutorPointerState } from '../../types/canvas.types';

interface TutorPointerProps {
  pointer: TutorPointerState;
}

export const TutorPointer: React.FC<TutorPointerProps> = ({ pointer }) => {
  if (!pointer.visible) return null;

  return (
    <g
      transform={`translate(${pointer.x}, ${pointer.y})`}
      className="transition-transform duration-500 ease-out pointer-events-none"
    >
      {/* Laser glow halo */}
      <circle
        r={14}
        fill="rgba(244, 63, 94, 0.25)"
        className="animate-ping"
      />
      
      {/* Central pointer dot */}
      <circle
        r={6}
        fill="#f43f5e"
        stroke="#ffffff"
        strokeWidth={2}
        className="drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]"
      />

      {/* Stylized laser line / wand */}
      <line
        x1={-18}
        y1={18}
        x2={-4}
        y2={4}
        stroke="#f43f5e"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Tutor label if provided */}
      {pointer.label && (
        <g transform="translate(14, -14)">
          <rect
            x={0}
            y={0}
            width={pointer.label.length * 8 + 14}
            height={22}
            rx={6}
            fill="#0f172a"
            stroke="#f43f5e"
            strokeWidth={1.5}
            className="drop-shadow-md"
          />
          <text
            x={7}
            y={15}
            fill="#fda4af"
            fontSize={11}
            fontWeight="bold"
            className="font-sans"
          >
            {pointer.label}
          </text>
        </g>
      )}
    </g>
  );
};
