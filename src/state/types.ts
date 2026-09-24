import { GiLevel } from '../data/foods';
import { OnboardingProfile } from '../utils/calorie';
import type { Outbox } from './logSync';

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
  // null for composition-table foods (BFCT/USDA have no glycemic index)
  gi: GiLevel | null;
  confidence?: number;
  // Nutrition for qty = 1, kept so portions can be edited for foods that aren't
  // in the bundled FOODS list (scan results from the full database).
  perUnit?: { kcal: number; proteinG: number; carbsG: number; fatG: number };
}

// Any row in `foods` as the app uses it: scan results, search results, and the
// curated dishes bundled in src/data/foods.ts.
export interface ScanFood {
  id: string;
  en: string;
  bn: string | null;
  unitEn: string;
  unitBn: string | null;
  kcalPerUnit: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  gi: GiLevel | null;
}

export interface ScanItem {
  food: ScanFood;
  qty: number;
  confidence: number;
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
  /** Log/weight changes not yet sent to Supabase. */
  outbox: Outbox;
  /** The account the local logs belong to; null until the first sign-in claims them. */
  syncedUserId: string | null;
}

export function emptyDayMeals(): DayMeals {
  return { breakfast: [], lunch: [], snack: [], dinner: [] };
}
