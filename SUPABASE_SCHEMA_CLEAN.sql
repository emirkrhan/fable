-- Story Planner - Minimal Supabase Schema (Sharing disabled)
-- This script creates only the required tables, triggers and RLS policies
-- for the current codebase. It removes any sharing-related structures.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Timestamp trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Boards table (owned-only, no sharing)
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  nodes JSONB NOT NULL DEFAULT '[]'::JSONB,
  edges JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON public.boards(owner_id);

DROP TRIGGER IF EXISTS trg_boards_updated_at ON public.boards;
CREATE TRIGGER trg_boards_updated_at
BEFORE UPDATE ON public.boards
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Auto profile creation on signup (from auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users (self only)
DROP POLICY IF EXISTS "Users can read own" ON public.users;
CREATE POLICY "Users can read own"
  ON public.users FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert self" ON public.users;
CREATE POLICY "Users can insert self"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own" ON public.users;
CREATE POLICY "Users can update own"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

-- RLS Policies: boards (owner only)
DROP POLICY IF EXISTS "Owners can read boards" ON public.boards;
CREATE POLICY "Owners can read boards"
  ON public.boards FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can insert boards" ON public.boards;
CREATE POLICY "Owners can insert boards"
  ON public.boards FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update boards" ON public.boards;
CREATE POLICY "Owners can update boards"
  ON public.boards FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete boards" ON public.boards;
CREATE POLICY "Owners can delete boards"
  ON public.boards FOR DELETE
  USING (owner_id = auth.uid());


