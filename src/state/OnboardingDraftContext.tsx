import React, { createContext, useContext, useState } from 'react';
import { ActivityLevel, Goal, Sex } from '../utils/calorie';

interface OnboardingDraft {
  goal: Goal;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  diabetic: 'yes' | 'no' | 'unsure';
  name: string;
}

interface OnboardingDraftValue {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}

const defaultDraft: OnboardingDraft = {
  goal: 'lose',
  age: 34,
  sex: 'female',
  heightCm: 158,
  weightKg: 72.6,
  activity: 2,
  diabetic: 'yes',
  name: '',
};

const OnboardingDraftContext = createContext<OnboardingDraftValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);
  const update = (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch }));
  return <OnboardingDraftContext.Provider value={{ draft, update }}>{children}</OnboardingDraftContext.Provider>;
}

export function useOnboardingDraft() {
  const ctx = useContext(OnboardingDraftContext);
  if (!ctx) throw new Error('useOnboardingDraft must be used within OnboardingDraftProvider');
  return ctx;
}
