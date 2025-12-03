
import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading, 
  icon,
  active,
  ...props 
}) => {
  const baseStyles = "rounded-full font-semibold transition-all duration-300 flex items-center justify-center outline-none focus:ring-4 focus:ring-blue-500/20";
  
  const variants = {
    primary: "px-6 py-3.5 text-[15px] tracking-wide bg-[#007AFF] text-white hover:bg-[#0062cc] hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20",
    secondary: "px-6 py-3.5 text-[15px] tracking-wide bg-white text-[#1D1D1F] hover:bg-gray-50 border border-gray-200 shadow-sm hover:scale-[1.02] active:scale-95",
    ghost: "px-4 py-2 text-sm bg-transparent text-[#007AFF] hover:bg-blue-50",
    glass: "px-6 py-3.5 text-[15px] bg-white/70 backdrop-blur-md border border-gray-200 text-[#1D1D1F] hover:bg-white shadow-sm",
    danger: "px-6 py-3.5 text-[15px] bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    icon: `w-10 h-10 p-0 ${active ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'} hover:bg-gray-200 active:scale-90 shadow-sm`
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.96 }}
      className={`${baseStyles} ${variants[variant]} ${className} ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      {children}
    </motion.button>
  );
};
