-- Widen `foods` to hold raw per-100g composition-table entries (BFCT/USDA)
-- alongside the original hand-curated per-serving Bangladeshi dishes.
-- Curated dishes keep unit_en/unit_bn/kcal_per_unit populated as before.
-- Composition-table rows use unit_en = '100 g', kcal_per_unit = kcal_per_100g,
-- and leave gi null (glycemic index isn't in these sources).

alter table public.foods
  alter column bn drop not null,
  alter column unit_en drop not null,
  alter column unit_bn drop not null,
  alter column gi drop not null;

alter table public.foods
  add column source text not null default 'curated',
  add column source_id text,
  add column bn_translit text,
  add column kcal_per_100g numeric,
  add column protein_g_per_100g numeric,
  add column carbs_g_per_100g numeric,
  add column fat_g_per_100g numeric,
  add column edible_portion_coefficient numeric;

-- Backfill per-100g fields for the 24 curated dishes using their existing
-- per-unit values, so every row is queryable by per-100g basis too where
-- the unit is already a fixed-weight serving isn't knowable — left null
-- for curated rows since their "unit" (plate/piece/bowl) has no fixed gram
-- weight recorded; per-unit fields remain the source of truth for those.

create unique index foods_source_source_id_idx on public.foods (source, source_id) where source_id is not null;
create index foods_category_idx on public.foods (category);
create index foods_en_search_idx on public.foods using gin (to_tsvector('simple', en));
