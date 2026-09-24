import { FoodDef } from '../data/foods';
import { ScanFood } from '../state/types';
import { supabase } from './supabase';

interface FoodRow {
  id: string;
  bn: string | null;
  en: string;
  unit_en: string | null;
  unit_bn: string | null;
  kcal_per_unit: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  gi: ScanFood['gi'];
}

export function curatedFood(f: FoodDef): ScanFood {
  return {
    id: f.id,
    en: f.en,
    bn: f.bn,
    unitEn: f.unitEn,
    unitBn: f.unitBn,
    kcalPerUnit: f.kcalPerUnit,
    proteinG: f.proteinG,
    carbsG: f.carbsG,
    fatG: f.fatG,
    gi: f.gi,
  };
}

// BFCT names carry trailing spaces and "*" markers (e.g. "Ruti*").
function cleanName(en: string): string {
  return en.trim().replace(/\*+$/, '').trim();
}

/** Composition-table foods (BFCT/USDA) matching the query; curated dishes are searched locally. */
export async function searchDatabaseFoods(q: string): Promise<ScanFood[]> {
  const { data, error } = await supabase.rpc('search_foods', { q, max_results: 20 });
  if (error) throw error;
  return ((data ?? []) as FoodRow[]).map((f) => ({
    id: f.id,
    en: cleanName(f.en),
    bn: f.bn,
    unitEn: f.unit_en ?? '100 g',
    unitBn: f.unit_bn,
    kcalPerUnit: Number(f.kcal_per_unit),
    proteinG: Number(f.protein_g),
    carbsG: Number(f.carbs_g),
    fatG: Number(f.fat_g),
    gi: f.gi,
  }));
}
