import { GoogleGenAI, Type } from "@google/genai";
import { Villain, FoodItem, BattleResult } from "./types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash";

// A list of 25+ distinct themes to ensure variety in questions and speed up generation
const NUTRITION_THEMES = [
  { nutrient: "Vitamin C", villain: "The Sneezer", hint: "Boosts Immunity" },
  { nutrient: "Calcium", villain: "Captain Brittle", hint: "Builds Strong Bones" },
  { nutrient: "Iron", villain: "The Dizzler", hint: "Carries Oxygen to Blood" },
  { nutrient: "Fiber", villain: "The Clogger", hint: "Keeps Digestion Moving" },
  { nutrient: "Protein", villain: "Muscle Melter", hint: "Repairs Muscles" },
  { nutrient: "Vitamin A", villain: "Blurry Visionary", hint: "Helps Eyesight" },
  { nutrient: "Potassium", villain: "Cramp King", hint: "Stops Muscle Cramps" },
  { nutrient: "Water", villain: "Dusty Dehydrator", hint: "Hydration" },
  { nutrient: "Vitamin D", villain: "Shadow Gloom", hint: "Bone Health & Mood" },
  { nutrient: "Omega-3", villain: "Foggy Brain", hint: "Brain Power" },
  { nutrient: "Complex Carbs", villain: "Sugar Crash", hint: "Steady Energy" },
  { nutrient: "Antioxidants", villain: "Rust Monster", hint: "Protects Cells" },
  { nutrient: "Magnesium", villain: "The Twitcher", hint: "Nerve Function" },
  { nutrient: "Zinc", villain: "Scrape-Face", hint: "Wound Healing" },
  { nutrient: "Healthy Fats", villain: "The Hangry Beast", hint: "Feeling Full" },
  { nutrient: "Vitamin E", villain: "Dry Scale", hint: "Healthy Skin" },
  { nutrient: "Vitamin K", villain: "The Bleeder", hint: "Blood Clotting" },
  { nutrient: "B12", villain: "Zap-Out", hint: "Energy Production" },
  { nutrient: "Probiotics", villain: "Tummy Rumbler", hint: "Gut Health" },
  { nutrient: "Folate", villain: "The Shrinker", hint: "Cell Growth" },
  { nutrient: "Phosphorus", villain: "Tooth Decay", hint: "Strong Teeth" },
  { nutrient: "Selenium", villain: "Thyroid Thief", hint: "Metabolism" },
  { nutrient: "Copper", villain: "Pale Face", hint: "Blood Cells" },
  { nutrient: "Manganese", villain: "Weak Link", hint: "Connective Tissue" },
  { nutrient: "Choline", villain: "Memory Wiper", hint: "Memory" },
  { nutrient: "Iodine", villain: "Goiter Goblin", hint: "Thyroid Health" }
];

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Generates a villain and a set of food options (some good, some bad).
 */
export const generateScenario = async (level: number): Promise<{ villain: Villain; foods: FoodItem[] }> => {
  // Pick a random theme to force variety
  const theme = NUTRITION_THEMES[Math.floor(Math.random() * NUTRITION_THEMES.length)];

  // We provide the theme to the AI so it doesn't have to "think" of one, making it much faster.
  const prompt = `
    Create a level ${level} game scenario.
    
    THEME:
    - Villain Name: Create a name based on "${theme.villain}"
    - Villain Weakness: "${theme.nutrient}"
    
    Tasks:
    1. Create the Villain object.
    2. Create 4 foods:
       - 1 Super Effective (High in ${theme.nutrient})
       - 1 Okay (Healthy but different nutrient)
       - 2 Bad (Unhealthy/Junk food)
    
    Return JSON.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 1000,
      thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for speed
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          villain: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              weaknessHint: { type: Type.STRING, description: "The exact nutrient name needed (e.g. Vitamin C)" },
              appearance: { type: Type.STRING, description: "A single emoji representing the villain" },
              health: { type: Type.NUMBER },
            },
            required: ["name", "description", "weaknessHint", "appearance", "health"],
          },
          foods: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                emoji: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['Protein', 'Carb', 'Fruit', 'Veggie', 'Dairy', 'Junk'] },
                powerDescription: { type: Type.STRING },
              },
              required: ["id", "name", "emoji", "type", "powerDescription"],
            },
          },
        },
        required: ["villain", "foods"],
      },
    },
  });

  const data = JSON.parse(response.text || "{}");
  
  // CRITICAL: Shuffle the foods so the winner isn't always first
  if (data.foods) {
    data.foods = shuffleArray(data.foods);
  }
  
  return data;
};

/**
 * Evaluates the player's choice.
 */
export const evaluateTurn = async (villain: Villain, selectedFood: FoodItem): Promise<BattleResult> => {
  const prompt = `
    Villain Weakness: ${villain.weaknessHint}.
    Food Chosen: ${selectedFood.name} (${selectedFood.powerDescription}).
    
    Did it win? 
    - Matches weakness nutrient = true.
    - Otherwise = false.
    
    Write a short, funny 1-sentence comic book narrative about the result.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 200, // Limit tokens for speed
      thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for speed
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          damageDealt: { type: Type.NUMBER },
          narrative: { type: Type.STRING },
        },
        required: ["success", "damageDealt", "narrative"],
      },
    },
  });

  const data = JSON.parse(response.text || "{}");
  
  // Fallback logic if AI hallucinates damage values
  if (data.success) data.damageDealt = 50;
  
  return data;
};