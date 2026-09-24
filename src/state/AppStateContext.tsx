import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { foodById } from '../data/foods';
import { OnboardingProfile, calculateDailyTarget, macroTargets } from '../utils/calorie';
import { dateKey } from '../utils/date';
import { newId } from '../utils/id';
import { useAuth } from './AuthContext';
import { Outbox, SyncOp, applyOutbox, flushOutbox, itemOpKey, pullLogs, weightOpKey } from './logSync';
import { RemoteProfile, fetchProfile, saveProfile } from './profileSync';
import {
  DayLog, LoggedItem, MealType, PersistedState, ScanFood, ScanItem, Settings, Subscription, WeightEntry, emptyDayMeals,
} from './types';

// v1 held demo seed logs with non-uuid ids; it's dropped rather than migrated.
const STORAGE_KEY = 'calories_app_state_v2';
const LEGACY_STORAGE_KEY = 'calories_app_state_v1';
const FLUSH_DELAY_MS = 1500;
const FREE_DAILY_SCANS = 3;
const DEFAULT_DAILY_TARGET = 2100;

function defaultState(): PersistedState {
  return {
    onboarded: false,
    profile: null,
    name: '',
    logs: {},
    weightHistory: [],
    subscription: { tier: 'free', scanDate: dateKey(new Date()), scansUsedToday: 0 },
    settings: { remindersOn: true },
    targetOverride: null,
    outbox: {},
    syncedUserId: null,
  };
}

function withOps(outbox: Outbox, ops: Record<string, SyncOp>): Outbox {
  return { ...outbox, ...ops };
}

// Drop the ops that were sent, unless they've been replaced by a newer change since.
function withoutSent(outbox: Outbox, sent: Outbox): Outbox {
  const next: Outbox = {};
  for (const [key, op] of Object.entries(outbox)) {
    if (sent[key] !== op) next[key] = op;
  }
  return next;
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
  /** The server owns the scan count; mirror what analyze-meal reports. */
  setScansUsedToday: (n: number) => void;
  subscribe: (tier: 'monthly' | 'yearly') => void;
  settings: Settings;
  toggleReminders: () => void;
  resetOnboarding: () => void;
  setTargetOverride: (kcal: number | null) => void;
  resetAllData: () => void;
  /** Sends pending log/weight changes now. Resolves false if they couldn't be sent (offline). */
  syncNow: () => Promise<boolean>;
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
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    (async () => {
      try {
        AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
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

  // Flush (and optionally pull) one run at a time: a pull that overlaps a flush could
  // miss rows that were just sent and drop them from the screen.
  const runSync = useCallback((pull: boolean) => {
    const run = async () => {
      const uid = userIdRef.current;
      const s = stateRef.current;
      if (!uid || s.syncedUserId !== uid) return;
      const sent = s.outbox;
      if (Object.keys(sent).length > 0) {
        await flushOutbox(uid, sent);
        setState((cur) => ({ ...cur, outbox: withoutSent(cur.outbox, sent) }));
      }
      if (pull) {
        const remote = await pullLogs(uid);
        if (userIdRef.current !== uid) return;
        setState((cur) => {
          const merged = applyOutbox(remote.logs, remote.weights, cur.outbox);
          return { ...cur, logs: merged.logs, weightHistory: merged.weights };
        });
      }
    };
    const next = syncQueue.current.catch(() => {}).then(run);
    syncQueue.current = next;
    return next;
  }, []);

  // On sign-in, claim the local data for this account (or drop it if it belongs to a
  // different one), then send anything pending and pull the account's history.
  useEffect(() => {
    if (!ready || !userId) return;
    const s = stateRef.current;
    if (s.syncedUserId !== userId) {
      const claimed: PersistedState =
        s.syncedUserId === null
          ? { ...s, syncedUserId: userId }
          : { ...s, logs: {}, weightHistory: [], outbox: {}, syncedUserId: userId };
      stateRef.current = claimed;
      setState((cur) => ({ ...cur, logs: claimed.logs, weightHistory: claimed.weightHistory, outbox: claimed.outbox, syncedUserId: userId }));
    }
    runSync(true).catch((e) => console.warn('log sync failed', e));
  }, [ready, userId, runSync]);

  useEffect(() => {
    if (!userId || Object.keys(state.outbox).length === 0) return;
    const timer = setTimeout(() => runSync(false).catch((e) => console.warn('log flush failed', e)), FLUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state.outbox, userId, runSync]);

  // Retry pending changes when the connection comes back; pick up other devices' changes on foreground.
  useEffect(() => {
    if (!userId) return;
    const unsubscribeNet = NetInfo.addEventListener((net) => {
      if (net.isConnected) runSync(false).catch(() => {});
    });
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') runSync(true).catch((e) => console.warn('log sync failed', e));
    });
    return () => {
      unsubscribeNet();
      appStateSub.remove();
    };
  }, [userId, runSync]);

  const syncNow = useCallback(async () => {
    try {
      await runSync(false);
      return true;
    } catch {
      return false;
    }
  }, [runSync]);

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
    setState((s) => {
      const next = { ...s, onboarded: true, profile, name };
      if (s.weightHistory.length > 0) return next;
      // the onboarding weight is the first point on the weight chart
      const entry = { date: dateKey(new Date()), kg: profile.weightKg };
      return { ...next, weightHistory: [entry], outbox: withOps(s.outbox, { [weightOpKey(entry.date)]: { kind: 'weight', entry } }) };
    });
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
      const ops: Record<string, SyncOp> = {};
      for (const item of items) ops[itemOpKey(item.id)] = { kind: 'item', date: key, mealType, item };
      return { ...s, logs: { ...s.logs, [key]: { ...existing, meals } }, outbox: withOps(s.outbox, ops) };
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
        return {
          ...s,
          logs: { ...s.logs, [key]: { ...day, meals: { ...day.meals, [mealType]: nextItems } } },
          outbox: withOps(s.outbox, { [itemOpKey(itemId)]: { kind: 'deleteItem', id: itemId } }),
        };
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
      const current = day.meals[mealType].find((it) => it.id === itemId);
      if (!current) return s;
      const updated = withQty(current, qty);
      const items = day.meals[mealType].map((it) => (it.id === itemId ? updated : it));
      return {
        ...s,
        logs: { ...s.logs, [key]: { ...day, meals: { ...day.meals, [mealType]: items } } },
        outbox: withOps(s.outbox, { [itemOpKey(itemId)]: { kind: 'item', date: key, mealType, item: updated } }),
      };
    });
  }, []);

  const undoDelete = useCallback(() => {
    const pending = pendingDelete.current;
    if (!pending) return;
    setState((s) => {
      const day = s.logs[pending.date] || { date: pending.date, meals: emptyDayMeals() };
      const items = [...day.meals[pending.mealType]];
      items.splice(Math.min(pending.index, items.length), 0, pending.item);
      return {
        ...s,
        logs: { ...s.logs, [pending.date]: { ...day, meals: { ...day.meals, [pending.mealType]: items } } },
        outbox: withOps(s.outbox, {
          [itemOpKey(pending.item.id)]: { kind: 'item', date: pending.date, mealType: pending.mealType, item: pending.item },
        }),
      };
    });
    dismissToast();
  }, [dismissToast]);

  const addWeight = useCallback((kg: number) => {
    const key = dateKey(new Date());
    setState((s) => {
      const entry = { date: key, kg };
      const withoutToday = s.weightHistory.filter((w) => w.date !== key);
      return {
        ...s,
        weightHistory: [...withoutToday, entry],
        outbox: withOps(s.outbox, { [weightOpKey(key)]: { kind: 'weight', entry } }),
      };
    });
  }, []);

  const canScan = useCallback(() => {
    const sub = ensureFreshScanCount(state.subscription);
    return sub.tier !== 'free' || sub.scansUsedToday < FREE_DAILY_SCANS;
  }, [state.subscription]);

  const setScansUsedToday = useCallback((n: number) => {
    setState((s) => ({ ...s, subscription: { ...ensureFreshScanCount(s.subscription), scansUsedToday: n } }));
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
    setScansUsedToday,
    subscribe,
    settings: state.settings,
    toggleReminders,
    resetOnboarding,
    setTargetOverride,
    resetAllData,
    syncNow,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function perUnitOf(item: LoggedItem): NonNullable<LoggedItem['perUnit']> {
  if (item.perUnit) return item.perUnit;
  const f = foodById(item.foodId);
  if (f) return { kcal: f.kcalPerUnit, proteinG: f.proteinG, carbsG: f.carbsG, fatG: f.fatG };
  // last resort for old items: derive from the rounded totals
  const q = item.qty || 1;
  return { kcal: item.kcal / q, proteinG: item.proteinG / q, carbsG: item.carbsG / q, fatG: item.fatG / q };
}

export function withQty(item: LoggedItem, qty: number): LoggedItem {
  const u = perUnitOf(item);
  return {
    ...item,
    qty,
    kcal: Math.round(u.kcal * qty),
    proteinG: Math.round(u.proteinG * qty),
    carbsG: Math.round(u.carbsG * qty),
    fatG: Math.round(u.fatG * qty),
  };
}

/** A new log entry for any `foods` row (curated dish, scan result or search result). */
export function foodItem(food: ScanFood, qty: number, confidence?: number): LoggedItem {
  const item: LoggedItem = {
    id: newId(),
    foodId: food.id,
    en: food.en,
    bn: food.bn ?? food.en,
    unitEn: food.unitEn,
    unitBn: food.unitBn ?? food.unitEn,
    qty,
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    gi: food.gi,
    perUnit: { kcal: food.kcalPerUnit, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG },
  };
  if (confidence !== undefined) item.confidence = confidence;
  return withQty(item, qty);
}

export function scanItemToLoggedItem({ food, qty, confidence }: ScanItem): LoggedItem {
  return foodItem(food, qty, confidence);
}

/** Log the same food again (recent/frequent chips): one unit, fresh id, no scan confidence. */
export function repeatItem(item: LoggedItem): LoggedItem {
  const { confidence: _confidence, ...rest } = withQty(item, 1);
  return { ...rest, perUnit: perUnitOf(item), id: newId() };
}
