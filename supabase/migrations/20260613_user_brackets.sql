-- SQL Schema for World Cup Bracket & Leaderboard

-- 1. Table for user brackets
CREATE TABLE IF NOT EXISTS public.user_brackets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  bracket_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Store the R32 to Final predictions
  group_standings jsonb NOT NULL DEFAULT '{}'::jsonb, -- Store calculated group standings
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE public.user_brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bracket"
  ON public.user_brackets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bracket"
  ON public.user_brackets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bracket"
  ON public.user_brackets FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. View for Leaderboard (Simple sum for now, can be expanded)
-- Assuming you have a points column in profiles, or we calculate it dynamically
-- We will implement the points calculation logic directly in the UI or via an Edge Function later.
