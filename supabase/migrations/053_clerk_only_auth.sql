-- Migration: 053_clerk_only_auth
-- Date: 2026-06-29
-- Purpose: Disable Row Level Security on all tables.
-- Context: Clerk is now the sole identity provider. All backend database
-- operations use the Supabase Service Role Key, which bypasses RLS.
-- All auth checks happen in Next.js/Clerk middleware/API routes before
-- hitting the database.
-- RLS policies based on auth.uid() no longer apply since Clerk JWTs
-- are the auth source, not Supabase Auth.

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_contributions DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_nominations DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE trust_markers DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements DISABLE ROW LEVEL SECURITY;
ALTER TABLE impact_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE resource_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE batch_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys DISABLE ROW LEVEL SECURITY;

-- Remove the Supabase Auth trigger on auth.users (no longer needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function if it was created solely for the trigger
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Remove Supabase Auth-specific columns from profiles (if any)
-- Note: clerk_user_id replaces the Supabase auth.uid reference
-- The `id` column in profiles was previously synced with auth.users.id
-- Going forward, we use clerk_user_id for lookups
