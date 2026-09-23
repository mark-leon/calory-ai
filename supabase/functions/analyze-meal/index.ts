// POST { image_base64, mime_type } with the user's access token.
// Charges one scan against the user's daily quota, asks a vision model what's on
// the plate, and maps each item to a row in `foods` so calories come from the
// database rather than from the model.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { type CuratedDish, recognize } from './gemini.ts';

const FREE_DAILY_SCANS = Number(Deno.env.get('FREE_DAILY_SCANS') ?? 3);
const PAID_DAILY_SCANS = Number(Deno.env.get('PAID_DAILY_SCANS') ?? 50);
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
// Set GEMINI_THINKING_LEVEL=none to omit thinkingConfig if a model rejects it.
const THINKING_LEVEL = Deno.env.get('GEMINI_THINKING_LEVEL') ?? 'low';
const MAX_IMAGE_BASE64_CHARS = 4_000_000; // ~3 MB decoded; the app sends ~150 KB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// New projects expose named keys in SUPABASE_SECRET_KEYS; older ones SUPABASE_SERVICE_ROLE_KEY.
function serviceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const named = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>;
  const key = named.default ?? Object.values(named)[0];
  if (!key) throw new Error('no service key in env');
  return key;
}

const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface FoodRow {
  id: string;
  bn: string | null;
  en: string;
  unit_en: string | null;
  unit_bn: string | null;
  kcal_per_unit: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  gi: 'low' | 'medium' | 'high' | null;
}

const FOOD_COLUMNS = 'id, bn, en, unit_en, unit_bn, kcal_per_unit, protein_g, carbs_g, fat_g, gi';

// Curated dishes change rarely; cache per warm instance.
let curatedCache: { rows: FoodRow[]; at: number } | null = null;
async function curatedDishes(db: SupabaseClient): Promise<FoodRow[]> {
  if (curatedCache && Date.now() - curatedCache.at < 10 * 60_000) return curatedCache.rows;
  const { data, error } = await db.from('foods').select(FOOD_COLUMNS).eq('source', 'curated');
  if (error) throw error;
  curatedCache = { rows: data as FoodRow[], at: Date.now() };
  return curatedCache.rows;
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const { data: userData } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  const user = userData.user;
  if (!user) return json({ code: 'unauthorized' }, 401);

  let body: { image_base64?: string; mime_type?: string };
  try {
    body = await req.json();
  } catch {
    return json({ code: 'bad_request' }, 400);
  }
  const imageBase64 = body.image_base64 ?? '';
  const mimeType = body.mime_type ?? 'image/jpeg';
  if (!imageBase64 || imageBase64.length > MAX_IMAGE_BASE64_CHARS || !ALLOWED_MIME.has(mimeType)) {
    return json({ code: 'bad_image' }, 400);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return json({ code: 'not_configured' }, 500);
  }

  // Charge first so parallel requests can't exceed the quota; refund if nothing useful comes back.
  const { data: quotaRows, error: quotaError } = await admin.rpc('consume_scan', {
    p_user_id: user.id,
    p_free_limit: FREE_DAILY_SCANS,
    p_paid_limit: PAID_DAILY_SCANS,
  });
  if (quotaError) {
    console.error('consume_scan failed', quotaError);
    return json({ code: 'server_error' }, 500);
  }
  const quota = quotaRows[0] as { allowed: boolean; tier: string; scans_used_today: number };
  if (!quota.allowed) {
    return json({ code: 'quota_exceeded', tier: quota.tier, scans_used_today: quota.scans_used_today }, 429);
  }

  const started = Date.now();
  const log = (row: Record<string, unknown>) =>
    admin
      .from('scans')
      .insert({ user_id: user.id, provider: 'gemini', model: MODEL, latency_ms: Date.now() - started, ...row })
      .then(({ error }) => error && console.error('scan log failed', error));

  try {
    const curated = await curatedDishes(admin);
    const dishes: CuratedDish[] = curated.map((f) => ({ id: f.id, en: f.en, bn: f.bn ?? f.en, unit_en: f.unit_en ?? 'serving' }));
    const result = await recognize({
      apiKey,
      model: MODEL,
      thinkingLevel: THINKING_LEVEL === 'none' ? null : THINKING_LEVEL,
      imageBase64,
      mimeType,
      dishes,
    });

    const items = [];
    for (const it of result.items) {
      const confidence = Math.min(1, Math.max(0, it.confidence));
      const dish = curated.find((f) => f.id === it.food_id);
      if (dish) {
        items.push({ food: toScanFood(dish), qty: Math.max(0.25, roundTo(it.qty, 0.25)), confidence });
        continue;
      }
      const { data: matches, error } = await admin.rpc('match_food', { q: it.name_en });
      if (error) throw error;
      const match = (matches as FoodRow[])[0];
      if (!match || !(it.grams > 0)) continue;
      // Composition-table rows are per 100 g; show the model's friendlier names instead of e.g.
      // "Chicken, broilers or fryers, meat only, cooked, fried".
      items.push({
        food: { ...toScanFood(match), en: it.name_en, bn: it.name_bn || null, unitBn: '১০০ গ্রাম' },
        qty: Math.max(0.1, roundTo(it.grams / 100, 0.1)),
        // a name-based match adds its own uncertainty on top of the identification
        confidence: Math.min(confidence, 0.7),
      });
    }

    const usage = { input_tokens: result.inputTokens, output_tokens: result.outputTokens };
    if (!result.is_food || items.length === 0) {
      const used = await admin.rpc('refund_scan', { p_user_id: user.id });
      await log({ status: 'no_food', result, ...usage });
      return json({ status: 'no_food', scans_used_today: used.data ?? quota.scans_used_today - 1 });
    }

    await log({ status: 'ok', result: { raw: result.items, items }, ...usage });
    return json({ status: 'ok', items, scans_used_today: quota.scans_used_today, tier: quota.tier });
  } catch (e) {
    console.error('analyze-meal failed', e);
    await admin.rpc('refund_scan', { p_user_id: user.id });
    await log({ status: 'error', error: String(e).slice(0, 1000) });
    return json({ code: 'recognition_failed' }, 502);
  }
});

function toScanFood(f: FoodRow) {
  return {
    id: f.id,
    en: f.en,
    bn: f.bn,
    unitEn: f.unit_en ?? '100 g',
    unitBn: f.unit_bn,
    kcalPerUnit: Number(f.kcal_per_unit),
    proteinG: Number(f.protein_g),
    carbsG: Number(f.carbs_g),
    fatG: Number(f.fat_g),
    gi: f.gi,
  };
}
