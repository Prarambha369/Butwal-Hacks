-- Migration: 106_reconcile_work_tables
-- Date: 2026-09-07
-- Purpose: Reconcile claim_tokens column drift and workspaces/tasks RLS state
--          on databases that never received migrations 054/073/084 (e.g.
--          production, which stopped at ~055).
--
-- Drift found on production (audited 2026-09-07):
--
--   claim_tokens
--     - Has profile_id instead of the canonical claimed_by (migration 054).
--     - Lacks trust_marker_id — the FK the app joins on
--       (issue-marker.ts claimTrustMarker, /claim/[token] page) and inserts
--       (api/v1/issue-marker ghost flow). Without it, ghost marker
--       issuance fails with "column trust_marker_id does not exist".
--     - Lacks is_claimed (migration 054).
--
--   workspaces / tasks
--     - Schemas match the repo (migration 012) exactly. But RLS is still
--       ENABLED (migration 084's DISABLE never ran) and the six policies
--       from migration 012 reference team_members.user_id — a column that
--       does not exist (the table uses profile_id). Disable RLS (the
--       accepted Auth0 + service-role architecture) and drop the broken
--       policies.
--
-- Fully idempotent: no-op on fresh databases (001–105 applied).

-- ─── 1. claim_tokens: rename profile_id -> claimed_by (guarded) ────────
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

-- ─── 2. claim_tokens: add missing columns (m054 parity) ────────────────
ALTER TABLE public.claim_tokens
  ADD COLUMN IF NOT EXISTS trust_marker_id uuid REFERENCES public.trust_markers(id) ON DELETE CASCADE;
ALTER TABLE public.claim_tokens
  ADD COLUMN IF NOT EXISTS is_claimed boolean NOT NULL DEFAULT false;

-- ─── 3. workspaces / tasks: disable RLS (m084 parity) ──────────────────
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;

-- ─── 4. workspaces / tasks: drop broken 012 policies (guarded) ─────────
-- DROP POLICY errors if the table is missing, so guard on to_regclass.
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

-- ─── Notes ─────────────────────────────────────────────────────────────
-- Service-role grants for workspaces/tasks/claim_tokens are added by
-- migration 103 (kept there to avoid duplication).
-- After this migration, workspaces/tasks count toward the accepted
-- "RLS Disabled in Public" advisor decision (Auth0 + service role key).
-- ═══ Done ═══════════════════════════════════════════════════════════════