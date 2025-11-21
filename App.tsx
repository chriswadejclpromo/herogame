import React, { useState, useEffect } from 'react';
import { GameState, GamePhase, FoodItem, BattleResult } from './types';
import { generateScenario, evaluateTurn } from './geminiService';
import { ComicButton } from './ComicButton';
import { BattleScene } from './BattleScene';
import { Loader2, Skull, Play, Star, AlertTriangle, ExternalLink } from 'lucide-react';

const INITIAL_STATE: GameState = {
  phase: GamePhase.START,
  score: 0,
  level: 1,
  heroHealth: 100,
  currentVillain: null,
  currentFoods: [],
  lastResult: null,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  const startGame = async () => {
    setGameState(prev => ({ ...INITIAL_STATE, phase: GamePhase.LOADING_SCENARIO }));
    await loadNewRound(1);
  };

  const loadNewRound = async (level: number) => {
    try {
      const scenario = await generateScenario(level);
      setGameState(prev => ({
        ...prev,
        level,
        currentVillain: scenario.villain,
        currentFoods: scenario.foods,
        phase: GamePhase.BATTLE,
        lastResult: null,
      }));
    } catch (error) {
      console.error("Error loading scenario", error);
      // Retry logic or error state could go here, currently just resetting
      setGameState(prev => ({ ...prev, phase: GamePhase.START })); 
    }
  };

  const handleFoodSelect = async (food: FoodItem) => {
    if (!gameState.currentVillain) return;

    setGameState(prev => ({ ...prev, phase: GamePhase.EVALUATING }));

    try {
      const result = await evaluateTurn(gameState.currentVillain, food);
      
      setGameState(prev => {
        let newHealth = prev.heroHealth;
        let newScore = prev.score;
        let newFoods = prev.currentFoods;

        if (result.success) {
          // Success: Add points
          newScore += result.damageDealt;
        } else {
          // Failure: Lose health AND remove the bad food option so they can't pick it again
          newHealth -= 20;
          newFoods = prev.currentFoods.filter(f => f.id !== food.id);
        }

        return {
          ...prev,
          currentFoods: newFoods,
          lastResult: result,
          heroHealth: Math.max(0, newHealth),
          score: newScore,
          phase: GamePhase.RESULT,
        };
      });

    } catch (error) {
      console.error(error);
      setGameState(prev => ({ ...prev, phase: GamePhase.BATTLE })); // Retry on error
    }
  };

  const handleContinue = () => {
    // Check for death first
    if (gameState.heroHealth <= 0) {
      setGameState(prev => ({ ...prev, phase: GamePhase.GAME_OVER }));
      return;
    }

    // If they won the last round, go to next level
    if (gameState.lastResult?.success) {
      setGameState(prev => ({ ...prev, phase: GamePhase.LOADING_SCENARIO }));
      loadNewRound(gameState.level + 1);
    } else {
      // If they failed, let them TRY AGAIN (return to battle with updated food list)
      setGameState(prev => ({ 
        ...prev, 
        phase: GamePhase.BATTLE,
        lastResult: null 
      }));
    }
  };

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-yellow-50 pattern-dots">
        <div className="bg-white p-8 rounded-3xl border-4 border-red-500 text-center comic-shadow max-w-lg w-full">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={64} />
          <h1 className="text-3xl font-bold mb-4 comic-font uppercase text-red-600">Missing Power Source!</h1>
          <p className="mb-6 text-lg text-gray-700 font-bold">
            To defeat the villains, you need a Google Gemini API Key.
          </p>
          
          <div className="bg-gray-100 p-4 rounded-xl border-2 border-black border-dashed mb-6">
            <p className="text-sm text-gray-600 mb-2 font-bold uppercase">Step 1: Get your Free Key</p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold underline text-lg"
            >
              Get API Key from Google AI Studio <ExternalLink size={18}/>
            </a>
          </div>

          <div className="text-left text-sm bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
            <p className="font-bold mb-1 text-blue-800">How to add it:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Create a file named <code className="bg-white px-1 rounded border">.env</code> in your project root.</li>
              <li>Add this line: <code className="bg-white px-1 rounded border">API_KEY=your_key_here</code></li>
              <li>Restart your app.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col no-select overflow-hidden relative">
      
      {/* Background Decorations (Stars from logo) */}
      <div className="absolute top-10 left-10 text-yellow-400 animate-pulse pointer-events-none hidden md:block"><Star fill="currentColor" size={40}/></div>
      <div className="absolute bottom-20 right-10 text-yellow-400 animate-pulse delay-100 pointer-events-none hidden md:block"><Star fill="currentColor" size={60}/></div>
      <div className="absolute top-1/4 right-20 text-red-400 pointer-events-none opacity-50 hidden md:block rotate-12"><Star fill="currentColor" size={30}/></div>

      {/* Logo-Style Header */}
      <header className="text-center z-20 pt-2 md:pt-4 relative shrink-0">
        <div className="inline-block relative hover:scale-105 transition-transform cursor-pointer">
           {/* Green "Speech Bubble" Shape behind text */}
           <div className="absolute -inset-4 bg-green-700 rounded-[50%] rotate-[-2deg] border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] z-[-1]"></div>
           
           <div className="flex flex-col items-center leading-none relative z-10">
              <h2 className="text-xl md:text-2xl text-yellow-300 comic-font comic-text-stroke tracking-wider rotate-[-2deg]">DISCOVER</h2>
              <h1 className="text-4xl md:text-6xl text-red-600 comic-font comic-text-stroke tracking-wide scale-y-110">THE POWER</h1>
              <h2 className="text-xl md:text-2xl text-yellow-300 comic-font comic-text-stroke tracking-wider rotate-[2deg]">OF NUTRITION</h2>
           </div>
           
           <div className="bg-white border-2 border-black px-2 py-0.5 rotate-6 absolute -bottom-2 -right-6 shadow-md">
             <span className="text-xs md:text-sm font-bold tracking-widest text-black">GAME ON!</span>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        {/* START SCREEN */}
        {gameState.phase === GamePhase.START && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm z-50">
            <div className="bg-white p-8 rounded-3xl comic-border comic-shadow text-center max-w-lg w-full animate-pop-in relative overflow-hidden">
                {/* Background beams */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-200 to-transparent opacity-50"></div>
               
               <div className="relative z-10">
                 <div className="text-8xl mb-6 animate-bounce filter drop-shadow-lg">🦸🥦</div>
                 <h2 className="text-4xl mb-4 text-blue-600 comic-font comic-text-stroke-sm uppercase">Join the Squad!</h2>
                 <p className="mb-8 text-xl font-bold text-gray-700">
                   Villains are attacking! <br/>
                   <span className="text-green-600">Fling</span> Power Foods to save the day!
                 </p>
                 <ComicButton onClick={startGame} className="w-full text-3xl py-4 group hover:scale-105 transition-transform">
                   PLAY <Play className="inline fill-current ml-2" size={28} />
                 </ComicButton>
               </div>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState.phase === GamePhase.GAME_OVER && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-50">
            <div className="bg-red-100 p-8 rounded-3xl comic-border comic-shadow text-center max-w-lg w-full animate-shake">
               <Skull size={80} className="mx-auto mb-6 text-gray-800" />
               <h2 className="text-5xl mb-2 text-red-600 comic-font comic-text-stroke">GAME OVER!</h2>
               <p className="mb-6 text-xl font-bold">The bad habits won...</p>
               <div className="bg-white p-4 rounded-xl border-2 border-black mb-8 transform -rotate-2">
                  <p className="text-gray-500 uppercase text-sm font-bold">Final Score</p>
                  <p className="text-6xl font-bold text-yellow-500 drop-shadow-md comic-font">{gameState.score}</p>
               </div>
               <ComicButton onClick={startGame} variant="primary" className="w-full">Try Again</ComicButton>
            </div>
          </div>
        )}

        {/* LOADING SCREEN */}
        {gameState.phase === GamePhase.LOADING_SCENARIO && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/50 z-40">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                <Loader2 size={100} className="animate-spin text-blue-600 relative z-10 stroke-[3px]" />
              </div>
              <h2 className="text-4xl mt-8 comic-font text-blue-800 animate-bounce comic-text-stroke-sm text-white">SUMMONING VILLAIN...</h2>
           </div>
        )}

        {/* BATTLE SCENE */}
        {(gameState.phase === GamePhase.BATTLE || gameState.phase === GamePhase.EVALUATING || gameState.phase === GamePhase.RESULT) && (
          <BattleScene 
            gameState={gameState} 
            onFoodSelect={handleFoodSelect}
            onNextRound={handleContinue}
          />
        )}
      </main>
    </div>
  );
}