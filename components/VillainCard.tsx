import React from 'react';
import { Villain } from '../types';

interface VillainCardProps {
  villain: Villain | null;
  isLoading: boolean;
  isTargeted?: boolean;
}

export const VillainCard: React.FC<VillainCardProps> = ({ villain, isLoading, isTargeted = false }) => {
  if (isLoading) {
    return (
      <div className="h-64 bg-gray-100 rounded-full comic-border border-dashed border-4 flex items-center justify-center animate-pulse aspect-square">
        <p className="comic-font text-2xl text-gray-400">LOADING...</p>
      </div>
    );
  }

  if (!villain) return null;

  return (
    <div className={`
        aspect-square flex flex-col items-center justify-center
        bg-purple-100 p-6 rounded-full comic-border comic-shadow relative text-center 
        transition-all duration-200
        ${isTargeted ? 'bg-red-200 scale-105 ring-4 ring-red-500 ring-offset-4' : 'hover:scale-105'}
    `}>
        
        <div className={`text-8xl md:text-9xl mb-2 filter drop-shadow-lg transition-transform duration-200 ${isTargeted ? 'scale-110 grayscale-[50%]' : 'animate-bounce'}`}>
            {villain.appearance}
        </div>
        
        <div className="relative z-10 bg-white/90 px-4 py-2 rounded-lg border-2 border-purple-900 transform -rotate-2 mb-1 shadow-sm">
             <h2 className="text-2xl md:text-3xl text-purple-900 comic-font tracking-wide leading-none uppercase">{villain.name}</h2>
        </div>
        
        <p className="font-bold text-purple-800 text-xs md:text-sm max-w-[80%] leading-tight italic mt-2">"{villain.description}"</p>
    </div>
  );
};