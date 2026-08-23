-- Migration: 100_audit_missing_indexes
-- Date: 2026-07-24
-- Purpose: Fix duplicate/competing indexes on profiles(auth0_user_id) and
--          add missing indexes on feedback(auth0_user_id) and other
--          commonly-filtered columns identified during Phase 4 audit.
--
-- Background:
--   Three migrations tried to create an index on profiles(auth0_user_id):
--     072: CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_auth0_user_id
--     080: CREATE INDEX IF NOT EXISTS idx_profiles_auth0_user_id (no-op, name collision)
--     085: CREATE INDEX IF NOT EXISTS idx_profiles_auth0_user_id ... WHERE auth0_user_id IS NOT NULL (no-op, name collision)
--
--   Since CREATE INDEX IF NOT EXISTS checks by name only (not by definition),
--   only migration 072's UNIQUE index actually took effect. The more
--   efficient partial index from 085 was silently skipped.
--
-- Fix:
--   1. Drop the old UNIQUE index (all values, including NULL)
--   2. Create a partial UNIQUE index (non-null values only) -- smaller,
--      faster, and allows multiple NULLs for ghost/unclaimed profiles
--   3. Add missing index on feedback(auth0_user_id) for RLS policy lookups

-- ─── 1. Fix profiles(auth0_user_id) index ─────────────────────────────
-- Drop the existing UNIQUE index that covers all values including NULL.
-- This runs inside a single transaction via supabase db push, so there
-- is no window between the DROP and CREATE where the index is missing.
DROP INDEX IF EXISTS idx_profiles_auth0_user_id;

-- Create a partial unique index that only covers non-null values.
-- This is smaller, faster for lookups, and allows multiple NULL rows
-- (which represent ghost/unclaimed profiles that have no Auth0 identity).
-- The UNIQUE constraint ensures no two claimed profiles share the same
-- Auth0 user ID, preventing duplicate profile creation.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_auth0_user_id
  ON public.profiles(auth0_user_id)
  WHERE auth0_user_id IS NOT NULL;

COMMENT ON INDEX idx_profiles_auth0_user_id IS
  'Partial unique index on profiles(auth0_user_id) for fast Auth0 session lookups. Only indexes non-null values (ghost profiles with null auth0_user_id are excluded).';

-- ─── 2. Add index on feedback(auth0_user_id) ──────────────────────────
-- The feedback table uses auth0_user_id in RLS policies to identify the
-- submitter. Without an index, every SELECT on feedback performs a full
-- sequential scan when joining against profiles.
CREATE INDEX IF NOT EXISTS idx_feedback_auth0_user_id
  ON public.feedback(auth0_user_id)
  WHERE auth0_user_id IS NOT NULL;

COMMENT ON INDEX idx_feedback_auth0_user_id IS
  'Index on feedback(auth0_user_id) for RLS policy lookups. Partial index excludes anonymous feedback (null auth0_user_id).';

-- ─── 3. Add composite index for team member lookups ───────────────────
-- The team_chat and team_matching features query team_members by both
-- team_id and profile_id simultaneously. A composite index is more
-- efficient than relying on separate single-column indexes.
-- The existing single-column indexes (idx_team_members_team_id,
-- idx_team_members_profile_id from migration 084) remain for queries
-- that filter by one column only.
CREATE INDEX IF NOT EXISTS idx_team_members_team_profile
  ON public.team_members(team_id, profile_id);

COMMENT ON INDEX idx_team_members_team_profile IS
  'Composite index for team membership lookups by team and profile.';

-- ─── Notes ─────────────────────────────────────────────────────────────
-- slug_id is already covered by:
--   - UNIQUE NOT NULL constraint on profiles(slug_id) from migration 001
--   - idx_profiles_slug_id btree index from migration 080
-- No additional index needed on slug_id.

-- ═══ Done ═════════════════════════════════════════════════════════════
