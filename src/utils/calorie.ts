export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 1 | 2 | 3 | 4;

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  1: 1.2, // desk job, little walking
  2: 1.375, // some walking, exercise 1-2x/week
  3: 1.55, // regular walking, exercise 3-4x/week
  4: 1.725, // physical labour or daily gym
};

const GOAL_ADJUSTMENT_KCAL = 400;

export interface OnboardingProfile {
  goal: Goal;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  diabetic: 'yes' | 'no' | 'unsure';
}

// Mifflin-St Jeor BMR, matching the plain-language explanation shown on the
// onboarding result screen ("BMR ... activity ... +/- 400 kcal a day").
export function calculateBmr(profile: Pick<OnboardingProfile, 'age' | 'sex' | 'heightCm' | 'weightKg'>): number {
  const { age, sex, heightCm, weightKg } = profile;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTdee(profile: Pick<OnboardingProfile, 'age' | 'sex' | 'heightCm' | 'weightKg' | 'activity'>): number {
  return calculateBmr(profile) * ACTIVITY_MULTIPLIER[profile.activity];
}

export function calculateDailyTarget(profile: OnboardingProfile): number {
  const tdee = calculateTdee(profile);
  if (profile.goal === 'lose') return Math.round((tdee - GOAL_ADJUSTMENT_KCAL) / 10) * 10;
  if (profile.goal === 'gain') return Math.round((tdee + GOAL_ADJUSTMENT_KCAL) / 10) * 10;
  return Math.round(tdee / 10) * 10;
}

export function macroTargets(dailyTarget: number, diabetic: boolean) {
  // Diabetic users see carbs first per the brief; split stays 20P/50C/30F either way.
  const proteinPct = 0.2;
  const carbPct = diabetic ? 0.45 : 0.5;
  const fatPct = diabetic ? 0.35 : 0.3;
  return {
    protein: Math.round((dailyTarget * proteinPct) / 4),
    carbs: Math.round((dailyTarget * carbPct) / 4),
    fat: Math.round((dailyTarget * fatPct) / 9),
  };
}

export const GOAL_ADJUSTMENT = GOAL_ADJUSTMENT_KCAL;
