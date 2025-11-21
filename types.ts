export enum GamePhase {
  START = 'START',
  LOADING_SCENARIO = 'LOADING_SCENARIO',
  BATTLE = 'BATTLE',
  EVALUATING = 'EVALUATING',
  RESULT = 'RESULT',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Villain {
  name: string;
  description: string;
  weaknessHint: string; // e.g. "I hate Fiber!"
  appearance: string; // emoji or description
  health: number;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  type: 'Protein' | 'Carb' | 'Fruit' | 'Veggie' | 'Dairy' | 'Junk';
  powerDescription: string; // e.g. "High in Vitamin C!"
}

export interface BattleResult {
  success: boolean;
  damageDealt: number;
  narrative: string; // "Kapow! The orange juice boosted your immunity..."
}

export interface GameState {
  phase: GamePhase;
  score: number;
  level: number;
  heroHealth: number;
  currentVillain: Villain | null;
  currentFoods: FoodItem[];
  lastResult: BattleResult | null;
}