-- Migration: 084_fix_supabase_security
-- Purpose: Fix all 18 Supabase security advisories
--
--
-- Architecture: Auth0 handles auth. Service Role Key bypasses RLS.
-- RLS is intentionally disabled (migration 073). Orphaned policies
-- from migration 001 are cleaned up here.
-- -- ponytail: rls_disabled_in_public is an ACCEPTED architectural decision.
-- Auth0 handles auth, not Supabase Auth. Service Role Key bypasses RLS.
-- This lint warning will persist in Supabase advisor — must be marked
-- as accepted/resolved in the Supabase Dashboard, not fixed in SQL.

-- ═══════════════════════════════════════════════════════════════════
-- 🔴 MAJOR: Drop SECURITY DEFINER functions callable by anon
-- ═══════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.exec_sql;
DROP FUNCTION IF EXISTS public.rls_auto_enable;

-- Also drop unqualified names (in case created via search_path)
DROP FUNCTION IF EXISTS exec_sql;
DROP FUNCTION IF EXISTS rls_auto_enable;

-- Revoke EXECUTE on all remaining functions from anon/authenticated as safety net
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- 🔴 MAJOR: Drop all orphaned RLS policies from RLS-disabled tables
-- These policies are dead code — RLS is disabled (migration 073) so
-- they never execute. But they trigger Supabase lint warnings.
-- ═══════════════════════════════════════════════════════════════════

-- profiles
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

-- events
DROP POLICY IF EXISTS "Published events viewable" ON public.events;
DROP POLICY IF EXISTS "Organizers insert events" ON public.events;
DROP POLICY IF EXISTS "Organizers update own events" ON public.events;
DROP POLICY IF EXISTS "Public read events" ON public.events;

-- event_registrations
DROP POLICY IF EXISTS "Users view own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users register for events" ON public.event_registrations;

-- teams
DROP POLICY IF EXISTS "Teams viewable" ON public.teams;
DROP POLICY IF EXISTS "Registered hackers create teams" ON public.teams;
DROP POLICY IF EXISTS "Public read teams" ON public.teams;

-- team_members
DROP POLICY IF EXISTS "Team members viewable" ON public.team_members;
DROP POLICY IF EXISTS "Members join teams" ON public.team_members;
DROP POLICY IF EXISTS "Members can leave team" ON public.team_members;

-- team_invites
DROP POLICY IF EXISTS "Users view own invites" ON public.team_invites;
DROP POLICY IF EXISTS "Captains create invites" ON public.team_invites;

-- projects
DROP POLICY IF EXISTS "Projects viewable by all" ON public.projects;
DROP POLICY IF EXISTS "Team members insert projects" ON public.projects;
DROP POLICY IF EXISTS "Public read projects" ON public.projects;

-- project_likes
DROP POLICY IF EXISTS "Users manage own likes" ON public.project_likes;
DROP POLICY IF EXISTS "Public read likes" ON public.project_likes;

-- trust_markers
DROP POLICY IF EXISTS "Non-revoked markers viewable" ON public.trust_markers;
DROP POLICY IF EXISTS "Organizers insert markers" ON public.trust_markers;
DROP POLICY IF EXISTS "Maintainers update markers" ON public.trust_markers;

-- certificates
DROP POLICY IF EXISTS "Users view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Organizers issue certificates" ON public.certificates;

-- feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Maintainers can read feedback" ON public.feedback;

-- audit_logs
DROP POLICY IF EXISTS "Maintainers view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System inserts audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role manage audit logs" ON public.audit_logs;

-- api_keys
DROP POLICY IF EXISTS "Users manage own keys" ON public.api_keys;

-- event_reviews
DROP POLICY IF EXISTS "Users manage own reviews" ON public.event_reviews;

-- photos
DROP POLICY IF EXISTS "Photos viewable" ON public.photos;
DROP POLICY IF EXISTS "Organizers insert photos" ON public.photos;

-- skills_endorsements
DROP POLICY IF EXISTS "Endorsements viewable" ON public.skills_endorsements;
DROP POLICY IF EXISTS "Users endorse others" ON public.skills_endorsements;

-- ═══════════════════════════════════════════════════════════════════
-- 🟡 WARN: Fix mutable search_path on functions
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_workspace_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- ℹ️ INFO: Disable RLS on tables that have it enabled but no policies
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- 🟡 WARN: Add indexes for unindexed foreign keys (performance)
-- These cover the most frequently joined FK columns
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_profile_id ON public.event_registrations (profile_id);
CREATE INDEX IF NOT EXISTS idx_projects_event_id ON public.projects (event_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON public.projects (team_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects (created_by);
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON public.project_likes (project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_profile_id ON public.project_likes (profile_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams (event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_profile_id ON public.team_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON public.team_invites (team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_inviter_id ON public.team_invites (inviter_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_invitee_id ON public.team_invites (invitee_id);
CREATE INDEX IF NOT EXISTS idx_trust_markers_profile_id ON public.trust_markers (profile_id);
CREATE INDEX IF NOT EXISTS idx_trust_markers_issuer_id ON public.trust_markers (issuer_id);
CREATE INDEX IF NOT EXISTS idx_trust_markers_event_id ON public.trust_markers (event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_profile_id ON public.certificates (profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_profile_id ON public.api_keys (profile_id);
CREATE INDEX IF NOT EXISTS idx_claim_tokens_profile_id ON public.claim_tokens (profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications (profile_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos (event_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploader_id ON public.photos (uploader_id);
CREATE INDEX IF NOT EXISTS idx_chapter_members_chapter_id ON public.chapter_members (chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_members_profile_id ON public.chapter_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_profile_id ON public.sponsor_profiles (profile_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_event_id ON public.event_reviews (event_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_profile_id ON public.event_reviews (profile_id);
-- Guard: impact_reports may not exist in all environments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'impact_reports' AND relnamespace = 'public'::regnamespace) THEN
    CREATE INDEX IF NOT EXISTS idx_impact_reports_project_id ON public.impact_reports (project_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- ⚡ Refresh PostgREST schema cache
-- ═══════════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';
