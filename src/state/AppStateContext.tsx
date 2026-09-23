import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { foodById } from '../data/foods';
import { OnboardingProfile, calculateDailyTarget, macroTargets } from '../utils/calorie';
import { dateKey } from '../utils/date';
import { useAuth } from './AuthContext';
import { RemoteProfile, fetchProfile, saveProfile } from './profileSync';
import { buildSeedLogs, buildSeedWeights } from './seed';
import {
  DayLog, LoggedItem, MealType, PersistedState, Settings, Subscription, WeightEntry, emptyDayMeals,
} from './types';

const STORAGE_KEY = 'calories_app_state_v1';
const FREE_DAILY_SCANS = 3;
const DEFAULT_DAILY_TARGET = 2100;

function defaultState(): PersistedState {
  return {
    onboarded: false,
    profile: null,
    name: '',
    logs: buildSeedLogs(),
    weightHistory: buildSeedWeights(71.4),
    subscription: { tier: 'free', scanDate: dateKey(new Date()), scansUsedToday: 0 },
    settings: { remindersOn: true },
    targetOverride: null,
  };
}

export function totalsForDay(day: DayLog | undefined) {
  const totals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  if (!day) return totals;
  for (const items of Object.values(day.meals)) {
    for (const it of items) {
      totals.kcal += it.kcal;
      totals.proteinG += it.proteinG;
      totals.carbsG += it.carbsG;
      totals.fatG += it.fatG;
    }
  }
  return totals;
}

interface PendingDelete {
  mealType: MealType;
  item: LoggedItem;
  date: string;
  index: number;
}

interface AppStateValue {
  ready: boolean;
  /** True once the signed-in user's profile has been pulled from (or pushed to) Supabase. */
  profileSynced: boolean;
  onboarded: boolean;
  profile: OnboardingProfile | null;
  name: string;
  completeOnboarding: (profile: OnboardingProfile, name: string) => void;
  diabetic: boolean;
  dailyTarget: number;
  macroGoals: { protein: number; carbs: number; fat: number };
  todayKey: string;
  logs: Record<string, DayLog>;
  todayTotals: ReturnType<typeof totalsForDay>;
  addItems: (mealType: MealType, items: LoggedItem[]) => void;
  removeItem: (mealType: MealType, itemId: string) => void;
  updateItemQty: (mealType: MealType, itemId: string, qty: number) => void;
  deletePending: boolean;
  undoDelete: () => void;
  dismissToast: () => void;
  streak: number;
  weightHistory: WeightEntry[];
  addWeight: (kg: number) => void;
  subscription: Subscription;
  scansLeftToday: number;
  canScan: () => boolean;
  useScan: () => void;
  subscribe: (tier: 'monthly' | 'yearly') => void;
  settings: Settings;
  toggleReminders: () => void;
  resetOnboarding: () => void;
  setTargetOverride: (kcal: number | null) => void;
  resetAllData: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function ensureFreshScanCount(sub: Subscription): Subscription {
  const today = dateKey(new Date());
  if (sub.scanDate !== today) return { ...sub, scanDate: today, scansUsedToday: 0 };
  return sub;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [ready, setReady] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const pendingDelete = useRef<PendingDelete | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [profileSynced, setProfileSynced] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedState;
          setState({ ...defaultState(), ...parsed, subscription: ensureFreshScanCount(parsed.subscription) });
        }
      } catch {
        // corrupt or unavailable storage — fall back to the seeded default state
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  // On sign-in: an onboarded remote profile wins (new device / reinstall); otherwise push
  // whatever this device already has so pre-auth users don't lose their onboarding.
  useEffect(() => {
    if (!ready || !userId) {
      setProfileSynced(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchProfile(userId);
        if (cancelled) return;
        if (remote?.onboarded) {
          setState((s) => ({
            ...s,
            onboarded: true,
            profile: remote.profile,
            name: remote.name,
            targetOverride: remote.targetOverride,
            settings: { ...s.settings, remindersOn: remote.remindersOn },
          }));
        } else if (stateRef.current.onboarded) {
          const s = stateRef.current;
          await saveProfile(userId, {
            onboarded: true,
            profile: s.profile,
            name: s.name,
            targetOverride: s.targetOverride,
            remindersOn: s.settings.remindersOn,
          });
        }
      } catch (e) {
        // offline or Supabase down: keep using the local copy, retry on next launch
        console.warn('profile sync failed', e);
      } finally {
        if (!cancelled) setProfileSynced(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, userId]);

  const pushProfile = useCallback(
    (patch: Partial<RemoteProfile>) => {
      if (!userId) return;
      saveProfile(userId, patch).catch((e) => console.warn('profile save failed', e));
    },
    [userId]
  );

  const todayKey = dateKey(new Date());
  const diabetic = state.profile?.diabetic === 'yes';
  const dailyTarget = state.targetOverride ?? (state.profile ? calculateDailyTarget(state.profile) : DEFAULT_DAILY_TARGET);
  const macroGoals = macroTargets(dailyTarget, diabetic);
  const todayTotals = totalsForDay(state.logs[todayKey]);

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();
    const hasToday = totalsForDay(state.logs[dateKey(cursor)]).kcal > 0;
    if (!hasToday) cursor.setDate(cursor.getDate() - 1);
    while (true) {
      const key = dateKey(cursor);
      if (totalsForDay(state.logs[key]).kcal > 0) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return count;
  }, [state.logs, todayKey]);

  const completeOnboarding = useCallback((profile: OnboardingProfile, name: string) => {
    setState((s) => ({ ...s, onboarded: true, profile, name }));
    pushProfile({ onboarded: true, profile, name });
  }, [pushProfile]);

  const resetOnboarding = useCallback(() => {
    setState((s) => ({ ...s, onboarded: false }));
  }, []);

  const showDeleteToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setDeletePending(true);
    toastTimer.current = setTimeout(() => {
      setDeletePending(false);
      pendingDelete.current = null;
    }, 4000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setDeletePending(false);
    pendingDelete.current = null;
  }, []);

  const addItems = useCallback((mealType: MealType, items: LoggedItem[]) => {
    setState((s) => {
      const key = dateKey(new Date());
      const existing: DayLog = s.logs[key] || { date: key, meals: emptyDayMeals() };
      const meals = { ...existing.meals, [mealType]: [...existing.meals[mealType], ...items] };
      return { ...s, logs: { ...s.logs, [key]: { ...existing, meals } } };
    });
  }, []);

  const removeItem = useCallback(
    (mealType: MealType, itemId: string) => {
      const key = dateKey(new Date());
      setState((s) => {
        const day = s.logs[key];
        if (!day) return s;
        const idx = day.meals[mealType].findIndex((it) => it.id === itemId);
        if (idx === -1) return s;
        const item = day.meals[mealType][idx];
        pendingDelete.current = { mealType, item, date: key, index: idx };
        const nextItems = day.meals[mealType].filter((it) => it.id !== itemId);
        return { ...s, logs: { ...s.logs, [key]: { ...day, meals: { ...day.meals, [mealType]: nextItems } } } };
      });
      showDeleteToast();
    },
    [showDeleteToast]
  );

  const updateItemQty = useCallback((mealType: MealType, itemId: string, qty: number) => {
    setState((s) => {
      const key = dateKey(new Date());
      const day = s.logs[key];
      if (!day) return s;
      const food = foodById(day.meals[mealType].find((it) => it.id === itemId)?.foodId || '');
      if (!food) return s;
      const items = day.meals[mealType].map((it) =>
        it.id === itemId
          ? { ...it, qty, kcal: Math.round(food.kcalPerUnit * qty), proteinG: Math.round(food.proteinG * qty), carbsG: Math.round(food.carbsG * qty), fatG: Math.round(food.fatG * qty) }
          : it
      );
      return { ...s, logs: { ...s.logs, [key]: { ...day, meals: { ...day.meals, [mealType]: items } } } };
    });
  }, []);

  const undoDelete = useCallback(() => {
    const pending = pendingDelete.current;
    if (!pending) return;
    setState((s) => {
      const day = s.logs[pending.date] || { date: pending.date, meals: emptyDayMeals() };
      const items = [...day.meals[pending.mealType]];
      items.splice(Math.min(pending.index, items.length), 0, pending.item);
      return { ...s, logs: { ...s.logs, [pending.date]: { ...day, meals: { ...day.meals, [pending.mealType]: items } } } };
    });
    dismissToast();
  }, [dismissToast]);

  const addWeight = useCallback((kg: number) => {
    const key = dateKey(new Date());
    setState((s) => {
      const withoutToday = s.weightHistory.filter((w) => w.date !== key);
      return { ...s, weightHistory: [...withoutToday, { date: key, kg }] };
    });
  }, []);

  const canScan = useCallback(() => {
    const sub = ensureFreshScanCount(state.subscription);
    return sub.tier !== 'free' || sub.scansUsedToday < FREE_DAILY_SCANS;
  }, [state.subscription]);

  const useScan = useCallback(() => {
    setState((s) => {
      const sub = ensureFreshScanCount(s.subscription);
      return { ...s, subscription: { ...sub, scansUsedToday: sub.scansUsedToday + 1 } };
    });
  }, []);

  const subscribe = useCallback((tier: 'monthly' | 'yearly') => {
    setState((s) => ({ ...s, subscription: { ...s.subscription, tier } }));
  }, []);

  const toggleReminders = useCallback(() => {
    const remindersOn = !stateRef.current.settings.remindersOn;
    setState((s) => ({ ...s, settings: { ...s.settings, remindersOn } }));
    pushProfile({ remindersOn });
  }, [pushProfile]);

  const setTargetOverride = useCallback((kcal: number | null) => {
    setState((s) => ({ ...s, targetOverride: kcal }));
    pushProfile({ targetOverride: kcal });
  }, [pushProfile]);

  const resetAllData = useCallback(() => {
    setState(defaultState());
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const freshSub = ensureFreshScanCount(state.subscription);
  const scansLeftToday = Math.max(0, FREE_DAILY_SCANS - freshSub.scansUsedToday);

  const value: AppStateValue = {
    ready,
    profileSynced,
    onboarded: state.onboarded,
    profile: state.profile,
    name: state.name,
    completeOnboarding,
    diabetic,
    dailyTarget,
    macroGoals,
    todayKey,
    logs: state.logs,
    todayTotals,
    addItems,
    removeItem,
    updateItemQty,
    deletePending,
    undoDelete,
    dismissToast,
    streak,
    weightHistory: state.weightHistory,
    addWeight,
    subscription: freshSub,
    scansLeftToday,
    canScan,
    useScan,
    subscribe,
    settings: state.settings,
    toggleReminders,
    resetOnboarding,
    setTargetOverride,
    resetAllData,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function foodToLoggedItem(foodId: string, qty: number, confidence?: number): LoggedItem {
  const f = foodById(foodId)!;
  return {
    id: `${foodId}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    foodId: f.id,
    bn: f.bn,
    en: f.en,
    unitEn: f.unitEn,
    unitBn: f.unitBn,
    qty,
    kcal: Math.round(f.kcalPerUnit * qty),
    proteinG: Math.round(f.proteinG * qty),
    carbsG: Math.round(f.carbsG * qty),
    fatG: Math.round(f.fatG * qty),
    gi: f.gi,
    confidence,
  };
}
