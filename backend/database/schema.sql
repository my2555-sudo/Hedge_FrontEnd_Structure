-- Supabase Database Schema for Hedge Game Events
-- Run this SQL in your Supabase SQL Editor to create the events table

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    event_id TEXT NOT NULL,  -- Original event template ID (e.g., "macro-1")
    type TEXT NOT NULL CHECK (type IN ('MACRO', 'MICRO', 'BLACKSWAN')),
    title TEXT NOT NULL,
    base_impact_pct DECIMAL(10, 6) NOT NULL,
    impact_pct DECIMAL(10, 6) NOT NULL,
    icon TEXT NOT NULL,
    tags TEXT[],  -- Array of tags
    runtime_id TEXT UNIQUE NOT NULL,  -- Unique runtime ID for each generated event
    ts BIGINT NOT NULL,  -- Timestamp in milliseconds
    details TEXT,  -- Optional details (mainly for blackswan events)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_runtime_id ON events(runtime_id);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
-- Adjust this based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON events
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Alternative: Allow public read access (for API access)
-- CREATE POLICY "Allow public read access" ON events
--     FOR SELECT
--     USING (true);

-- Alternative: Allow public insert (for API to create events)
-- CREATE POLICY "Allow public insert" ON events
--     FOR INSERT
--     WITH CHECK (true);

