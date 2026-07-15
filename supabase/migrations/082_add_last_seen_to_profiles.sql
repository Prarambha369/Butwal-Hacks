-- Migration: 082_add_last_seen_to_profiles.sql
-- Date: 2026-07-10
-- Purpose: Add last_seen column to profiles for heartbeat-based online tracking
--
-- Supabase Realtime presence tracks currently-online users ephemerally.
-- The last_seen column provides persistent "last seen X minutes ago" data
-- for profiles that are offline, populated by the /api/heartbeat endpoint.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.last_seen IS 'Last activity timestamp, updated by heartbeat endpoint. Used for "last seen" display on profile pages.';

-- Index for "recently active" queries (users seen in last N minutes)
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles (last_seen DESC);
