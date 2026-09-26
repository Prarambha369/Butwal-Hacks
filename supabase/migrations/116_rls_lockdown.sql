-- Migration: 116_rls_lockdown
-- Purpose: Close the world-writable database. Before this migration the
-- anon + authenticated roles held FULL privileges (INSERT/UPDATE/DELETE/
-- TRUNCATE) on every public table with RLS disabled — anyone with the
-- publishable anon key could read profiles (emails, GitHub tokens),
-- api_keys (hashes), claim_tokens, payouts, and rewrite anything.
--
-- Design constraints:
--   - The app authenticates via Auth0, NOT Supabase Auth, so RLS cannot
--     scope rows to a user (auth.uid() is always null over the anon key).
--   - Every direct DB mutation now runs through service-role server
--     actions/API routes with in-code authorization (captain/organizer/
--     maintainer checks). Verified: zero anon-client writes remain.
--   - Browser clients + Realtime still read directly, so genuinely public
--     tables get SELECT policies; everything else is deny-by-default
--     (service_role bypasses RLS, so server paths are unaffected).
--
-- What stays world-readable (documented residuals):
--   - team_messages / tasks / audit_logs: required for Realtime chat,
--     task sync, and the audit feed. Scoping them needs Supabase Auth
--     (future migration); until then they are as open as before, but
--     now explicitly so instead of accidentally.
--   - profiles: readable, but secrets are excluded via COLUMN GRANTS
--     (no email, github_access_token/scope, linked_accounts, last_seen,
--     is_suspended). Any future column defaults to NO access (fail-closed).
--   - event_registrations: ids + flags only (no PII columns exist).
--
-- NOTE for future tables: explicitly GRANT + POLICY them; default
-- privileges below keep anon/authenticated denied on new tables.

-- ─── 1. Strip direct privileges (RLS policies become the only gate) ───
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ─── 2. Least-privilege grants ───
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.project_likes TO anon, authenticated;
GRANT SELECT ON public.teams TO anon, authenticated;
GRANT SELECT ON public.team_members TO anon, authenticated;
GRANT SELECT ON public.team_invites TO anon, authenticated;
GRANT SELECT ON public.event_registrations TO anon, authenticated;
GRANT SELECT ON public.tasks TO anon, authenticated;
GRANT SELECT ON public.team_messages TO anon, authenticated;
GRANT SELECT ON public.audit_logs TO anon, authenticated;
GRANT SELECT ON public.photos TO anon, authenticated;
GRANT SELECT ON public.event_reviews TO anon, authenticated;

-- Profiles: public directory columns only. Secrets (email, OAuth tokens,
-- linked accounts, last_seen, suspension flag) are never granted.
-- auth0_user_id IS granted: client components filter by it (never display
-- it as identity — display uses bh_id/full_name).
GRANT SELECT (
  id, slug_id, bh_id, full_name, avatar_url, bio, role, xp, skills,
  socials, social_links, github_username, looking_for_team, open_to_mentor,
  ai_summary, is_claimed, has_completed_onboarding, auth0_user_id,
  cal_com_url, created_at
) ON public.profiles TO anon, authenticated;

-- ─── 3. Enable RLS on every public table ───
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_micro_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- ─── 4. Public SELECT policies (anon + authenticated) ───
DROP POLICY IF EXISTS events_select_public ON public.events;
CREATE POLICY events_select_public ON public.events
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS projects_select_public ON public.projects;
CREATE POLICY projects_select_public ON public.projects
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS project_likes_select_public ON public.project_likes;
CREATE POLICY project_likes_select_public ON public.project_likes
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS teams_select_public ON public.teams;
CREATE POLICY teams_select_public ON public.teams
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS team_members_select_public ON public.team_members;
CREATE POLICY team_members_select_public ON public.team_members
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS team_invites_select_public ON public.team_invites;
CREATE POLICY team_invites_select_public ON public.team_invites
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS event_registrations_select_public ON public.event_registrations;
CREATE POLICY event_registrations_select_public ON public.event_registrations
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS tasks_select_public ON public.tasks;
CREATE POLICY tasks_select_public ON public.tasks
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS team_messages_select_public ON public.team_messages;
CREATE POLICY team_messages_select_public ON public.team_messages
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS audit_logs_select_public ON public.audit_logs;
CREATE POLICY audit_logs_select_public ON public.audit_logs
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);

-- Moderated content: only approved rows are public. Pending/rejected
-- uploads and reviews stay invisible until a maintainer acts.
DROP POLICY IF EXISTS photos_select_approved ON public.photos;
CREATE POLICY photos_select_approved ON public.photos
  FOR SELECT TO anon, authenticated USING (status = 'approved');
DROP POLICY IF EXISTS event_reviews_select_approved ON public.event_reviews;
CREATE POLICY event_reviews_select_approved ON public.event_reviews
  FOR SELECT TO anon, authenticated USING (status = 'approved');

-- Tables WITHOUT policies (deny-by-default for anon/authenticated;
-- service_role bypasses RLS so server paths keep working):
-- api_keys, claim_tokens, idempotency_keys, knowledge_embeddings,
-- site_config, sponsor_payouts, certificates, notifications,
-- trust_markers, feedback, role_requests, activities, resources,
-- resource_completions, workspaces, micro_credentials,
-- profile_micro_credentials, skills_endorsements, opportunity_applications,
-- project_comments, project_views, project_contributions,
-- project_nominations, chapters, chapter_members, badges, profile_badges,
-- site_content, sponsor_profiles, sponsor_opportunities, daily_stats,
-- impact_reports, profile_roles, batch_jobs.
