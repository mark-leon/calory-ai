# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project context

Bangladeshi calorie tracker (Expo SDK 57, React Native 0.86), bilingual Bengali/English UI. Goal: production app for real users.

## Current state

- App UI is a working demo: all data is local (AsyncStorage via `src/state/AppStateContext.tsx`), meal scan is faked (`src/screens/AnalysingScreen.tsx` uses a timer + random failure), paywall is visual only.
- Backend: Supabase project `ktmyxanpdbouxdyhjozt` (region ap-northeast-1). Schema lives in `supabase/migrations/` — apply with `supabase db push`.
  - Tables: `profiles` (auto-created on signup via trigger), `foods`, `logged_items`, `weight_entries`. RLS on all; users only see their own rows; `foods` is public-read.
  - `foods` has 8,332 rows: 24 `curated` dishes (per-serving, Bengali script, GI-tagged), 380 `bfct_2013`, 135 `usda_foundation`, 7,793 `usda_sr_legacy` (all per-100g, `unit_en = '100 g'`).
- Auth: passwordless email code (`signInWithOtp` + `verifyOtp`) in `src/state/AuthContext.tsx`, client in `src/lib/supabase.ts` (env in `.env.local`, see `.env.example`). Flow: SignIn → onboarding (only if the remote profile isn't onboarded) → Main.
  - Only `profiles` syncs so far (`src/state/profileSync.ts`); logs/weights are still device-only.
  - Hosted email templates ("Magic Link", "Confirm signup") must show `{{ .Token }}` — see `supabase/templates/otp_code.html`.
  - Hosted Supabase's built-in email sender is heavily rate-limited; set up custom SMTP before real users.
  - "Delete account" in Profile still only clears local data.
- Meal scan: `supabase/functions/analyze-meal` (Gemini via `generateContent`; model from the `GEMINI_MODEL` secret, default `gemini-3.5-flash-lite`). The app resizes the photo to 1024px JPEG (`src/lib/scan.ts`) and posts it; the function charges the daily quota (`consume_scan`, refunded on error/no food), asks the model to pick from the curated dishes or name the food + grams, and maps "other" items to BFCT/USDA rows via `match_food`. Every scan is logged in `scans` with token counts.
  - Scan quota lives server-side in `profiles.subscription_*`; clients can no longer write those columns (column grants in `20260924090000_meal_scan.sql`). The local counter just mirrors the server.
  - Scan results can be any `foods` row, so `LoggedItem` carries `perUnit` nutrition and `gi` may be null.
  - Photos are not stored yet. Next: opt-in consent + Storage upload of photo and the user's corrections, for evaluating models and later training.

## Data decisions

- BFCT 2013 (INFS, Dhaka Univ, via FAO INFOODS) and USDA FoodData Central (public domain) are the nutrition sources.
- IFCT 2017 (NIN Hyderabad) is deliberately excluded: its terms forbid electronic/product use without NIN's written permission. Don't ingest it (or the community GitHub digitization) unless permission is obtained.
- BFCT's "Foodname in Bengali" column is romanized, not Bengali script. It's stored in `foods.bn_translit`; `foods.bn` is null for imported rows (UI should fall back to English).
- Imported rows have `gi = null` (sources have no glycemic index).

## Next steps

1. Meal scan: done (Gemini). Build an eval set of ~200 labelled Bangladeshi plate photos and compare models; add opt-in photo/correction storage.
2. Auth: email done; add Google, and Sign in with Apple on iOS (required once any social login is offered).
3. Replace local `FOODS` search with Supabase queries; sync logs/weights to Supabase with AsyncStorage as offline cache.
4. Payments via RevenueCat + native store billing (not Stripe for digital subscriptions).
5. Sentry, analytics, account deletion flow, privacy policy, EAS Build/Submit.

## Running on a device

`npx expo prebuild -p android` then `npx expo run:android` with a USB-connected phone (adb). `android/` is generated and gitignored.
