import React from 'react';
import { GameState } from './types';
import { Heart, Star, ShieldCheck } from 'lucide-react';

interface HeroCardProps {
  state: GameState;
}

export const HeroCard: React.FC<HeroCardProps> = ({ state }) => {
  return (
    <div className="bg-white p-4 rounded-xl comic-border comic-shadow relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-4 bg-blue-500"></div>
      
      <div className="flex items-center justify-between mb-4 mt-2">
        <div className="flex items-center gap-2">
           <div className="w-12 h-12 bg-blue-100 rounded-full comic-border flex items-center justify-center text-2xl">
             🦸
           </div>
           <div>
             <h3 className="text-xl leading-none">Nutrition Hero</h3>
             <p className="text-xs text-gray-500 font-bold">Level {state.level}</p>
           </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-500 font-bold text-xl">
            <Star fill="currentColor" />
            <span>{state.score}</span>
          </div>
        </div>
      </div>

      {/* Health Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm font-bold">
          <span className="flex items-center gap-1"><Heart size={16} className="text-red-500" fill="currentColor"/> Energy</span>
          <span>{state.heroHealth}%</span>
        </div>
        <div className="w-full bg-gray-200 h-4 rounded-full border-2 border-black overflow-hidden">
          <div 
            className="bg-red-500 h-full transition-all duration-500"
            style={{ width: `${state.heroHealth}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};