-- Migration: 073_disable_rls_service_role
-- Purpose: Disable Row-Level Security on all application tables.
--
-- Architecture decision: We use the Supabase Service Role Key for ALL database
-- operations. Authentication is handled by WorkOS AuthKit. RLS is unnecessary
-- because:
--   1. Every API route and server action authenticates via WorkOS withAuth()
--      before touching the database.
--   2. The Service Role Key bypasses RLS by design.
--   3. No direct database access is exposed to clients.
--
-- If RLS is ever re-enabled, all policies must be updated to reference
-- workos_user_id instead of clerk_user_id.

-- ponytail: use IF EXISTS so this migration works across environments where
-- some tables may not have been created yet (staging, different branches, etc.)

-- Disable RLS on all application tables
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trust_markers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapter_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sponsor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.micro_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_micro_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.claim_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resources DISABLE ROW LEVEL SECURITY;

-- Drop the Clerk-specific RLS function since we no longer use it
DROP FUNCTION IF EXISTS public.current_clerk_user_id();
DROP FUNCTION IF EXISTS public.current_workos_user_id();
