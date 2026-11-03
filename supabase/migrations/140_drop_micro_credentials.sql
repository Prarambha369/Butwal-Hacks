-- Migration: 140_drop_micro_credentials.sql
-- Purpose: Drop the micro_credentials / profile_micro_credentials tables.
--
-- Context:
--   Migration 069 (069_add_micro_credentials.sql) created these two tables as the
--   data layer for the Skill Trees / micro-credentials feature (Phase 15).
--
--   That feature is being removed from the app in PR #58:
--     - Skill Trees dashboard page, API route, server actions, components, tests
--     - Credentials stat from homepage live-stats-counter
--     - Nav entries, audit routes, dead i18n keys
--
--   The trust-markers-on-profile feature that stays uses a different data path:
--     - src/lib/skill-trees.ts  (SKILL_TREES config + getProfileUnlockedSkills)
--     - profiles.total_trust_markers  (computed from trust_markers table)
--     - trust_markers table (migration 001, reconciled in 0103)
--
--   getProfileUnlockedSkills never reads micro_credentials; the only app code that
--   referenced these tables was the deleted src/lib/actions/skill-trees.ts.
--
--   Safe to drop: no live query targets these tables, and seed.sql never inserted
--   any profile_micro_credentials rows.
--
--   RLS/grant migrations that referenced these tables (073, 116) use IF EXISTS
--   guards, so they become harmless no-ops once the tables are gone. No edit needed.

BEGIN;

-- Drop in dependency order (child table first)
DROP TABLE IF EXISTS public.profile_micro_credentials;
DROP TABLE IF EXISTS public.micro_credentials;

COMMIT;
