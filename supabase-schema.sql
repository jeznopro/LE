-- ==========================================================
-- SUPABASE SCHEMA FOR LEARNING ENGLISH (MOCHI ANKI)
-- Copy toàn bộ đoạn script này và dán vào Supabase SQL Editor, sau đó bấm RUN (Ctrl + Enter)
-- ==========================================================

-- 1. Bảng lưu trữ danh sách thẻ từ vựng của từng học viên
CREATE TABLE IF NOT EXISTS public.user_cards (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  phonetic TEXT,
  example TEXT,
  example_meaning TEXT,
  image TEXT,
  level INTEGER DEFAULT 0,
  interval NUMERIC DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  ease_factor NUMERIC DEFAULT 2.5,
  lapses INTEGER DEFAULT 0,
  next_review BIGINT,
  last_review BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id, user_id)
);

-- Bật bảo mật phân vùng Row Level Security (RLS)
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only read and write their own cards" ON public.user_cards;
CREATE POLICY "Users can only read and write their own cards"
ON public.user_cards
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Bảng lưu trữ bộ thẻ (decks) của từng học viên
CREATE TABLE IF NOT EXISTS public.user_decks (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  folder TEXT,
  icon TEXT,
  color TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.user_decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only read and write their own decks" ON public.user_decks;
CREATE POLICY "Users can only read and write their own decks"
ON public.user_decks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Bảng lưu trữ chuỗi ngày học streak, điểm XP và cấp độ
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  last_study_date TEXT,
  total_reviews INTEGER DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only read and write their own stats" ON public.user_stats;
CREATE POLICY "Users can only read and write their own stats"
ON public.user_stats
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
