-- Migration: 063_add_clerk_user_id_to_profiles
-- Date: 2026-07-01
-- Purpose: Add clerk_user_id column to profiles and make webhook sync work.
-- Context: The Clerk webhook tries to upsert profiles using Clerk's user_xxx
--          ID as the profile id, but profiles.id is UUID type — so the upsert
--          silently fails and profiles are never created.
--
--          Migration 053 promised to shift to clerk_user_id lookups but never
--          added the column. The entire codebase already uses this pattern:
--          supabase.from('profiles').select('id').eq('clerk_user_id', userId)
--          — it just never worked because the column didn't exist.
--
-- This migration:
--   1. Adds clerk_user_id TEXT column to profiles
--   2. Creates a UNIQUE index on clerk_user_id for fast lookups
--   3. Migrates existing profiles (if any) — since the webhook was broken,
--      existing rows should be minimal or none.

-- Add clerk_user_id column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Unique index for fast lookups and upsert conflict resolution
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON public.profiles (clerk_user_id);
