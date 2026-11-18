import React from 'react';
import {
  CanvasElement,
  NodeElement,
  BoxElement,
  ArrowElement,
  TextElement,
  MathElement
} from '../../types/canvas.types';
import { MathRenderer } from './MathRenderer';

interface ShapeRendererProps {
  element: CanvasElement;
  onSelect?: (element: CanvasElement) => void;
}

/**
 * Splits text into wrapped lines based on max character width
 * and handles bullet list points like "1. ... 2. ... 3. ..." gracefully.
 */
export function wrapTextToLines(text: string, maxCharsPerLine: number = 55): string[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (trimmed.includes('\n')) {
    return trimmed.split('\n').flatMap((l) => wrapTextToLines(l.trim(), maxCharsPerLine)).filter(Boolean);
  }
  // If text has list items like "1. ... 2. ... 3. ...", split on item boundaries
  if (/\b\d+\.\s+/.test(trimmed)) {
    const parts = trimmed.split(/(?=\b\d+\.\s+)/);
    if (parts.length > 1) {
      return parts.flatMap((p) => wrapTextToLines(p.trim(), maxCharsPerLine)).filter(Boolean);
    }
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ element, onSelect }) => {
  const isHighlighted = element.isHighlighted;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(element);
  };

  switch (element.type) {
    case 'node': {
      const node = element as NodeElement;
      const strokeColor = node.strokeColor || node.color || (isHighlighted ? '#60a5fa' : '#3b82f6');
      const fillColor = node.fillColor || (isHighlighted ? '#1e3a8a' : '#1e293b');
      const hasSubtext = Boolean(node.subtext);
      const radius = Math.max(22, node.radius || 28);
      const fitsInside = radius >= 26;

      return (
        <g
          id={`node-${node.id}`}
          className="cursor-pointer transition-transform duration-300 ease-out hover:scale-105"
          onClick={handleClick}
          style={{ opacity: node.opacity ?? 1 }}
        >
          {/* Highlight halo glow if active */}
          {isHighlighted && (
            <circle
              cx={node.x}
              cy={node.y}
              r={radius + 10}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="3"
              strokeDasharray="6,4"
              className="animate-spin"
              style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDuration: '6s' }}
            />
          )}

          {/* Node body circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={isHighlighted ? '3.5' : '2.5'}
            className="filter drop-shadow-md transition-colors duration-200"
          />

          {/* Node Main Label */}
          <text
            x={node.x}
            y={hasSubtext && fitsInside ? node.y - 4 : node.y + 5}
            textAnchor="middle"
            fill="#f8fafc"
            fontSize={Math.min(18, Math.max(12, radius * 0.52))}
            fontWeight="600"
            className="pointer-events-none select-none font-sans"
          >
            {node.label}
          </text>

          {/* Node Subtext: Inside circle if radius >= 26 */}
          {hasSubtext && fitsInside && (
            <text
              x={node.x}
              y={node.y + 12}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={Math.max(9, Math.min(11, radius * 0.32))}
              fontWeight="500"
              className="pointer-events-none select-none font-sans"
            >
              {node.subtext}
            </text>
          )}

          {/* Node Subtext: If small radius, render badge ABOVE node so downward edges never collide */}
          {hasSubtext && !fitsInside && (
            <g transform={`translate(${node.x}, ${node.y - radius - 12})`}>
              <rect
                x={-((String(node.subtext).length * 6) / 2 + 5)}
                y={-8}
                width={String(node.subtext).length * 6 + 10}
                height={16}
                rx={4}
                fill="#0f172a"
                fillOpacity="0.9"
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="500"
                className="pointer-events-none select-none font-sans"
              >
                {node.subtext}
              </text>
            </g>
          )}
        </g>
      );
    }

    case 'box': {
      const box = element as BoxElement;
      const strokeColor = box.strokeColor || box.color || (isHighlighted ? '#38bdf8' : '#475569');
      const fillColor = box.fillColor || (isHighlighted ? 'rgba(14, 165, 233, 0.15)' : 'rgba(30, 41, 59, 0.85)');

      const hasTitle = Boolean(box.title);
      const effectiveWidth = Math.max(box.width || 160, 160);

      // Wrap label text within the box width (with 18px horizontal padding on each side)
      const isMultiLineContent =
        (box.label && box.label.length > 35) ||
        (box.label && box.label.includes('\n')) ||
        /\b\d+\.\s+/.test(box.label || '');

      const labelFontSize = isMultiLineContent ? 12 : 14;
      const labelLineHeight = labelFontSize * 1.45;
      const approxCharWidth = labelFontSize * 0.56;
      const maxLabelChars = Math.max(14, Math.floor((effectiveWidth - 36) / approxCharWidth));
      const labelLines = wrapTextToLines(box.label || '', maxLabelChars);
      const totalLabelHeight = Math.max(labelLineHeight, labelLines.length * labelLineHeight);

      // Enforce dynamic box height expansion so label text NEVER overflows outside box boundaries
      const headerSpace = hasTitle ? 32 : 12;
      const bottomPadding = 14;
      const minNeededHeight = headerSpace + totalLabelHeight + bottomPadding;
      const effectiveHeight = Math.max(box.height || 65, minNeededHeight);

      const titleY = box.y + 19;
      const separatorY = box.y + 26;

      // When multi-line or list, left-align with 18px padding; single short label centers nicely
      const isLeftAligned = labelLines.length > 1;
      const textX = isLeftAligned ? box.x + 18 : box.x + effectiveWidth / 2;
      const textAnchor = isLeftAligned ? 'start' : 'middle';

      // Vertical starting position
      const contentAvailableHeight = effectiveHeight - (hasTitle ? 28 : 0);
      const labelStartY = hasTitle
        ? (isLeftAligned
            ? box.y + 44
            : box.y + 28 + (contentAvailableHeight - totalLabelHeight) / 2 + labelFontSize * 0.8)
        : box.y + (effectiveHeight - totalLabelHeight) / 2 + labelFontSize * 0.8;

      return (
        <g
          id={`box-${box.id}`}
          className="cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.02]"
          onClick={handleClick}
          style={{ opacity: box.opacity ?? 1 }}
        >
          {/* Box container */}
          <rect
            x={box.x}
            y={box.y}
            width={effectiveWidth}
            height={effectiveHeight}
            rx={10}
            ry={10}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={isHighlighted ? '3' : '2'}
            className={`filter drop-shadow-lg transition-all duration-200 ${
              isHighlighted ? 'drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]' : ''
            }`}
          />

          {/* Title Header if present */}
          {hasTitle && (
            <>
              <text
                x={box.x + 14}
                y={titleY}
                fill="#38bdf8"
                fontSize="11"
                fontWeight="700"
                className="pointer-events-none select-none tracking-wider uppercase font-mono"
              >
                {box.title}
              </text>
              <line
                x1={box.x + 12}
                y1={separatorY}
                x2={box.x + effectiveWidth - 12}
                y2={separatorY}
                stroke="#334155"
                strokeWidth="1"
              />
            </>
          )}

          {/* Body Label with multi-line wrapping */}
          <text
            x={textX}
            y={labelStartY}
            textAnchor={textAnchor}
            fill="#f1f5f9"
            fontSize={labelFontSize}
            fontWeight="500"
            className="pointer-events-none select-none font-sans"
          >
            {labelLines.map((line, idx) => (
              <tspan
                key={idx}
                x={textX}
                dy={idx === 0 ? 0 : labelLineHeight}
              >
                {line}
              </tspan>
            ))}
          </text>
        </g>
      );
    }

    case 'arrow': {
      const arrow = element as ArrowElement;
      const strokeColor = arrow.strokeColor || arrow.color || (isHighlighted ? '#fbbf24' : '#64748b');
      const dx = arrow.to.x - arrow.from.x;
      const dy = arrow.to.y - arrow.from.y;
      const chordLen = Math.sqrt(dx * dx + dy * dy) || 1;
      const midX = (arrow.from.x + arrow.to.x) / 2;
      const midY = (arrow.from.y + arrow.to.y) / 2;

      // Handle curve offset if requested
      const isCurved = arrow.curve === 'left' || arrow.curve === 'right';
      const curveMultiplier = arrow.curve === 'left' ? -1 : 1;
      const curveIntensity = Math.min(50, chordLen * 0.22);
      const nx = -(dy / chordLen) * curveMultiplier * curveIntensity;
      const ny = (dx / chordLen) * curveMultiplier * curveIntensity;
      const ctrlX = midX + nx;
      const ctrlY = midY + ny;

      // Calculate path angle at target endpoint
      const endAngle = isCurved ? Math.atan2(arrow.to.y - ctrlY, arrow.to.x - ctrlX) : Math.atan2(dy, dx);
      const headLength = 12;

      // Points for arrow head
      const arrowPoint1X = arrow.to.x - headLength * Math.cos(endAngle - Math.PI / 6);
      const arrowPoint1Y = arrow.to.y - headLength * Math.sin(endAngle - Math.PI / 6);
      const arrowPoint2X = arrow.to.x - headLength * Math.cos(endAngle + Math.PI / 6);
      const arrowPoint2Y = arrow.to.y - headLength * Math.sin(endAngle + Math.PI / 6);

      const labelX = isCurved ? ctrlX : midX;
      const labelY = isCurved ? ctrlY - 8 : midY - 12;

      return (
        <g
          id={`arrow-${arrow.id}`}
          className="transition-all duration-300"
          style={{ opacity: arrow.opacity ?? 1 }}
        >
          {/* Main line or curved path */}
          {isCurved ? (
            <path
              d={`M ${arrow.from.x} ${arrow.from.y} Q ${ctrlX} ${ctrlY} ${arrow.to.x} ${arrow.to.y}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isHighlighted ? '3' : '2'}
              strokeDasharray={arrow.dashed ? '6,4' : undefined}
              strokeLinecap="round"
            />
          ) : (
            <line
              x1={arrow.from.x}
              y1={arrow.from.y}
              x2={arrow.to.x}
              y2={arrow.to.y}
              stroke={strokeColor}
              strokeWidth={isHighlighted ? '3' : '2'}
              strokeDasharray={arrow.dashed ? '6,4' : undefined}
              strokeLinecap="round"
            />
          )}

          {/* Arrowhead */}
          <polygon
            points={`${arrow.to.x},${arrow.to.y} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
            fill={strokeColor}
          />

          {/* Arrow Label if available */}
          {arrow.label && (
            <g transform={`translate(${labelX}, ${labelY})`}>
              <rect
                x={-((arrow.label.length * 7) / 2 + 6)}
                y={-10}
                width={arrow.label.length * 7 + 12}
                height={20}
                rx={4}
                fill="#0f172a"
                fillOpacity="0.85"
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fill={isHighlighted ? '#fde047' : '#94a3b8'}
                fontSize="11"
                fontWeight="600"
                className="pointer-events-none select-none font-mono"
              >
                {arrow.label}
              </text>
            </g>
          )}
        </g>
      );
    }

    case 'text': {
      const textEl = element as TextElement;
      const isHandwritten = textEl.handwritten ?? false;
      const fontSize = textEl.fontSize || 18;
      const fontColor = textEl.color || (isHighlighted ? '#60a5fa' : '#e2e8f0');

      // Center titles and headings positioned around the middle or near top
      const isCenterTitle = (textEl.x >= 300 && textEl.x <= 700) || textEl.y <= 110;
      const textX = isCenterTitle ? 500 : textEl.x;
      const textAnchor = isCenterTitle ? 'middle' : 'start';
      // Ensure top titles stay comfortably below fullscreen notifications & headers
      const textY = Math.max(textEl.y, 85);

      // Calculate max line length to fit comfortably within canvas
      const availableWidth = isCenterTitle ? 850 : Math.max(260, 960 - textX);
      const approxCharWidth = (fontSize || 16) * 0.54;
      const maxChars = Math.max(20, Math.floor(availableWidth / approxCharWidth));
      const lines = wrapTextToLines(textEl.text, maxChars);
      const lineHeight = fontSize * 1.35;

      return (
        <text
          x={textX}
          y={textY}
          textAnchor={textAnchor}
          fill={fontColor}
          fontSize={fontSize}
          fontWeight={textEl.fontWeight || 'normal'}
          className={`pointer-events-none select-none transition-all duration-200 ${
            isHandwritten ? 'font-caveat text-2xl tracking-wide' : 'font-sans'
          } ${isHighlighted ? 'drop-shadow-[0_0_10px_rgba(96,165,250,0.6)] font-bold' : ''}`}
          style={{ opacity: textEl.opacity ?? 1 }}
        >
          {lines.map((line, idx) => (
            <tspan
              key={idx}
              x={textX}
              dy={idx === 0 ? 0 : lineHeight}
            >
              {line}
            </tspan>
          ))}
        </text>
      );
    }

    case 'math': {
      return <MathRenderer element={element as MathElement} />;
    }

    default:
      return null;
  }
};
