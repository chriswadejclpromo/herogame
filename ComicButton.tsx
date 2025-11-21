import React from 'react';

interface ComicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success';
  className?: string;
}

export const ComicButton: React.FC<ComicButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "comic-font text-xl px-6 py-3 rounded-lg comic-border comic-shadow transition-transform active:translate-y-1 active:shadow-none uppercase tracking-wider";
  
  let colorStyles = "bg-yellow-400 hover:bg-yellow-300 text-black";
  if (variant === 'danger') colorStyles = "bg-red-500 hover:bg-red-400 text-white";
  if (variant === 'success') colorStyles = "bg-green-500 hover:bg-green-400 text-white";

  return (
    <button 
      className={`${baseStyles} ${colorStyles} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};