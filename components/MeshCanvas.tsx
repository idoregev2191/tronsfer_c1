
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileMeta, DrawStroke } from '../types';
import { Image as ImageIcon, Film, Music, FileText, Move } from 'lucide-react';

interface MeshCanvasProps {
  files: FileMeta[];
  strokes: DrawStroke[];
  onMove: (id: string, x: number, y: number) => void;
  onOpen: (file: FileMeta) => void;
  onDrawStart: (x: number, y: number) => void;
  onDrawMove: (x: number, y: number) => void;
  onDrawEnd: () => void;
}

export const MeshCanvas: React.FC<MeshCanvasProps> = ({ 
  files, strokes, onMove, onOpen, onDrawStart, onDrawMove, onDrawEnd 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Handle Dragging Files
  const handleDragEnd = (event: any, info: any, fileId: string) => {
     // Calculate relative position based on parent
     if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        // Framer motion uses transform, we need to normalize this to simple coordinates
        // For simplicity in this version, we trust the visual delta, but in prod we'd map pixels
        // This is a simplified approach:
        // We trigger the callback, parent updates state, rerender positions.
        // NOTE: Framer Motion 'drag' handles visual movement. We need to sync final pos.
     }
  };

  return (
    <div 
      ref={canvasRef}
      className="absolute inset-0 bg-[#F5F5F7] overflow-hidden cursor-crosshair touch-none"
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('.mesh-card')) return;
        setIsDrawing(true);
        onDrawStart(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        if (!isDrawing) return;
        onDrawMove(e.clientX, e.clientY);
      }}
      onMouseUp={() => {
        setIsDrawing(false);
        onDrawEnd();
      }}
      onMouseLeave={() => {
        setIsDrawing(false);
        onDrawEnd();
      }}
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Drawing Layer (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {strokes.map((stroke) => (
          <polyline
            key={stroke.id}
            points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={stroke.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
        ))}
      </svg>

      {/* Files Layer */}
      {files.map((file) => (
        <MeshCard 
          key={file.id} 
          file={file} 
          onOpen={() => onOpen(file)}
          onDrag={(x, y) => onMove(file.id, x, y)}
        />
      ))}
    </div>
  );
};

const MeshCard: React.FC<{ file: FileMeta, onOpen: () => void, onDrag: (x: number, y: number) => void }> = ({ file, onOpen, onDrag }) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: file.x || 100, y: file.y || 100, scale: 0.8, opacity: 0 }}
      animate={{ x: file.x || 100, y: file.y || 100, scale: 1, opacity: 1 }}
      onDragEnd={(e, info) => {
         const newX = (file.x || 100) + info.offset.x;
         const newY = (file.y || 100) + info.offset.y;
         onDrag(newX, newY);
      }}
      className="absolute z-10 w-48 bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden flex flex-col group mesh-card cursor-grab active:cursor-grabbing"
    >
      {/* Preview Area */}
      <div className="h-32 bg-gray-50 flex items-center justify-center relative overflow-hidden" onDoubleClick={onOpen}>
          {file.url && isImage ? (
              <img src={file.url} className="w-full h-full object-cover pointer-events-none" alt="" />
          ) : file.url && isVideo ? (
              <video src={file.url} className="w-full h-full object-cover pointer-events-none" />
          ) : (
             <div className="text-gray-300">
                {file.type.startsWith('audio') ? <Music size={32} /> : <FileText size={32} />}
             </div>
          )}
          
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {file.type.split('/')[1]?.toUpperCase()}
          </div>
      </div>

      {/* Drag Handle & Info */}
      <div className="p-3 bg-white/90 backdrop-blur-sm flex items-center justify-between">
          <div className="w-full">
            {/* No name, just clean UI as requested */}
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{width: `${file.progress}%`}} />
            </div>
          </div>
          <Move size={12} className="text-gray-400 ml-2" />
      </div>
    </motion.div>
  );
};
