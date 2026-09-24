import { supabase } from '../lib/supabase';
import { DayLog, LoggedItem, MealType, WeightEntry, emptyDayMeals } from './types';

// Local changes waiting to reach Supabase. Keyed so a later change to the same row
// replaces an earlier one (edit after add, undo after delete, re-weigh the same day).
export type SyncOp =
  | { kind: 'item'; date: string; mealType: MealType; item: LoggedItem }
  | { kind: 'deleteItem'; id: string }
  | { kind: 'weight'; entry: WeightEntry };

export type Outbox = Record<string, SyncOp>;

export const itemOpKey = (id: string) => `item:${id}`;
export const weightOpKey = (date: string) => `weight:${date}`;

// Custom foods have no catalog row; they're stored with food_id null.
const CUSTOM_FOOD_ID = 'custom';
const PAGE_SIZE = 1000;

interface LoggedItemRow {
  id: string;
  log_date: string;
  meal_type: MealType;
  food_id: string | null;
  bn: string;
  en: string;
  unit_en: string;
  unit_bn: string;
  qty: number | string;
  kcal: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  gi: LoggedItem['gi'];
  confidence: number | string | null;
  per_unit_kcal: number | string | null;
  per_unit_protein_g: number | string | null;
  per_unit_carbs_g: number | string | null;
  per_unit_fat_g: number | string | null;
}

interface WeightRow {
  entry_date: string;
  kg: number | string;
}

const ITEM_COLUMNS =
  'id, log_date, meal_type, food_id, bn, en, unit_en, unit_bn, qty, kcal, protein_g, carbs_g, fat_g, gi, confidence, per_unit_kcal, per_unit_protein_g, per_unit_carbs_g, per_unit_fat_g';

function toItemRow(userId: string, date: string, mealType: MealType, it: LoggedItem) {
  return {
    id: it.id,
    user_id: userId,
    log_date: date,
    meal_type: mealType,
    food_id: it.foodId === CUSTOM_FOOD_ID ? null : it.foodId,
    bn: it.bn,
    en: it.en,
    unit_en: it.unitEn,
    unit_bn: it.unitBn,
    qty: it.qty,
    kcal: it.kcal,
    protein_g: it.proteinG,
    carbs_g: it.carbsG,
    fat_g: it.fatG,
    gi: it.gi,
    confidence: it.confidence ?? null,
    per_unit_kcal: it.perUnit?.kcal ?? null,
    per_unit_protein_g: it.perUnit?.proteinG ?? null,
    per_unit_carbs_g: it.perUnit?.carbsG ?? null,
    per_unit_fat_g: it.perUnit?.fatG ?? null,
  };
}

// PostgREST returns numeric columns as strings.
function fromItemRow(row: LoggedItemRow): { date: string; mealType: MealType; item: LoggedItem } {
  const item: LoggedItem = {
    id: row.id,
    foodId: row.food_id ?? CUSTOM_FOOD_ID,
    bn: row.bn,
    en: row.en,
    unitEn: row.unit_en,
    unitBn: row.unit_bn,
    qty: Number(row.qty),
    kcal: Number(row.kcal),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
    gi: row.gi,
  };
  if (row.confidence != null) item.confidence = Number(row.confidence);
  if (row.per_unit_kcal != null) {
    item.perUnit = {
      kcal: Number(row.per_unit_kcal),
      proteinG: Number(row.per_unit_protein_g ?? 0),
      carbsG: Number(row.per_unit_carbs_g ?? 0),
      fatG: Number(row.per_unit_fat_g ?? 0),
    };
  }
  return { date: row.log_date, mealType: row.meal_type, item };
}

/** Sends every op in the outbox. All writes are idempotent, so a failed flush is simply retried. */
export async function flushOutbox(userId: string, outbox: Outbox): Promise<void> {
  const upserts = [];
  const deletes: string[] = [];
  const weights = [];
  for (const op of Object.values(outbox)) {
    if (op.kind === 'item') upserts.push(toItemRow(userId, op.date, op.mealType, op.item));
    else if (op.kind === 'deleteItem') deletes.push(op.id);
    else weights.push({ user_id: userId, entry_date: op.entry.date, kg: op.entry.kg });
  }
  if (upserts.length) {
    const { error } = await supabase.from('logged_items').upsert(upserts, { onConflict: 'id' });
    if (error) throw error;
  }
  if (deletes.length) {
    const { error } = await supabase.from('logged_items').delete().in('id', deletes);
    if (error) throw error;
  }
  if (weights.length) {
    const { error } = await supabase.from('weight_entries').upsert(weights, { onConflict: 'user_id,entry_date' });
    if (error) throw error;
  }
}

async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

export async function pullLogs(userId: string): Promise<{ logs: Record<string, DayLog>; weights: WeightEntry[] }> {
  const [itemRows, weightRows] = await Promise.all([
    fetchAll<LoggedItemRow>((from, to) =>
      supabase.from('logged_items').select(ITEM_COLUMNS).eq('user_id', userId).order('created_at').order('id').range(from, to)
    ),
    fetchAll<WeightRow>((from, to) =>
      supabase.from('weight_entries').select('entry_date, kg').eq('user_id', userId).order('entry_date').range(from, to)
    ),
  ]);

  const logs: Record<string, DayLog> = {};
  for (const row of itemRows) {
    const { date, mealType, item } = fromItemRow(row);
    const day = (logs[date] ??= { date, meals: emptyDayMeals() });
    day.meals[mealType].push(item);
  }
  const weights = weightRows.map((w) => ({ date: w.entry_date, kg: Number(w.kg) }));
  return { logs, weights };
}

function withoutItem(logs: Record<string, DayLog>, id: string): Record<string, DayLog> {
  const next: Record<string, DayLog> = {};
  for (const [date, day] of Object.entries(logs)) {
    const meals = emptyDayMeals();
    for (const mealType of Object.keys(day.meals) as MealType[]) {
      meals[mealType] = day.meals[mealType].filter((it) => it.id !== id);
    }
    next[date] = { ...day, meals };
  }
  return next;
}

/** Server data with the not-yet-sent local changes applied on top. */
export function applyOutbox(
  logs: Record<string, DayLog>,
  weights: WeightEntry[],
  outbox: Outbox
): { logs: Record<string, DayLog>; weights: WeightEntry[] } {
  let nextLogs = logs;
  let nextWeights = weights;
  for (const op of Object.values(outbox)) {
    if (op.kind === 'weight') {
      nextWeights = [...nextWeights.filter((w) => w.date !== op.entry.date), op.entry];
    } else if (op.kind === 'deleteItem') {
      nextLogs = withoutItem(nextLogs, op.id);
    } else {
      const day = nextLogs[op.date] ?? { date: op.date, meals: emptyDayMeals() };
      const list = day.meals[op.mealType];
      const idx = list.findIndex((it) => it.id === op.item.id);
      const nextList = idx === -1 ? [...list, op.item] : list.map((it, i) => (i === idx ? op.item : it));
      nextLogs = { ...nextLogs, [op.date]: { ...day, meals: { ...day.meals, [op.mealType]: nextList } } };
    }
  }
  return { logs: nextLogs, weights: nextWeights };
}
