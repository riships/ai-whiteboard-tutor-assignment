import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  // Split text by $$...$$ (block math) and $...$ (inline math)
  // Regex matches $$...$$ or $...$
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g);

  return (
    <div className={`leading-relaxed break-words ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <div
                key={index}
                className="my-2 overflow-x-auto py-1 text-center"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <div key={index} className="my-2 font-mono text-xs">{part}</div>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="inline-block px-1 align-baseline"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={index} className="font-mono text-xs">{part}</span>;
          }
        }

        // Render regular prose with preserved line breaks
        const paragraphs = part.split('\n\n');
        return (
          <React.Fragment key={index}>
            {paragraphs.map((para, pIdx) => (
              <span key={pIdx}>
                {para.split('\n').map((line, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {line}
                    {lIdx < para.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
                {pIdx < paragraphs.length - 1 && <span className="block h-2" />}
              </span>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};
