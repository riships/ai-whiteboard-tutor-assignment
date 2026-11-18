import React, { useMemo } from 'react';
import katex from 'katex';
import { MathElement } from '../../types/canvas.types';

interface MathRendererProps {
  element: MathElement;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ element }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(element.latex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      return `<span>${element.latex}</span>`;
    }
  }, [element.latex]);

  const fontSize = element.fontSize || 20;

  return (
    <foreignObject
      x={element.x - 150}
      y={element.y - 40}
      width={300}
      height={100}
      className={`transition-all duration-300 pointer-events-none select-none ${
        element.isHighlighted ? 'scale-110 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]' : ''
      }`}
      style={{ opacity: element.opacity ?? 1 }}
    >
      <div
        className="w-full h-full flex items-center justify-center text-slate-100 font-medium"
        style={{ fontSize: `${fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </foreignObject>
  );
};
