-- Migration: 104_drop_orphaned_policies_on_rls_disabled_tables
-- Date: 2026-09-07
-- Purpose: Drop RLS policies that are dead code on tables where RLS is
--          disabled (migrations 073/084), completing the cleanup started
--          in migration 084.
--
-- Background:
--   The platform uses Auth0 for auth and the service role key for all DB
--   access, so RLS is intentionally disabled (migrations 073/084) and
--   app-level authorization enforces roles. Migration 084 dropped the
--   policies created by migration 001, but policies created by LATER
--   migrations (012, 050, 059, 060, 061, 067) were left behind. They are
--   never enforced, and the Supabase Security Advisor flags them as
--   "RLS disabled but policies exist".
--
--   Worse, the six workspaces/tasks policies from migration 012 reference
--   team_members.user_id — a column that does not exist (team_members uses
--   profile_id). Those policies are not just dead code, they are broken.
--
--   This migration is fully idempotent (DROP POLICY IF EXISTS), safe on
--   fresh databases and drifted databases alike.

-- ─── 1. 001-era policies (084 parity) ──────────────────────────────────
-- Included here so this migration is self-sufficient on databases that
-- never received 084's policy cleanup (e.g. production). Idempotent on
-- fresh databases where 084 already dropped them.
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
DROP POLICY IF EXISTS "Maintainers view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System inserts audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role manage audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users manage own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users manage own reviews" ON public.event_reviews;
DROP POLICY IF EXISTS "Photos viewable" ON public.photos;
DROP POLICY IF EXISTS "Organizers insert photos" ON public.photos;
DROP POLICY IF EXISTS "Endorsements viewable" ON public.skills_endorsements;
DROP POLICY IF EXISTS "Users endorse others" ON public.skills_endorsements;

-- ─── 2. Broken policies from 012 (reference missing team_members.user_id) ─
DROP POLICY IF EXISTS "team_members_read_workspace" ON public.workspaces;
DROP POLICY IF EXISTS "team_members_update_workspace" ON public.workspaces;
DROP POLICY IF EXISTS "team_members_read_tasks" ON public.tasks;
DROP POLICY IF EXISTS "team_members_create_tasks" ON public.tasks;
DROP POLICY IF EXISTS "team_members_update_tasks" ON public.tasks;
DROP POLICY IF EXISTS "team_members_delete_tasks" ON public.tasks;

-- ─── 3. Dead policies on RLS-disabled tables (created after 084's cleanup) ─
-- team_members (RLS disabled in 073)
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Users can join teams" ON public.team_members;
DROP POLICY IF EXISTS "Captains can manage their team roster" ON public.team_members;

-- event_registrations (RLS disabled in 073)
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;

-- sponsor_profiles (RLS disabled in 073)
DROP POLICY IF EXISTS "Sponsors can view own company profile" ON public.sponsor_profiles;
DROP POLICY IF EXISTS "Sponsors can create own company profile" ON public.sponsor_profiles;
DROP POLICY IF EXISTS "Sponsors can update own company profile" ON public.sponsor_profiles;
DROP POLICY IF EXISTS "Maintainers can view all sponsor profiles" ON public.sponsor_profiles;

-- chapters / chapter_members (RLS disabled in 073)
DROP POLICY IF EXISTS "Public can read chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can update chapters" ON public.chapters;
DROP POLICY IF EXISTS "Public can read chapter members" ON public.chapter_members;
DROP POLICY IF EXISTS "Users can join chapters" ON public.chapter_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.chapter_members;

-- ─── 4. Production-specific orphans + generic purge (name-agnostic) ─────
-- Production carries policies whose names never appeared in the repo
-- migrations (e.g. "Events are viewable by everyone", "Public reviews read",
-- "Organizers can manage certificates for their events"). Enumeration can't
-- be exhaustive, so as a guarantee this loop drops EVERY policy on every
-- RLS-disabled public table — they are dead code by definition there.
-- Safe on fresh databases: RLS-enabled tables are untouched.
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Public events read" ON public.events;
DROP POLICY IF EXISTS "Public reviews read" ON public.event_reviews;
DROP POLICY IF EXISTS "Users can submit reviews" ON public.event_reviews;
DROP POLICY IF EXISTS "Organizers can manage certificates for their events" ON public.certificates;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;

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

-- ─── Notes ─────────────────────────────────────────────────────────────
-- Remaining Security Advisor findings on this project are expected:
--   rls_disabled_in_public — accepted architectural decision (Auth0 + service
--   role key; see migration 084 header). Mark as accepted in the dashboard.
-- ═══ Done ═══════════════════════════════════════════════════════════════