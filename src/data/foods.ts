export type FoodCategory =
  | 'rice' | 'dal' | 'bhorta' | 'fish' | 'meat' | 'vegetables' | 'snacks' | 'sweets' | 'drinks' | 'packaged';

export type GiLevel = 'low' | 'medium' | 'high';

export interface FoodDef {
  id: string;
  bn: string;
  en: string;
  category: FoodCategory;
  kcalPerUnit: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  unitEn: string;
  unitBn: string;
  gi: GiLevel;
}

export const CATEGORY_ORDER: FoodCategory[] = [
  'rice', 'dal', 'bhorta', 'fish', 'meat', 'vegetables', 'snacks', 'sweets', 'drinks', 'packaged',
];

export const FOODS: FoodDef[] = [
  { id: 'rice', bn: 'ভাত', en: 'Steamed rice', category: 'rice', kcalPerUnit: 240, proteinG: 4, carbsG: 53, fatG: 0.5, unitEn: 'plate', unitBn: 'প্লেট', gi: 'high' },
  { id: 'khichuri-bhuna', bn: 'খিচুড়ি — ভুনা', en: 'Khichuri, bhuna', category: 'rice', kcalPerUnit: 310, proteinG: 9, carbsG: 48, fatG: 8, unitEn: 'plate', unitBn: 'প্লেট', gi: 'high' },
  { id: 'khichuri-thin', bn: 'খিচুড়ি — পাতলা', en: 'Khichuri, thin', category: 'rice', kcalPerUnit: 180, proteinG: 6, carbsG: 30, fatG: 4, unitEn: 'bowl', unitBn: 'বাটি', gi: 'medium' },
  { id: 'khichuri-hilsa', bn: 'খিচুড়ি ও ইলিশ ভাজা', en: 'Khichuri with fried hilsa', category: 'rice', kcalPerUnit: 520, proteinG: 22, carbsG: 52, fatG: 24, unitEn: 'plate', unitBn: 'প্লেট', gi: 'high' },
  { id: 'khichuri-egg', bn: 'ডিম খিচুড়ি', en: 'Egg khichuri', category: 'rice', kcalPerUnit: 365, proteinG: 14, carbsG: 46, fatG: 13, unitEn: 'plate', unitBn: 'প্লেট', gi: 'high' },
  { id: 'porota', bn: 'পরোটা', en: 'Paratha', category: 'rice', kcalPerUnit: 170, proteinG: 3, carbsG: 20, fatG: 8, unitEn: 'piece', unitBn: 'পিস', gi: 'high' },

  { id: 'dal-red', bn: 'মসুর ডাল', en: 'Red lentil dal', category: 'dal', kcalPerUnit: 130, proteinG: 8, carbsG: 18, fatG: 3, unitEn: 'bowl', unitBn: 'বাটি', gi: 'low' },
  { id: 'dal-mug', bn: 'মুগ ডাল', en: 'Mung dal', category: 'dal', kcalPerUnit: 145, proteinG: 9, carbsG: 20, fatG: 3, unitEn: 'bowl', unitBn: 'বাটি', gi: 'low' },

  { id: 'bhorta-alu', bn: 'আলু ভর্তা', en: 'Potato bhorta', category: 'bhorta', kcalPerUnit: 95, proteinG: 2, carbsG: 14, fatG: 4, unitEn: 'tbsp', unitBn: 'চামচ', gi: 'medium' },
  { id: 'bhorta-begun', bn: 'বেগুন ভর্তা', en: 'Eggplant bhorta', category: 'bhorta', kcalPerUnit: 70, proteinG: 1, carbsG: 8, fatG: 4, unitEn: 'tbsp', unitBn: 'চামচ', gi: 'low' },

  { id: 'hilsa-fried', bn: 'ইলিশ মাছ ভাজা', en: 'Fried hilsa', category: 'fish', kcalPerUnit: 210, proteinG: 18, carbsG: 2, fatG: 14, unitEn: 'piece', unitBn: 'টুকরা', gi: 'low' },
  { id: 'rui-curry', bn: 'রুই মাছের ঝোল', en: 'Rui fish curry', category: 'fish', kcalPerUnit: 150, proteinG: 16, carbsG: 4, fatG: 8, unitEn: 'piece', unitBn: 'টুকরা', gi: 'low' },

  { id: 'chicken-curry', bn: 'মুরগির মাংস', en: 'Chicken curry', category: 'meat', kcalPerUnit: 220, proteinG: 20, carbsG: 5, fatG: 13, unitEn: 'piece', unitBn: 'টুকরা', gi: 'low' },
  { id: 'beef-bhuna', bn: 'গরুর মাংস ভুনা', en: 'Beef bhuna', category: 'meat', kcalPerUnit: 260, proteinG: 19, carbsG: 4, fatG: 18, unitEn: 'piece', unitBn: 'টুকরা', gi: 'low' },

  { id: 'mixed-veg', bn: 'সবজি ভাজি', en: 'Mixed vegetable fry', category: 'vegetables', kcalPerUnit: 90, proteinG: 2, carbsG: 10, fatG: 5, unitEn: 'bowl', unitBn: 'বাটি', gi: 'low' },
  { id: 'shak', bn: 'শাক ভাজি', en: 'Sauteed greens', category: 'vegetables', kcalPerUnit: 60, proteinG: 2, carbsG: 6, fatG: 3, unitEn: 'bowl', unitBn: 'বাটি', gi: 'low' },

  { id: 'singara', bn: 'সিঙাড়া', en: 'Singara', category: 'snacks', kcalPerUnit: 180, proteinG: 3, carbsG: 20, fatG: 10, unitEn: 'piece', unitBn: 'পিস', gi: 'high' },
  { id: 'piyaju', bn: 'পিয়াজু', en: 'Piyaju', category: 'snacks', kcalPerUnit: 90, proteinG: 3, carbsG: 8, fatG: 5, unitEn: 'piece', unitBn: 'পিস', gi: 'medium' },

  { id: 'mishti-doi', bn: 'মিষ্টি দই', en: 'Sweet yogurt', category: 'sweets', kcalPerUnit: 155, proteinG: 4, carbsG: 24, fatG: 5, unitEn: 'cup', unitBn: 'কাপ', gi: 'high' },
  { id: 'roshogolla', bn: 'রসগোল্লা', en: 'Roshogolla', category: 'sweets', kcalPerUnit: 106, proteinG: 2, carbsG: 21, fatG: 1, unitEn: 'piece', unitBn: 'পিস', gi: 'high' },

  { id: 'tea-milk', bn: 'চা — দুধ ও চিনি', en: 'Tea with milk & sugar', category: 'drinks', kcalPerUnit: 70, proteinG: 1, carbsG: 12, fatG: 2, unitEn: 'cup', unitBn: 'কাপ', gi: 'medium' },
  { id: 'lassi', bn: 'লাচ্ছি', en: 'Lassi', category: 'drinks', kcalPerUnit: 180, proteinG: 5, carbsG: 26, fatG: 6, unitEn: 'glass', unitBn: 'গ্লাস', gi: 'medium' },

  { id: 'biscuit-pack', bn: 'প্যাকেট বিস্কুট', en: 'Packet biscuits', category: 'packaged', kcalPerUnit: 140, proteinG: 2, carbsG: 20, fatG: 6, unitEn: 'pack', unitBn: 'প্যাকেট', gi: 'high' },
  { id: 'chanachur', bn: 'চানাচুর', en: 'Chanachur mix', category: 'packaged', kcalPerUnit: 160, proteinG: 4, carbsG: 16, fatG: 9, unitEn: 'cup', unitBn: 'কাপ', gi: 'medium' },
];

export function foodById(id: string): FoodDef | undefined {
  return FOODS.find((f) => f.id === id);
}

export function searchFoods(query: string): FoodDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FOODS.filter((f) => f.bn.includes(query.trim()) || f.en.toLowerCase().includes(q));
}

export function foodsByCategory(category: FoodCategory): FoodDef[] {
  return FOODS.filter((f) => f.category === category);
}
