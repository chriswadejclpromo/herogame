import React, { useState, useRef, useEffect } from 'react';
import { GameState, GamePhase, FoodItem } from '../types';
import { VillainCard } from './VillainCard';
import { HeroCard } from './HeroCard';
import { ComicButton } from './ComicButton';
import { ArrowUp, Star } from 'lucide-react';

interface BattleSceneProps {
  gameState: GameState;
  onFoodSelect: (food: FoodItem) => void;
  onNextRound: () => void;
}

interface HitEffect {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export const BattleScene: React.FC<BattleSceneProps> = ({ gameState, onFoodSelect, onNextRound }) => {
  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [isTargetingVillain, setIsTargetingVillain] = useState(false);
  
  // Visual Effects State
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  
  // Refs
  const villainRef = useRef<HTMLDivElement>(null);

  // --- Event Listeners for Dragging ---
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (draggingId) {
        setPointerPos({ x: e.clientX, y: e.clientY });
        checkCollision(e.clientX, e.clientY);
      }
    };

    const handlePointerUp = () => {
      if (draggingId) {
        if (isTargetingVillain) {
            const food = gameState.currentFoods.find(f => f.id === draggingId);
            if (food) onFoodSelect(food);
        }
        setDraggingId(null);
        setIsTargetingVillain(false);
      }
    };

    if (draggingId) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingId, isTargetingVillain, gameState.currentFoods, onFoodSelect]);

  // --- Effects (Hit/Shake) ---
  useEffect(() => {
    if (gameState.phase === GamePhase.RESULT && gameState.lastResult) {
      if (!gameState.lastResult.success) {
         setShakeScreen(true);
         setTimeout(() => setShakeScreen(false), 500);
      }

      const texts = gameState.lastResult.success 
        ? ["POW!", "CRUNCH!", "VITAMINS!", "TASTY!"] 
        : ["GROSS!", "WEAK!", "NOPE!", "MISS!"];
      
      const color = gameState.lastResult.success ? "text-green-600" : "text-red-600";
      
      const newEffect: HitEffect = {
        id: Date.now(),
        text: texts[Math.floor(Math.random() * texts.length)],
        x: window.innerWidth / 2 + (Math.random() * 100 - 50),
        y: window.innerHeight / 3 + (Math.random() * 100 - 50),
        color
      };
      
      setHitEffects(prev => [...prev, newEffect]);
    }
  }, [gameState.phase, gameState.lastResult]);

  useEffect(() => {
      if (hitEffects.length > 0) {
          const timer = setTimeout(() => {
              setHitEffects(prev => prev.slice(1));
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [hitEffects]);

  const checkCollision = (x: number, y: number) => {
    if (villainRef.current) {
      const rect = villainRef.current.getBoundingClientRect();
      const padding = 50;
      const isOver = x >= rect.left - padding && x <= rect.right + padding &&
                     y >= rect.top - padding && y <= rect.bottom + padding;
      setIsTargetingVillain(isOver);
    }
  };

  const startDrag = (e: React.PointerEvent, id: string) => {
    if (gameState.phase !== GamePhase.BATTLE) return;
    setDraggingId(id);
    setPointerPos({ x: e.clientX, y: e.clientY });
    checkCollision(e.clientX, e.clientY);
  };

  const draggedFood = gameState.currentFoods.find(f => f.id === draggingId);

  // Helper for aesthetic random rotation
  const getRandomRotation = (index: number) => {
      const rots = ['rotate-3', '-rotate-3', 'rotate-6', '-rotate-6'];
      return rots[index % rots.length];
  };

  // Helper for Token Colors (Game Token Style)
  const getTokenStyles = (type: string) => {
      switch(type) {
          // Distinct colors for distinct types
          case 'Protein': return 'bg-red-100 border-red-600 text-red-900 ring-red-300';
          case 'Veggie': return 'bg-green-100 border-green-600 text-green-900 ring-green-300';
          case 'Fruit': return 'bg-orange-100 border-orange-600 text-orange-900 ring-orange-300';
          case 'Dairy': return 'bg-cyan-100 border-cyan-600 text-cyan-900 ring-cyan-300';
          case 'Carb': return 'bg-yellow-100 border-yellow-600 text-yellow-900 ring-yellow-300';
          default: return 'bg-gray-200 border-gray-600 text-gray-900 ring-gray-300';
      }
  };

  // Helper to assign position classes for floating cards
  const getPositionClasses = (index: number) => {
      const base = "absolute transition-transform active:scale-95 touch-none ";
      
      // Desktop: Corners
      const desktopPositions = [
          "md:top-1/4 md:left-10",
          "md:top-1/4 md:right-10",
          "md:bottom-1/4 md:left-20",
          "md:bottom-1/4 md:right-20"
      ];

      // Mobile: Clustered at bottom in a grid
      const mobilePositions = [
          "left-4 top-[62%]",   
          "right-4 top-[62%]",  
          "left-10 top-[78%]", 
          "right-10 top-[78%]"  
      ];

      return `${base} ${desktopPositions[index]} ${mobilePositions[index]}`;
  };

  // Determine button text based on game state
  const getButtonText = () => {
    if (gameState.heroHealth <= 0) return "See Score";
    if (gameState.lastResult?.success) return "Next Battle";
    return "Try Again";
  }

  return (
    <div className={`relative w-full h-full max-w-6xl mx-auto ${shakeScreen ? 'animate-shake' : ''}`}>
      
      {/* --- HERO STATS (Top Left) --- */}
      <div className="absolute top-0 left-2 md:left-4 z-30 w-32 md:w-48">
           <HeroCard state={gameState} />
      </div>

      {/* --- INSTRUCTION BANNER (THE UPDATE YOU REQUESTED) --- */}
      <div className="absolute top-[45%] md:top-[75%] left-0 right-0 flex justify-center z-10 pointer-events-none">
         <div className="bg-yellow-300 border-[4px] border-black px-6 py-3 md:px-10 md:py-5 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1 max-w-[95%] text-center animate-float z-10">
             <div className="absolute -top-4 -left-4 bg-blue-500 text-white px-3 py-1 comic-font border-2 border-black -rotate-6 text-sm">
                 MISSION DIRECTIVE
             </div>
             <p className="comic-font text-sm md:text-lg leading-tight text-black mb-1 opacity-80 font-bold tracking-wider">
                TO DEFEAT {gameState.currentVillain?.name.toUpperCase()}...
             </p>
             <h2 className="comic-font text-2xl md:text-4xl leading-none text-red-600 comic-text-stroke-sm uppercase drop-shadow-sm">
                FIND FOOD WITH <span className="text-yellow-100 drop-shadow-[2px_2px_0_black] italic underline decoration-4 decoration-blue-500">{gameState.currentVillain?.weaknessHint}</span>!
             </h2>
         </div>
      </div>

      {/* --- CENTER: VILLAIN --- */}
      <div className="absolute inset-0 flex items-start md:items-center justify-center pt-16 md:pt-0 pointer-events-none">
          <div 
            ref={villainRef}
            className={`
                relative w-64 md:w-80 transition-transform duration-300 pointer-events-auto
                ${isTargetingVillain ? 'scale-110' : 'scale-100'}
            `}
          >
            <VillainCard 
                villain={gameState.currentVillain} 
                isLoading={false}
                isTargeted={isTargetingVillain} 
            />
             
            {/* Drop Zone Indicator */}
            <div className={`
                absolute -inset-6 border-4 border-dashed border-red-500 rounded-full 
                flex items-center justify-center bg-red-100/30 backdrop-blur-[1px]
                transition-opacity duration-200 z-[-1]
                ${draggingId ? 'opacity-100' : 'opacity-0'}
                ${isTargetingVillain ? 'bg-red-200/50 scale-110 border-solid animate-pulse' : ''}
            `}>
            </div>
          </div>
      </div>

      {/* --- FLOATING FOOD TOKENS --- */}
      {gameState.currentFoods.map((food, index) => {
        const isBeingDragged = draggingId === food.id;
        const delayClass = `delay-${index * 100}`; 
        const colorStyles = getTokenStyles(food.type);

        return (
            <div 
                key={food.id}
                onPointerDown={(e) => startDrag(e, food.id)}
                className={`
                    ${getPositionClasses(index)}
                    ${isBeingDragged ? 'opacity-0' : 'opacity-100'}
                    cursor-grab active:cursor-grabbing
                    z-20
                `}
            >
                <div className={`
                    ${colorStyles} p-1 rounded-full border-[3px] shadow-[4px_4px_0px_rgba(0,0,0,0.3)] ring-4 ring-offset-0
                    w-24 h-24 md:w-36 md:h-36 flex flex-col items-center justify-center
                    ${getRandomRotation(index)} hover:scale-110 hover:rotate-0 hover:z-50 transition-all duration-200
                    ${!draggingId ? 'animate-float' : ''} ${delayClass}
                    ${gameState.phase !== GamePhase.BATTLE ? 'opacity-50 grayscale' : ''}
                    bg-gradient-to-br from-white/40 to-black/5
                `}>
                     {/* "Shine" effect on the token */}
                     <div className="absolute top-2 left-4 w-4 h-2 bg-white/60 rounded-full rotate-45 blur-[1px]"></div>

                     <div className="text-4xl md:text-6xl mb-1 pointer-events-none filter drop-shadow-sm">{food.emoji}</div>
                     <div className="font-bold leading-tight text-[10px] md:text-xs uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded-md border border-black/20 shadow-sm max-w-[90%] text-center truncate">
                        {food.name}
                     </div>
                </div>
            </div>
        );
      })}


      {/* --- RESULT OVERLAY --- */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
          {/* Hit Effects */}
          {hitEffects.map(effect => (
              <div 
                key={effect.id} 
                className={`absolute comic-font text-6xl md:text-8xl font-bold comic-text-stroke animate-damage-text ${effect.color}`}
                style={{ 
                    left: effect.x, 
                    top: effect.y,
                }}
              >
                  {effect.text}
              </div>
          ))}

          {/* Result Modal */}
          {gameState.phase === GamePhase.RESULT && gameState.lastResult && (
             <div className="pointer-events-auto bg-white p-6 rounded-[2rem] comic-border comic-shadow-lg text-center animate-pop-in max-w-md mx-4 relative">
                <Star className="absolute -top-8 -right-8 text-yellow-400 w-20 h-20 animate-spin-slow" fill="currentColor"/>
                
                <h2 className={`text-5xl mb-2 comic-font comic-text-stroke ${gameState.lastResult.success ? 'text-green-500' : 'text-red-500'}`}>
                   {gameState.lastResult.success ? "SMASHED IT!" : "FAIL!"}
                </h2>
                <p className="text-xl font-bold mb-6 text-gray-700 italic">
                   "{gameState.lastResult.narrative}"
                </p>
                <ComicButton 
                  onClick={onNextRound} 
                  variant={gameState.lastResult.success ? 'success' : 'primary'} 
                  className="w-full text-xl"
                >
                  {getButtonText()}
                </ComicButton>
             </div>
          )}
           
           {/* Evaluating Loader */}
          {gameState.phase === GamePhase.EVALUATING && (
              <div className="bg-white px-8 py-4 rounded-full comic-border animate-bounce flex items-center gap-3">
                  <span className="text-3xl">🤔</span>
                  <span className="comic-font text-2xl">JUDGING...</span>
              </div>
          )}
      </div>

      {/* --- DRAGGING GHOST --- */}
      {draggingId && draggedFood && (
        <div 
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: pointerPos.x, top: pointerPos.y }}
        >
            <div className={`
                bg-white p-4 rounded-full border-[3px] border-black shadow-2xl w-32 h-32 flex items-center justify-center
                ${isTargetingVillain ? 'scale-125 rotate-0 border-red-500 ring-4 ring-red-300' : 'rotate-12'}
                transition-all duration-100
            `}>
                 <div className="text-6xl">{draggedFood.emoji}</div>
            </div>
        </div>
      )}
    </div>
  );
};