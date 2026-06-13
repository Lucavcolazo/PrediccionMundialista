-- ============================================================
-- mundial-hub — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ==================== PROFILES ====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username    text NOT NULL,
  email       text NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (needed for leaderboard)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ==================== PREDICTIONS ====================
CREATE TABLE IF NOT EXISTS public.predictions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  fixture_id  integer NOT NULL,
  home_score  integer NOT NULL CHECK (home_score >= 0),
  away_score  integer NOT NULL CHECK (away_score >= 0),
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, fixture_id)
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Users see their own predictions
CREATE POLICY "predictions_select_own"
  ON public.predictions FOR SELECT
  USING (auth.uid() = user_id);

-- Leaderboard needs to read all predictions — use a function instead (see below)
-- For simplicity: allow all authenticated users to read all predictions
CREATE POLICY "predictions_select_authenticated"
  ON public.predictions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert/update/delete their own predictions
CREATE POLICY "predictions_insert_own"
  ON public.predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "predictions_update_own"
  ON public.predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "predictions_delete_own"
  ON public.predictions FOR DELETE
  USING (auth.uid() = user_id);


-- ==================== CHAMPION PREDICTIONS ====================
CREATE TABLE IF NOT EXISTS public.champion_predictions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  team_name   text NOT NULL,
  team_code   text NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.champion_predictions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read champion predictions (for leaderboard)
CREATE POLICY "champion_select_authenticated"
  ON public.champion_predictions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "champion_insert_own"
  ON public.champion_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "champion_update_own"
  ON public.champion_predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "champion_delete_own"
  ON public.champion_predictions FOR DELETE
  USING (auth.uid() = user_id);


-- ==================== TRIGGER: updated_at ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==================== NOTES ====================
-- After creating schema:
-- 1. Go to Authentication > Settings > Email in Supabase dashboard
-- 2. Enable "Magic Link" and disable "Email/Password"
-- 3. Set Site URL to your Vercel URL (or localhost:5173 for dev)
-- 4. Add localhost:5173 to "Redirect URLs" for local dev
-- 5. To control who can access: Authentication > Users — disable users you don't want
