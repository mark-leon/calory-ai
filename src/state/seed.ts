import { foodById } from '../data/foods';
import { dateKey } from '../utils/date';
import { DayLog, LoggedItem, MealType, WeightEntry, emptyDayMeals } from './types';

let seedCounter = 0;
function seedId(): string {
  seedCounter += 1;
  return `seed-${seedCounter}`;
}

function item(foodId: string, qty: number): LoggedItem {
  const f = foodById(foodId)!;
  return {
    id: seedId(),
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
  };
}

// A week of plausible logging history so Progress and the streak don't start
// from a cold, empty product — today itself stays empty until the user logs.
const HISTORY_PLAN: Partial<Record<MealType, [string, number][]>>[] = [
  { breakfast: [['porota', 2], ['tea-milk', 1]], lunch: [['rice', 1], ['dal-red', 1], ['bhorta-alu', 1]], snack: [['singara', 1]], dinner: [['rice', 1], ['chicken-curry', 1]] },
  { breakfast: [['tea-milk', 1]], lunch: [['khichuri-hilsa', 1]], snack: [['mishti-doi', 1]], dinner: [['rice', 1], ['dal-mug', 1], ['mixed-veg', 1]] },
  { breakfast: [['porota', 1], ['tea-milk', 1]], lunch: [['rice', 1], ['rui-curry', 1], ['shak', 1]], snack: [['piyaju', 2]], dinner: [['khichuri-bhuna', 1]] },
  { breakfast: [['tea-milk', 2]], lunch: [['rice', 1], ['beef-bhuna', 1], ['dal-red', 1]], snack: [['roshogolla', 2]], dinner: [['rice', 1], ['chicken-curry', 1], ['mixed-veg', 1]] },
  { breakfast: [['porota', 2], ['tea-milk', 1]], lunch: [['khichuri-egg', 1], ['bhorta-begun', 1]], snack: [['chanachur', 1]], dinner: [['rice', 1], ['dal-red', 1]] },
  { breakfast: [['tea-milk', 1]], lunch: [['rice', 1.5], ['hilsa-fried', 1], ['bhorta-alu', 1], ['dal-red', 1]], snack: [['singara', 1], ['lassi', 1]], dinner: [['rice', 1], ['beef-bhuna', 1]] },
];

export function buildSeedLogs(daysBack = 6): Record<string, DayLog> {
  const logs: Record<string, DayLog> = {};
  const today = new Date();
  for (let i = 1; i <= daysBack; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const plan = HISTORY_PLAN[i - 1] || HISTORY_PLAN[HISTORY_PLAN.length - 1];
    const meals = emptyDayMeals();
    for (const mt of ['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]) {
      const entries = plan[mt] || [];
      meals[mt] = entries.map(([foodId, qty]) => item(foodId, qty));
    }
    logs[key] = { date: key, meals };
  }
  return logs;
}

export function buildSeedWeights(latestKg: number, daysBack = 6): WeightEntry[] {
  const steps = [1.2, 1.0, 0.8, 0.55, 0.3, 0.15, 0];
  const today = new Date();
  const entries: WeightEntry[] = [];
  for (let i = daysBack; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const stepIdx = Math.min(steps.length - 1, daysBack - i);
    entries.push({ date: dateKey(d), kg: Math.round((latestKg + steps[stepIdx]) * 10) / 10 });
  }
  return entries;
}
