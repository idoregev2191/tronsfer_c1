
import React, { useState } from 'react';
import { 
  Check, FileText, Image as ImageIcon, Film, Music, Download, Clock, Lock
} from 'lucide-react';
import { FileMeta } from '../types';
import { motion } from 'framer-motion';

interface FilePreviewProps {
  file: FileMeta;
  privacyMode?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, privacyMode = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isIncoming = file.direction === 'incoming';
  const isComplete = file.progress === 100;
  
  // Privacy logic: Blur if mode is on and not hovered, BUT only if transfer is done or incoming
  const shouldBlur = privacyMode && !isHovered;

  const getIcon = () => {
      if (file.type.startsWith('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
      if (file.type.startsWith('video')) return <Film className="w-5 h-5 text-indigo-500" />;
      if (file.type.startsWith('audio')) return <Music className="w-5 h-5 text-pink-500" />;
      return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full mb-2 relative group"
    >
      <div className={`bg-white border border-gray-100 shadow-sm p-4 rounded-[20px] flex items-center gap-4 transition-all hover:shadow-md ${shouldBlur ? 'blur-sm grayscale opacity-70' : ''}`}>
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                 <h4 className="font-semibold text-[15px] text-gray-900 truncate pr-2">{file.name}</h4>
                 {isComplete && <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">DONE</span>}
            </div>
            
            <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-medium text-gray-400">{formatSize(file.size)}</span>
                {!isComplete && file.timeRemaining && (
                   <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                      <Clock size={10} /> {file.timeRemaining}
                   </span>
                )}
            </div>
            
            {/* Progress Bar */}
            {file.progress < 100 && (
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-[#007AFF] transition-all duration-300 rounded-full" style={{width: `${file.progress}%`}} />
                </div>
            )}
        </div>

        <div className="shrink-0 pl-2">
            {isComplete && isIncoming && file.url ? (
                <a href={file.url} download={file.name} onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center hover:bg-[#007AFF]/20 transition-colors">
                    <Download size={18} />
                </a>
            ) : isComplete ? (
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                    <Check size={18} />
                </div>
            ) : null}
        </div>
      </div>
      
      {shouldBlur && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white text-xs font-bold shadow-lg">
                  <Lock size={12} /> Privacy Veil
              </div>
          </div>
      )}
    </motion.div>
  );
};
