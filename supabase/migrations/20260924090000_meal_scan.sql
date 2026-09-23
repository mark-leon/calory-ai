-- Server-side meal scanning: scan quota, a scan log, and food matching for the analyze-meal Edge Function.

-- 1. Subscription/quota columns on profiles become server-only.
-- The original "users manage their own profile" policy let a user set their own
-- subscription_tier or reset their scan counter through the API. Keep RLS as is,
-- but narrow the column privileges clients get.
revoke insert, update on public.profiles from anon, authenticated;

grant insert (
  user_id, name, onboarded, goal, age, sex, height_cm, weight_kg, activity, diabetic, target_override, reminders_on
) on public.profiles to authenticated;

-- user_id is included because PostgREST upserts put every payload column in ON CONFLICT DO UPDATE;
-- RLS's with-check still pins it to auth.uid().
grant update (
  user_id, name, onboarded, goal, age, sex, height_cm, weight_kg, activity, diabetic, target_override, reminders_on
) on public.profiles to authenticated;

-- 2. Quota. Days roll over at midnight Bangladesh time. Paid tiers get a high
-- abuse cap rather than truly unlimited scans, since every scan costs money.
create function public.consume_scan(p_user_id uuid, p_free_limit integer, p_paid_limit integer)
returns table (allowed boolean, tier text, scans_used_today integer)
language plpgsql
security definer set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Dhaka')::date;
  p public.profiles%rowtype;
  used integer;
begin
  insert into public.profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
  select * into p from public.profiles where user_id = p_user_id for update;

  used := case when p.subscription_scan_date = today then p.subscription_scans_used_today else 0 end;

  if used >= (case when p.subscription_tier = 'free' then p_free_limit else p_paid_limit end) then
    return query select false, p.subscription_tier, used;
    return;
  end if;

  update public.profiles
    set subscription_scan_date = today, subscription_scans_used_today = used + 1
    where user_id = p_user_id;
  return query select true, p.subscription_tier, used + 1;
end;
$$;

-- Give the scan back when it didn't produce a result (model error, no food in the photo).
create function public.refund_scan(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Dhaka')::date;
  used integer;
begin
  update public.profiles
    set subscription_scans_used_today = greatest(subscription_scans_used_today - 1, 0)
    where user_id = p_user_id and subscription_scan_date = today
    returning subscription_scans_used_today into used;
  return coalesce(used, 0);
end;
$$;

-- Supabase grants execute on new functions to the API roles by default; only the
-- Edge Function (service role) may touch quotas.
revoke execute on function public.consume_scan(uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.refund_scan(uuid) from public, anon, authenticated;

-- 3. One row per scan, for cost monitoring and for picking/evaluating models.
-- Written only by the Edge Function; users can read their own.
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('ok', 'no_food', 'error')),
  provider text not null,
  model text not null,
  result jsonb,
  error text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

create policy "users read their own scans"
  on public.scans for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.scans from anon, authenticated;

create index scans_user_created_idx on public.scans (user_id, created_at desc);

-- 4. Best composition-table row for a free-text English food name (for dishes the
-- model couldn't map to a curated dish). Any-word prefix match, ranked by how many
-- words hit, preferring BFCT (Bangladeshi) over USDA, then shorter/more generic names.
create function public.match_food(q text)
returns setof public.foods
language sql
stable
set search_path = public
as $$
  with words as (
    select w
    from regexp_split_to_table(lower(q), '[^a-z]+') as w
    where length(w) > 2 and w not in ('and', 'with', 'the', 'for', 'from')
  ),
  query as (
    select to_tsquery('simple', string_agg(w || ':*', ' | ')) as tsq from words
  )
  select f.*
  from public.foods f, query
  where query.tsq is not null
    and f.source <> 'curated'
    and to_tsvector('simple', f.en) @@ query.tsq
  order by
    ts_rank(to_tsvector('simple', f.en), query.tsq) desc,
    case f.source when 'bfct_2013' then 0 when 'usda_foundation' then 1 else 2 end,
    length(f.en)
  limit 1;
$$;
