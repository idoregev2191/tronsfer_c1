import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glass = true, noPadding = false }) => {
  return (
    <div className={`
      relative overflow-hidden transition-all duration-300
      bg-white shadow-sm border border-gray-100
      rounded-[24px] ${noPadding ? 'p-0' : 'p-6'} ${className}
    `}>
      {children}
    </div>
  );
};