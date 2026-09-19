-- Migration: 055_grant_service_role_access
-- Date: 2026-06-30
-- Purpose: Grant all necessary privileges to the service_role role on all tables.
-- Context: Migration 053 disabled RLS on all tables. With RLS disabled, access falls
--          back to raw PostgreSQL GRANTs. The Supabase Service Role Key authenticates
--          as the `service_role` PostgreSQL role, which needs explicit permissions.
--          Without these GRANTs, server-side Supabase queries fail with:
--          "permission denied for table <name>"

-- ─── Reconstructed tables ─────────────────────────────────────────────
-- These six tables are queried/granted by the app but no migration ever
-- created them (prod got them via dashboard SQL). Schemas below are
-- reconstructed from code usage (see like-button.tsx, projects.ts,
-- events.ts closeEvent, certificates + notifications routes). The
-- `db diff --linked` output will surface any column-level drift vs prod.
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, profile_id)
);
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS project_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS project_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  auth0_user_id TEXT,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  auth0_user_id TEXT,
  title TEXT,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Second batch, same story: granted below but never created anywhere.
-- Schemas reconstructed from code usage (teams.ts invites, events.ts
-- submitEventFeedback, impact.ts getImpactReport, projects.ts embeds).
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invitee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS impact_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS profile_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant ALL (SELECT, INSERT, UPDATE, DELETE) on all tables to service_role
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.event_registrations TO service_role;
GRANT ALL ON public.team_members TO service_role;
GRANT ALL ON public.teams TO service_role;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.project_likes TO service_role;
GRANT ALL ON public.project_comments TO service_role;
GRANT ALL ON public.project_contributions TO service_role;
GRANT ALL ON public.project_nominations TO service_role;
GRANT ALL ON public.certificates TO service_role;
GRANT ALL ON public.trust_markers TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.activities TO service_role;
GRANT ALL ON public.profile_badges TO service_role;
GRANT ALL ON public.badges TO service_role;
GRANT ALL ON public.skills_endorsements TO service_role; -- NOTE: was skill_endorsements (typo); real table from 001 is skills_endorsements
GRANT ALL ON public.impact_reports TO service_role;
GRANT ALL ON public.resource_completions TO service_role;
GRANT ALL ON public.event_reviews TO service_role;
GRANT ALL ON public.team_invites TO service_role;
GRANT ALL ON public.chapters TO service_role;
GRANT ALL ON public.chapter_members TO service_role;
GRANT ALL ON public.photos TO service_role;
GRANT ALL ON public.api_keys TO service_role;
GRANT ALL ON public.batch_jobs TO service_role;
GRANT ALL ON public.idempotency_keys TO service_role;
GRANT ALL ON public.claim_tokens TO service_role;
GRANT ALL ON public.site_config TO service_role;
GRANT ALL ON public.profile_roles TO service_role;

-- Also grant on sequences (for serial/bigserial columns)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
