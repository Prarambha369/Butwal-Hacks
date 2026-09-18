-- Migration: 119_degamify_drops
-- Purpose: Remove gamification remnants that no live or branch code
-- touches anymore (verified: zero references in src).
--
-- DROPPED here (safe for the live site):
--   - leaderboard_view: no readers anywhere, already revoked in 117.
--   - micro_credentials.xp_reward / resources.xp_reward: write-only
--     columns, never consumed by any awarding code.
--   - increment_xp(): sole caller (bounty webhook) removed; the function
--     was broken anyway (called with a nonexistent p_reason argument).
--   - anon/authenticated SELECT on profiles.xp: revoked now that no
--     browser client selects it.
--
-- DELIBERATELY KEPT for a post-merge cleanup (live main-branch code
-- still selects it; dropping now would 500 production reads):
--   - profiles.xp column itself → drop after this branch merges + deploys.

DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_view;
ALTER TABLE public.micro_credentials DROP COLUMN IF EXISTS xp_reward;
ALTER TABLE public.resources DROP COLUMN IF EXISTS xp_reward;
DROP FUNCTION IF EXISTS public.increment_xp(uuid, integer);
REVOKE SELECT (xp) ON public.profiles FROM anon, authenticated;
