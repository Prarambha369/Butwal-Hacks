-- ═══════════════════════════════════════════════════════════════════════
-- 084_fix_supabase_security.sql — Security Audit Remediation
-- ═══════════════════════════════════════════════════════════════════════
--
-- Addresses all findings from the Supabase project security audit:
--
-- 🔴 CRITICAL
--   1. exec_sql is SECURITY DEFINER and callable by anon — DROP
--   2. rls_auto_enable is SECURITY DEFINER and callable by anon — DROP
--
-- 🟡 HIGH
--   3. update_workspace_timestamp has mutable search_path — FIX
--   4. tasks + workspaces have RLS enabled but no useful policies — DISABLE
--   5. Orphaned RLS policies on RLS-disabled tables — DROP
--
-- 🟢 LOW
--   6. Add foreign key indexes for performance
--
-- All statements use IF EXISTS / IF NOT EXISTS so they are safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Drop dangerous SECURITY DEFINER functions ─────────────────────
-- These functions allow anonymous users to execute arbitrary SQL.
-- They were migration helpers and must never exist in production.

DROP FUNCTION IF EXISTS public.exec_sql;
DROP FUNCTION IF EXISTS public.rls_auto_enable;

-- ─── 2. Fix mutable search_path on remaining trigger functions ─────────
-- Without SET search_path, an attacker who creates objects in a schema
-- earlier in the search path can hijack function execution.

CREATE OR REPLACE FUNCTION public.update_workspace_timestamp()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 3. Disable RLS on remaining tables (consistency with migration 073) ──
-- The entire platform uses Auth0 + Service Role Key for auth. RLS is
-- intentionally disabled on all tables. These two were missed in 073.

ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;

-- ─── 4. Drop orphaned RLS policies on RLS-disabled tables ──────────────
-- These policies reference auth.jwt() which is not used in this project
-- (Auth0 handles auth). They are dead code on RLS-disabled tables.

-- profiles
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- events
DROP POLICY IF EXISTS "Public read events" ON public.events;
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;

-- projects
DROP POLICY IF EXISTS "Public read projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- project_likes
DROP POLICY IF EXISTS "Public read likes" ON public.project_likes;

-- teams
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

-- team_members
DROP POLICY IF EXISTS "Members can read" ON public.team_members;

-- team_invites
DROP POLICY IF EXISTS "Invitees can read own" ON public.team_invites;

-- trust_markers
DROP POLICY IF EXISTS "Public read trust markers" ON public.trust_markers;

-- certificates
DROP POLICY IF EXISTS "Public read certificates" ON public.certificates;

-- event_registrations
DROP POLICY IF EXISTS "Users can read own registrations" ON public.event_registrations;

-- tasks (from migration 012 — disabled now but policies existed)
DROP POLICY IF EXISTS "team_members_read_tasks" ON public.tasks;
DROP POLICY IF EXISTS "team_members_create_tasks" ON public.tasks;
DROP POLICY IF EXISTS "team_members_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "team_members_delete_tasks" ON public.tasks;

-- workspaces (from migration 012 — disabled now but policies existed)
DROP POLICY IF EXISTS "team_members_read_workspace" ON public.workspaces;
DROP POLICY IF EXISTS "team_members_update_workspace" ON public.workspaces;

-- ─── 5. Add foreign key indexes for performance ────────────────────────
-- The Supabase linter flagged unindexed foreign keys. These indexes
-- speed up JOIN queries on the most commonly joined columns.

-- Event registrations lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
  ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_profile_id
  ON public.event_registrations(profile_id);

-- Project lookups
CREATE INDEX IF NOT EXISTS idx_projects_event_id
  ON public.projects(event_id);
CREATE INDEX IF NOT EXISTS idx_projects_profile_id
  ON public.projects(profile_id);

-- Team lookups
CREATE INDEX IF NOT EXISTS idx_teams_event_id
  ON public.teams(event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id
  ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_profile_id
  ON public.team_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id
  ON public.team_invites(team_id);

-- Trust markers
CREATE INDEX IF NOT EXISTS idx_trust_markers_profile_id
  ON public.trust_markers(profile_id);
CREATE INDEX IF NOT EXISTS idx_trust_markers_issuer_id
  ON public.trust_markers(issuer_id);

-- Likes
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id
  ON public.project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_profile_id
  ON public.project_likes(profile_id);

-- Events (organizer lookups)
CREATE INDEX IF NOT EXISTS idx_events_organizer_id
  ON public.events(organizer_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id
  ON public.notifications(profile_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
  ON public.audit_logs(actor_id);

-- Certificates
CREATE INDEX IF NOT EXISTS idx_certificates_profile_id
  ON public.certificates(profile_id);

-- Claim tokens
CREATE INDEX IF NOT EXISTS idx_claim_tokens_email
  ON public.claim_tokens(email);

-- Chapters
CREATE INDEX IF NOT EXISTS idx_chapter_members_chapter_id
  ON public.chapter_members(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_members_profile_id
  ON public.chapter_members(profile_id);

-- Sponsor profiles
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_profile_id
  ON public.sponsor_profiles(profile_id);

-- API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_profile_id
  ON public.api_keys(profile_id);

-- Impact reports
CREATE INDEX IF NOT EXISTS idx_impact_reports_project_id
  ON public.impact_reports(project_id);

-- Event reviews
CREATE INDEX IF NOT EXISTS idx_event_reviews_event_id
  ON public.event_reviews(event_id);

-- Activity log
CREATE INDEX IF NOT EXISTS idx_activities_profile_id
  ON public.activities(profile_id);

-- ═══ Done ═════════════════════════════════════════════════════════════
