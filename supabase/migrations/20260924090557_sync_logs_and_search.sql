-- 1. logged_items as written by the app's sync.
-- Composition-table foods have no glycemic index, custom foods have no catalog row
-- (food_id null), and per-unit nutrition is kept so a portion logged on one device
-- can be edited on another.
alter table public.logged_items
  alter column gi drop not null,
  add column per_unit_kcal numeric,
  add column per_unit_protein_g numeric,
  add column per_unit_carbs_g numeric,
  add column per_unit_fat_g numeric;

create index logged_items_user_created_idx on public.logged_items (user_id, created_at);

-- 2. Food search for the app's search screen. Curated dishes are bundled in the app
-- and searched locally, so this only returns composition-table rows.
-- Every English word must prefix-match; romanized Bangla (bn_translit, e.g. "bhutta")
-- matches as a substring. BFCT ranks ahead of USDA.
create function public.search_foods(q text, max_results integer default 20)
returns setof public.foods
language sql
stable
set search_path = public
as $$
  with input as (
    select trim(q) as t
  ),
  words as (
    select w
    from input, regexp_split_to_table(lower(input.t), '[^a-z0-9]+') as w
    where length(w) > 1
  ),
  query as (
    select
      (select to_tsquery('simple', string_agg(w || ':*', ' & ')) from words) as tsq,
      '%' || replace(replace(replace(input.t, '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
    from input
    where length(input.t) >= 2
  )
  select f.*
  from public.foods f, query
  where f.source <> 'curated'
    and (
      (query.tsq is not null and to_tsvector('simple', f.en) @@ query.tsq)
      or f.bn_translit ilike query.pattern
    )
  order by
    case f.source when 'bfct_2013' then 0 when 'usda_foundation' then 1 else 2 end,
    ts_rank(to_tsvector('simple', f.en), query.tsq) desc nulls last,
    length(f.en)
  limit least(greatest(max_results, 1), 50);
$$;
