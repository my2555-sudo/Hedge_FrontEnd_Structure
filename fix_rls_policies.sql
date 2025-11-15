-- Fix RLS Policies for Authentication
-- Run this SQL in your Supabase SQL Editor to fix the "row-level security policy" error

-- First, make sure the profiles table exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (IMPORTANT: This fixes the signup error)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Optional: Allow users to view other users' profiles (for leaderboards, etc.)
-- Uncomment if you want public profile viewing:
-- CREATE POLICY "Public profiles are viewable by everyone" ON profiles
--   FOR SELECT 
--   USING (true);

-- Now set up game_participants table RLS
CREATE TABLE IF NOT EXISTS game_participants (
  id BIGSERIAL PRIMARY KEY,
  game_id INT8 NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cash_balance NUMERIC DEFAULT 10000,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Enable RLS on game_participants table
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own participants" ON game_participants;
DROP POLICY IF EXISTS "Users can insert own participants" ON game_participants;
DROP POLICY IF EXISTS "Users can update own participants" ON game_participants;

-- Policy: Users can view their own game participants
CREATE POLICY "Users can view own participants" ON game_participants
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own game participants
CREATE POLICY "Users can insert own participants" ON game_participants
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own game participants
CREATE POLICY "Users can update own participants" ON game_participants
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify the policies are set up correctly
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'game_participants')
ORDER BY tablename, policyname;

