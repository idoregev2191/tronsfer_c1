import React from 'react';
import { X, Download, Share2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { FileMeta } from '../types';

interface FullScreenPreviewProps {
  file: FileMeta;
  onClose: () => void;
}

export const FullScreenPreview: React.FC<FullScreenPreviewProps> = ({ file, onClose }) => {
  if (!file.url) return null;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isPDF = file.type === 'application/pdf';
  const isText = file.type.startsWith('text/');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
      className="fixed inset-0 z-[9999] bg-[#F5F5F7]/95 backdrop-blur-3xl flex flex-col"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-md sticky top-0 z-10 safe-top">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-200/50 rounded-full text-gray-900 hover:bg-gray-300/50 transition-colors ios-btn-active">
           <X size={20} />
        </button>
        <div className="flex flex-col items-center px-4">
            <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{file.name}</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">{file.type.split('/')[1] || 'FILE'}</span>
        </div>
        <a href={file.url} download={file.name} className="w-10 h-10 flex items-center justify-center bg-[#007AFF] rounded-full text-white hover:bg-blue-600 transition-colors ios-btn-active shadow-lg shadow-blue-500/20">
           <Download size={20} />
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
         <div className="w-full h-full max-w-6xl flex items-center justify-center relative">
             {isImage && (
                <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
             )}
             {isVideo && (
                <video src={file.url} controls autoPlay className="max-w-full max-h-full rounded-lg shadow-2xl bg-black" />
             )}
             {isAudio && (
                 <div className="w-full max-w-md bg-white p-12 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 text-center">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-8 shadow-inner ring-4 ring-white">
                        <Share2 size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-6 truncate">{file.name}</h3>
                    <audio src={file.url} controls className="w-full accent-blue-500" />
                 </div>
             )}
             {isPDF && (
                 <iframe src={file.url} className="w-full h-full rounded-xl shadow-xl border border-gray-200 bg-white" title="PDF Preview" />
             )}
             {isText && (
                 <iframe src={file.url} className="w-full h-full rounded-xl shadow-xl border border-gray-200 bg-white p-4" title="Text Preview" />
             )}
             {!isImage && !isVideo && !isAudio && !isPDF && !isText && (
                 <div className="text-center text-gray-400 flex flex-col items-center bg-white p-10 rounded-3xl shadow-sm">
                     <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                         <FileText size={40} className="text-gray-300" />
                     </div>
                     <p className="text-lg font-medium">Preview not available</p>
                     <p className="text-sm opacity-60 mt-2">Download the file to view it</p>
                 </div>
             )}
         </div>
      </div>
    </motion.div>
  );
};