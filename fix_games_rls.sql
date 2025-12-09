-- Fix RLS Policies for Games Table
-- Run this SQL in your Supabase SQL Editor to fix the "row-level security policy" error for games table

-- First, ensure the games table exists (adjust schema as needed)
CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  starting_cash NUMERIC DEFAULT 10000,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on games table
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to create games" ON games;
DROP POLICY IF EXISTS "Allow authenticated users to view games" ON games;
DROP POLICY IF EXISTS "Allow authenticated users to update games" ON games;
DROP POLICY IF EXISTS "Allow service role to manage games" ON games;

-- Policy: Allow authenticated users to create games
CREATE POLICY "Allow authenticated users to create games" ON games
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to view games
CREATE POLICY "Allow authenticated users to view games" ON games
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to update games
CREATE POLICY "Allow authenticated users to update games" ON games
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow service role full access (for backend API)
-- This allows the backend service role to manage games without RLS restrictions
CREATE POLICY "Allow service role to manage games" ON games
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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
WHERE tablename = 'games'
ORDER BY policyname;


