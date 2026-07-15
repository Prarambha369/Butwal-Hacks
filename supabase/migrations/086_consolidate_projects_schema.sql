-- ═══════════════════════════════════════════════════════════════════════
-- 086_consolidate_projects_schema.sql — Resolve 001 vs 032 table conflict
-- ═══════════════════════════════════════════════════════════════════════
--
-- 🔴 WARNING: Migration 032 will FAIL if applied after 001
-- ────────────────────────────────────────────────────────────────────────
-- Migration 032_add_projects_table.sql attempts to CREATE TABLE projects,
-- but migration 001 already created it. This causes:
--   ERROR: relation "projects" already exists
--
-- Sequential migration runners (including `supabase migration up`) stop on
-- error, which means migrations 033 through 086 WOULD NEVER APPLY if 032
-- fails. To resolve this in existing environments, either:
--   a) Delete 032_add_projects_table.sql entirely (recommended — 001 covers it)
--   b) Replace its content with: `-- SKIPPED: projects already in 001`
--   c) Wrap in a DO block:  DO $$ BEGIN CREATE TABLE IF NOT EXISTS ... END $$;
-- ═══════════════════════════════════════════════════════════════════════
--
-- SCHEMA DIVERGENCE
-- ─────────────────
-- The two migrations defined different columns for the same table:
--
-- ┌──────────────────────┬────────────────────────┬──────────────────────────┐
-- │ Column               │ 001 (initial)          │ 032 (project portal)    │
-- ├──────────────────────┼────────────────────────┼──────────────────────────┤
-- │ Ownership            │ team_id (→ teams)      │ profile_id (→ profiles)  │
-- │ Title column         │ title text NOT NULL    │ name text NOT NULL       │
-- │ Image column         │ cover_image text       │ image_url text           │
-- │ GitHub verification  │ github_verified bool   │ —                        │
-- │ Video                │ video_url text         │ —                        │
-- │ Event link           │ event_id (→ events)    │ —                        │
-- │ Hackathon origin     │ —                      │ hackathon_origin text    │
-- │ Demo URL             │ demo_url text          │ demo_url text            │
-- │ GitHub URL           │ github_url text        │ github_url text          │
-- │ Tech stack           │ tech_stack text[]      │ tech_stack text[]        │
-- └──────────────────────┴────────────────────────┴──────────────────────────┘
--
-- RESOLUTION
-- ──────────
-- This migration does NOT create the table (already exists from 001).
-- Instead it adds columns from 032 that 001 was missing:
--   1. profile_id FK (critical — codebase uses this for project ownership)
--   2. hackathon_origin text (from 032's design, used by DisplayProject)
--
-- Naming divergence (name↔title, image_url↔cover_image): the codebase uses
-- the 001 names (title, cover_image), so no column rename is needed.
--
-- Already handled by other migrations:
--   • category column         → 070_add_project_categories.sql
--   • idx_projects_profile_id → 084_fix_supabase_security.sql
--   • idx_projects_event_id   → 084_fix_supabase_security.sql
--
-- All statements use IF NOT EXISTS so they are safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Add profile_id FK ──────────────────────────────────────────────
-- This column is used by projects.ts, micro-credentials.ts, moderation.ts,
-- generate-profile-summary.ts, and the seed.sql. Without it, all project
-- ownership and per-user project queries fail.
-- Migration 032 intended this to be NOT NULL with ON DELETE CASCADE, but
-- it's added as nullable first since existing projects may not have one.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.projects.profile_id IS
  'Owner profile UUID. Added by 086 consolidation. Used by project CRUD and per-user queries.';

-- ─── 2. Add hackathon_origin text ──────────────────────────────────────
-- This came from 032's schema and is used by the DisplayProject UI type.
-- Stores which hackathon/event the project was originally built at.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS hackathon_origin text;

COMMENT ON COLUMN public.projects.hackathon_origin IS
  'Name/identifier of the hackathon where this project was originally built. From 032 schema.';

-- ─── 3. Ensure service_role has full access (RLS is disabled per 073/084) ──
-- The service role key needs full CRUD to function. RLS was disabled in 073
-- (with final cleanup in 084), but GRANTs are belt-and-suspenders.

GRANT ALL PRIVILEGES ON public.projects TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ═══ Done ═════════════════════════════════════════════════════════════
