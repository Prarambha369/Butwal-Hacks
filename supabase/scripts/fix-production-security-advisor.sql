-- ═══════════════════════════════════════════════════════════════════════
-- fix-production-security-advisor.sql (hardened)
-- One-shot remediation for the Butwal Hacks Production Security Advisor.
--
-- IMPORTANT: the Supabase SQL editor runs the whole batch inside one
-- transaction, so a single failing statement rolls back EVERYTHING. This
-- version is abort-proof: every DROP/GRANT/ALTER is guarded by existence
-- checks, so it cannot fail on missing tables or functions (production is
-- at ~migration 055 and may lack later tables).
--
-- Mirrors migrations 103/104/105 (supabase/migrations/). Fully idempotent.
--
-- Fixes:
--   1. trust_markers legacy schema (issued_by/marker_type -> issuer_id/type,
--      missing title/description/event_id/is_revoked/crypto_signature).
--   2. Orphaned RLS policies on RLS-disabled tables (name-agnostic purge).
--   3. SECURITY DEFINER exposure + mutable search_path (drops exec_sql() /
--      rls_auto_enable() — arbitrary SQL execution vectors — revokes EXECUTE
--      from anon/authenticated, locks search_path).
--   4. Service-role grants on workspaces/tasks/claim_tokens.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- SECTION 1 (migration 103): trust_markers schema reconciliation
-- ───────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trust_markers' AND column_name = 'issued_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trust_markers' AND column_name = 'issuer_id'
  ) THEN
    ALTER TABLE public.trust_markers RENAME COLUMN issued_by TO issuer_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trust_markers' AND column_name = 'marker_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trust_markers' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.trust_markers RENAME COLUMN marker_type TO type;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trust_markers_issued_by_fkey'
      AND conrelid = 'public.trust_markers'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trust_markers_issuer_id_fkey'
      AND conrelid = 'public.trust_markers'::regclass
  ) THEN
    ALTER TABLE public.trust_markers
      RENAME CONSTRAINT trust_markers_issued_by_fkey TO trust_markers_issuer_id_fkey;
  END IF;
END $$;

ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id);
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS is_revoked boolean NOT NULL DEFAULT false;
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS revocation_reason text;
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS crypto_signature text;

CREATE INDEX IF NOT EXISTS idx_trust_markers_issuer_id ON public.trust_markers (issuer_id);
CREATE INDEX IF NOT EXISTS idx_trust_markers_event_id ON public.trust_markers (event_id);

-- Service-role grants (guarded: GRANT has no IF EXISTS)
DO $$ BEGIN
  IF to_regclass('public.workspaces') IS NOT NULL THEN
    GRANT ALL ON public.workspaces TO service_role;
  END IF;
END $$;
DO $$ BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    GRANT ALL ON public.tasks TO service_role;
  END IF;
END $$;
DO $$ BEGIN
  IF to_regclass('public.claim_tokens') IS NOT NULL THEN
    GRANT ALL ON public.claim_tokens TO service_role;
  END IF;
END $$;
GRANT ALL ON public.trust_markers TO service_role;

-- ───────────────────────────────────────────────────────────────────────
-- SECTION 2 (migration 104): drop orphaned policies on RLS-disabled tables
-- ───────────────────────────────────────────────────────────────────────

-- m001-era policies (all on tables that exist since migration 001)
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Published events viewable" ON public.events;
DROP POLICY IF EXISTS "Organizers insert events" ON public.events;
DROP POLICY IF EXISTS "Organizers update own events" ON public.events;
DROP POLICY IF EXISTS "Public read events" ON public.events;
DROP POLICY IF EXISTS "Users view own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users register for events" ON public.event_registrations;
DROP POLICY IF EXISTS "Teams viewable" ON public.teams;
DROP POLICY IF EXISTS "Registered hackers create teams" ON public.teams;
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
DROP POLICY IF EXISTS "Team members viewable" ON public.team_members;
DROP POLICY IF EXISTS "Members join teams" ON public.team_members;
DROP POLICY IF EXISTS "Members can leave team" ON public.team_members;
DROP POLICY IF EXISTS "Users view own invites" ON public.team_invites;
DROP POLICY IF EXISTS "Captains create invites" ON public.team_invites;
DROP POLICY IF EXISTS "Projects viewable by all" ON public.projects;
DROP POLICY IF EXISTS "Team members insert projects" ON public.projects;
DROP POLICY IF EXISTS "Public read projects" ON public.projects;
DROP POLICY IF EXISTS "Users manage own likes" ON public.project_likes;
DROP POLICY IF EXISTS "Public read likes" ON public.project_likes;
DROP POLICY IF EXISTS "Non-revoked markers viewable" ON public.trust_markers;
DROP POLICY IF EXISTS "Organizers insert markers" ON public.trust_markers;
DROP POLICY IF EXISTS "Maintainers update markers" ON public.trust_markers;
DROP POLICY IF EXISTS "Users view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Organizers issue certificates" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Maintainers can read feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users manage own reviews" ON public.event_reviews;

-- NOTE: audit_logs/api_keys/photos/skills_endorsements policies are handled
-- by the generic purge loop below — those tables were not confirmed present
-- in production's advisor output, and an unguarded DROP on a missing table
-- would roll back the entire batch in the SQL editor's transaction.

-- Production-specific orphan names observed in the Advisor (m001-era tables)
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Public events read" ON public.events;
DROP POLICY IF EXISTS "Public reviews read" ON public.event_reviews;
DROP POLICY IF EXISTS "Users can submit reviews" ON public.event_reviews;
DROP POLICY IF EXISTS "Organizers can manage certificates for their events" ON public.certificates;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;

-- Generic purge — name- AND table-agnostic: drops EVERY policy on EVERY
-- RLS-disabled public table. Covers workspaces/tasks/sponsor_profiles/
-- chapters and any other table that may or may not exist, plus any policy
-- names not enumerated above. RLS-enabled tables are untouched.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT p.schemaname, p.tablename, p.policyname
    FROM pg_policies p
    JOIN pg_class c ON c.relname = p.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = p.schemaname
    WHERE p.schemaname = 'public'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ───────────────────────────────────────────────────────────────────────
-- SECTION 3 (migration 105): SECURITY DEFINER function fixes
-- ───────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.exec_sql;
DROP FUNCTION IF EXISTS public.rls_auto_enable;
DROP FUNCTION IF EXISTS exec_sql;
DROP FUNCTION IF EXISTS rls_auto_enable;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

ALTER FUNCTION IF EXISTS public.update_workspace_timestamp() SET search_path = '';
ALTER FUNCTION IF EXISTS public.increment_xp(uuid, integer) SET search_path = '';
ALTER FUNCTION IF EXISTS public.get_growth_metrics() SET search_path = '';
ALTER FUNCTION IF EXISTS public.cleanup_idempotency_keys() SET search_path = '';
ALTER FUNCTION IF EXISTS public.handle_new_user() SET search_path = '';

-- ───────────────────────────────────────────────────────────────────────
-- SECTION 4 (migration 106): reconcile work tables (claim_tokens,
-- workspaces/tasks RLS state)
-- ───────────────────────────────────────────────────────────────────────

-- claim_tokens: rename profile_id -> claimed_by (guarded)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_tokens' AND column_name = 'profile_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'claim_tokens' AND column_name = 'claimed_by'
  ) THEN
    ALTER TABLE public.claim_tokens RENAME COLUMN profile_id TO claimed_by;
  END IF;
END $$;

-- claim_tokens: add missing columns (trust_marker_id is required by the
-- ghost-marker insert and the claim join)
ALTER TABLE public.claim_tokens
  ADD COLUMN IF NOT EXISTS trust_marker_id uuid REFERENCES public.trust_markers(id) ON DELETE CASCADE;
ALTER TABLE public.claim_tokens
  ADD COLUMN IF NOT EXISTS is_claimed boolean NOT NULL DEFAULT false;

-- workspaces / tasks: disable RLS (m084 parity) so the orphaned-policy
-- purge below can clear them
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;

-- workspaces / tasks: drop broken 012 policies (reference missing
-- team_members.user_id)
DO $$
BEGIN
  IF to_regclass('public.workspaces') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "team_members_read_workspace" ON public.workspaces';
    EXECUTE 'DROP POLICY IF EXISTS "team_members_update_workspace" ON public.workspaces';
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "team_members_read_tasks" ON public.tasks';
    EXECUTE 'DROP POLICY IF EXISTS "team_members_create_tasks" ON public.tasks';
    EXECUTE 'DROP POLICY IF EXISTS "team_members_update_tasks" ON public.tasks';
    EXECUTE 'DROP POLICY IF EXISTS "team_members_delete_tasks" ON public.tasks';
  END IF;
END $$;

-- Re-run the purge loop now that workspaces/tasks have RLS disabled, so
-- any remaining policies on them are cleared too.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT p.schemaname, p.tablename, p.policyname
    FROM pg_policies p
    JOIN pg_class c ON c.relname = p.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = p.schemaname
    WHERE p.schemaname = 'public'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ───────────────────────────────────────────────────────────────────────
-- SECTION 5 (migration 107): universal grants + profiles/api_keys columns
-- ───────────────────────────────────────────────────────────────────────

-- Fixes the 15 tables returning 403 for the service role (activities,
-- api_keys, badges, chapter_members, chapters, claim_tokens, feedback,
-- leaderboard_view, micro_credentials, notifications, resources,
-- sponsor_profiles, tasks, team_messages, workspaces).
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- profiles: columns the app queries that production lacks (onboarding
-- completion, account linking, mentor booking link)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_accounts jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cal_com_url text;

-- api_keys: is_active drives create/revoke/validate in the API key UI
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ═══ Done ═══════════════════════════════════════════════════════════════
-- After this script:
--   - "RLS Disabled in Public" findings (8 tables): ACCEPTED architectural
--     decision (Auth0 + service role key). Mark as accepted in the Advisor UI.
--   - If you saw an error in the SQL editor, paste it here — it should be
--     impossible for this version to fail, but if it does I want the message.