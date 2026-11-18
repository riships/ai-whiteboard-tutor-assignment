import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement, TutorPointerState } from '../../types/canvas.types';
import { ShapeRenderer } from './ShapeRenderer';
import { TutorPointer } from './TutorPointer';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Layers } from 'lucide-react';

interface WhiteboardProps {
  elements: CanvasElement[];
  pointer?: TutorPointerState;
  onElementClick?: (element: CanvasElement) => void;
  className?: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  elements,
  pointer = { x: 0, y: 0, visible: false },
  onElementClick,
  className = '',
}) => {
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Start pan on middle click, or left click on background rect
    if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).tagName === 'rect')) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleElementClick = (element: CanvasElement) => {
    setSelectedElementId(element.id);
    onElementClick?.(element);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}
    >
      {/* Top Whiteboard Header Info Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
        <Layers className="w-3.5 h-3.5 text-blue-400" />
        <span>{elements.length} Whiteboard Elements</span>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <span className="font-mono text-slate-400">Zoom: {Math.round(scale * 100)}%</span>
      </div>

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Reset) */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-lg">
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset Zoom"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-1" />
        <button
          onClick={() => {
            if (containerRef.current) {
              if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen().catch((err) => console.log(err));
              } else {
                document.exitFullscreen().catch((err) => console.log(err));
              }
            }
          }}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Toggle Fullscreen'}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* SVG Canvas with Dot Grid Pattern and Pan/Drag */}
      <div
        className={`w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'p-6 pt-16' : 'p-4'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
      >
        <svg
          viewBox="0 0 1000 650"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 150ms ease-out',
          }}
          onClick={() => setSelectedElementId(null)}
        >
          <defs>
            {/* Whiteboard Subtle Dot Grid */}
            <pattern id="dotGrid" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#334155" opacity="0.6" />
            </pattern>

            {/* Linear Gradient for Nodes */}
            <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            {/* Glowing Accent Gradient */}
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="650" fill="url(#dotGrid)" />

          {/* Outer Border Guide */}
          <rect
            x="8"
            y="8"
            width="984"
            height="634"
            fill="none"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            rx="12"
          />

          {/* Elements Group */}
          <g id="whiteboard-elements">
            {elements.map((el) => (
              <ShapeRenderer
                key={el.id}
                element={{
                  ...el,
                  isHighlighted: el.isHighlighted || el.id === selectedElementId,
                }}
                onSelect={handleElementClick}
              />
            ))}
          </g>

          {/* Tutor Pointer Overlay */}
          <TutorPointer pointer={pointer} />
        </svg>
      </div>
    </div>
  );
};
