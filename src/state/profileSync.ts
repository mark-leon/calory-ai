import { supabase } from '../lib/supabase';
import { OnboardingProfile } from '../utils/calorie';

// Mirrors the columns of public.profiles that the app owns. Subscription columns are
// left out on purpose: they'll be written server-side once RevenueCat is wired up.
export interface RemoteProfile {
  onboarded: boolean;
  name: string;
  profile: OnboardingProfile | null;
  targetOverride: number | null;
  remindersOn: boolean;
}

interface ProfileRow {
  onboarded: boolean;
  name: string;
  goal: OnboardingProfile['goal'] | null;
  age: number | null;
  sex: OnboardingProfile['sex'] | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity: OnboardingProfile['activity'] | null;
  diabetic: OnboardingProfile['diabetic'] | null;
  target_override: number | null;
  reminders_on: boolean;
}

const COLUMNS = 'onboarded, name, goal, age, sex, height_cm, weight_kg, activity, diabetic, target_override, reminders_on';

function fromRow(row: ProfileRow): RemoteProfile {
  const complete =
    row.goal && row.age != null && row.sex && row.height_cm != null && row.weight_kg != null && row.activity != null && row.diabetic;
  return {
    onboarded: row.onboarded && !!complete,
    name: row.name,
    profile: complete
      ? {
          goal: row.goal!,
          age: row.age!,
          sex: row.sex!,
          // numeric columns come back as strings from PostgREST
          heightCm: Number(row.height_cm),
          weightKg: Number(row.weight_kg),
          activity: row.activity!,
          diabetic: row.diabetic!,
        }
      : null,
    targetOverride: row.target_override,
    remindersOn: row.reminders_on,
  };
}

function toRow(p: Partial<RemoteProfile>): Partial<ProfileRow> {
  const row: Partial<ProfileRow> = {};
  if (p.onboarded !== undefined) row.onboarded = p.onboarded;
  if (p.name !== undefined) row.name = p.name;
  if (p.targetOverride !== undefined) row.target_override = p.targetOverride;
  if (p.remindersOn !== undefined) row.reminders_on = p.remindersOn;
  if (p.profile) {
    row.goal = p.profile.goal;
    row.age = p.profile.age;
    row.sex = p.profile.sex;
    row.height_cm = p.profile.heightCm;
    row.weight_kg = p.profile.weightKg;
    row.activity = p.profile.activity;
    row.diabetic = p.profile.diabetic;
  }
  return row;
}

export async function fetchProfile(userId: string): Promise<RemoteProfile | null> {
  const { data, error } = await supabase.from('profiles').select(COLUMNS).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as ProfileRow) : null;
}

export async function saveProfile(userId: string, patch: Partial<RemoteProfile>): Promise<void> {
  // upsert rather than update: the signup trigger creates the row, but don't depend on it.
  const { error } = await supabase.from('profiles').upsert({ user_id: userId, ...toRow(patch) });
  if (error) throw error;
}
