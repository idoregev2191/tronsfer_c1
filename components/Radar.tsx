
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Monitor } from 'lucide-react';
import { PeerUser } from '../types';

interface RadarProps {
  peers: PeerUser[];
  onConnect: (peer: PeerUser) => void;
  myNickname: string;
  spatialMode?: boolean; // Kept for prop compatibility but unused visually
}

export const Radar: React.FC<RadarProps> = ({ peers, onConnect, myNickname }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
      if (containerRef.current) {
          setDimensions({
              width: containerRef.current.offsetWidth,
              height: containerRef.current.offsetHeight
          });
      }
      const handleResize = () => {
          if (containerRef.current) {
               setDimensions({
                  width: containerRef.current.offsetWidth,
                  height: containerRef.current.offsetHeight
              });
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden bg-white/50 backdrop-blur-sm">
      {/* Precision Finding Rings - Apple Style */}
      <div className="absolute border border-blue-500/10 rounded-full" style={{ width: '85%', height: '85%', maxWidth: 450, maxHeight: 450 }} />
      <div className="absolute border border-blue-500/20 rounded-full" style={{ width: '60%', height: '60%', maxWidth: 300, maxHeight: 300 }} />
      <div className="absolute border border-blue-500/30 rounded-full" style={{ width: '35%', height: '35%', maxWidth: 180, maxHeight: 180 }} />
      
      {/* Pulse Effect */}
      <div className="absolute bg-blue-500/5 rounded-full animate-ping" style={{ width: '20%', height: '20%', maxWidth: 100, maxHeight: 100, animationDuration: '3s' }} />

      {/* Me (Center) */}
      <div className="relative z-10 w-24 h-24 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center">
        <span className="text-2xl font-bold text-[#1D1D1F]">{myNickname.substring(0,1).toUpperCase()}</span>
        <div className="absolute -bottom-2 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white tracking-widest uppercase">
            You
        </div>
      </div>

      {/* Peers */}
      {peers.map((peer, index) => {
          const total = peers.length;
          // Calculate position - spread them out nicely
          const maxRadius = Math.min(dimensions.width, dimensions.height) / 2 - 60; 
          const radius = Math.max(100, Math.min(160, maxRadius)); 
          const angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.button
              key={peer.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x, y }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onConnect(peer)}
              className="absolute z-20 flex flex-col items-center justify-center w-24 group"
            >
              <div className="w-16 h-16 rounded-full bg-[#F5F5F7] shadow-lg flex items-center justify-center border border-white group-hover:border-blue-500 transition-colors relative">
                  {peer.platform === 'mobile' ? <Smartphone size={24} className="text-[#1D1D1F]"/> : <Monitor size={24} className="text-[#1D1D1F]"/>}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
              </div>
              <span className="mt-2 px-3 py-1 bg-white/80 backdrop-blur-md rounded-lg text-xs font-semibold text-[#1D1D1F] shadow-sm truncate max-w-full">
                {peer.nickname}
              </span>
            </motion.button>
          );
      })}
    </div>
  );
};
