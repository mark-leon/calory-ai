-- Food catalog: global reference data, readable by everyone, writable only by service role.
create table public.foods (
  id text primary key,
  bn text not null,
  en text not null,
  category text not null,
  kcal_per_unit numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  unit_en text not null,
  unit_bn text not null,
  gi text not null check (gi in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

alter table public.foods enable row level security;

create policy "foods are publicly readable"
  on public.foods for select
  using (true);

-- One row per user, mirrors OnboardingProfile + top-level PersistedState fields.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  onboarded boolean not null default false,
  goal text check (goal in ('lose', 'maintain', 'gain')),
  age integer,
  sex text check (sex in ('male', 'female')),
  height_cm numeric,
  weight_kg numeric,
  activity integer check (activity between 1 and 4),
  diabetic text check (diabetic in ('yes', 'no', 'unsure')),
  target_override integer,
  reminders_on boolean not null default true,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'monthly', 'yearly')),
  subscription_scan_date date,
  subscription_scans_used_today integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users manage their own profile"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- One row per logged food item. date + meal_type replace the old DayLog/DayMeals nesting.
create table public.logged_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'snack', 'dinner')),
  food_id text references public.foods (id),
  bn text not null,
  en text not null,
  unit_en text not null,
  unit_bn text not null,
  qty numeric not null,
  kcal numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  gi text not null check (gi in ('low', 'medium', 'high')),
  confidence numeric,
  photo_path text,
  created_at timestamptz not null default now()
);

alter table public.logged_items enable row level security;

create policy "users manage their own logged items"
  on public.logged_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index logged_items_user_date_idx on public.logged_items (user_id, log_date);

-- One row per weight check-in.
create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  kg numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.weight_entries enable row level security;

create policy "users manage their own weight entries"
  on public.weight_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at current on profile writes.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Auto-create a profile row the moment a user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
