-- Migration: 055_grant_service_role_access
-- Date: 2026-06-30
-- Purpose: Grant all necessary privileges to the service_role role on all tables.
-- Context: Migration 053 disabled RLS on all tables. With RLS disabled, access falls
--          back to raw PostgreSQL GRANTs. The Supabase Service Role Key authenticates
--          as the `service_role` PostgreSQL role, which needs explicit permissions.
--          Without these GRANTs, server-side Supabase queries fail with:
--          "permission denied for table <name>"

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
GRANT ALL ON public.skill_endorsements TO service_role;
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
