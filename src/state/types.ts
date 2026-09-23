import { GiLevel } from '../data/foods';
import { OnboardingProfile } from '../utils/calorie';

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export interface LoggedItem {
  id: string;
  foodId: string;
  bn: string;
  en: string;
  unitEn: string;
  unitBn: string;
  qty: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  gi: GiLevel;
  confidence?: number;
}

export type DayMeals = Record<MealType, LoggedItem[]>;

export interface DayLog {
  date: string;
  meals: DayMeals;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export type SubscriptionTier = 'free' | 'monthly' | 'yearly';

export interface Subscription {
  tier: SubscriptionTier;
  scanDate: string;
  scansUsedToday: number;
}

export interface Settings {
  remindersOn: boolean;
}

export interface PersistedState {
  onboarded: boolean;
  profile: OnboardingProfile | null;
  name: string;
  logs: Record<string, DayLog>;
  weightHistory: WeightEntry[];
  subscription: Subscription;
  settings: Settings;
  targetOverride: number | null;
}

export function emptyDayMeals(): DayMeals {
  return { breakfast: [], lunch: [], snack: [], dinner: [] };
}
