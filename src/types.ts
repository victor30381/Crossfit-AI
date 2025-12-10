export type NutritionGoal = 'lose_weight' | 'gain_muscle' | 'maintain' | 'performance';

export interface DietPlan {
  goal: NutritionGoal;
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: {
    name: string;
    description: string;
    calories: number;
  }[];
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: 'male' | 'female' | 'other';
  fitnessLevel: 'principiante' | 'intermedio' | 'avanzado' | 'experto' | 'master';
  xp: number;
  levelProgress: number; // 0-100
  lastActiveDate?: string;
  lastPenaltyDate?: string;
  isRegistered?: boolean;
  avatar?: string;
  language?: 'es' | 'en';
  country?: string;
  equipment?: string[];
  nutritionGoal?: NutritionGoal;
  dietPlan?: DietPlan;
  weightHistory?: WeightLog[];
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO date string
  name: string;
  description: string;
  calories: number;
  durationMinutes: number;
  type: 'image-scan' | 'manual' | 'home-ai';
  exercises?: { name: string; weight?: string; reps?: string }[];
  xpEarned?: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionLog {
  id: string;
  date: string;
  mealType: MealType;
  imageUrl?: string;
  foodItems: string[];
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  tips: string;
  description?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    bg: string;
    card: string;
    text: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'neon-red',
    name: 'Neon Red',
    colors: { primary: '#ff0033', secondary: '#99001f', bg: '#000000', card: '#111111', text: '#ffffff' }
  },
  {
    id: 'neon-orange',
    name: 'Neon Orange',
    colors: { primary: '#ff6600', secondary: '#993d00', bg: '#000000', card: '#111111', text: '#ffffff' }
  },
  {
    id: 'neon-fuchsia',
    name: 'Neon Fuchsia',
    colors: { primary: '#ff00ff', secondary: '#990099', bg: '#000000', card: '#111111', text: '#ffffff' }
  },
  {
    id: 'neon-lilac',
    name: 'Neon Lilac',
    colors: { primary: '#cc99ff', secondary: '#7a5c99', bg: '#000000', card: '#111111', text: '#ffffff' }
  },
  {
    id: 'neon-green',
    name: 'Neon Green',
    colors: { primary: '#39ff14', secondary: '#1f8c0b', bg: '#000000', card: '#111111', text: '#ffffff' }
  },
  {
    id: 'neon-cyan',
    name: 'Neon Cyan',
    colors: { primary: '#00ffff', secondary: '#009999', bg: '#000000', card: '#111111', text: '#ffffff' }
  }
];