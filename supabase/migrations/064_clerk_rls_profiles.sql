-- Migration: 064_clerk_rls_profiles
-- Date: 2026-07-03
-- Purpose: Re-enable Row Level Security on the profiles table with
--          Clerk-compatible policies.
--
-- Context: Migration 053 disabled RLS on all tables because Clerk replaced
--          Supabase Auth. At that point auth.uid() no longer applied since
--          Clerk JWTs use a different subject format (user_xxx vs UUID).
--
--          This migration re-enables RLS on profiles with policies that use
--          auth.jwt() ->> 'sub' instead of auth.uid(). When a Clerk JWT is
--          passed to Supabase (via Authorization header), auth.jwt() returns
--          the decoded payload and the 'sub' claim contains the Clerk user ID.
--
-- Requirements:
--   1. Clerk Supabase JWT template must be configured in Clerk Dashboard
--      (Settings → JWT Templates → New → Supabase) with the default claims.
--   2. The JWT template's signing key must match Supabase's JWT secret
--      (Settings → API → JWT Secret in Supabase Dashboard).
--
-- Note: Other tables remain RLS-disabled for now. They can be re-enabled
--       incrementally following the same pattern.

-- ─── Helper: get the current Clerk user ID from the request JWT ─────────────
-- Returns the 'sub' claim from the Clerk JWT (e.g. 'user_2abc123')
-- Returns NULL if no authenticated request (anon key only)
CREATE OR REPLACE FUNCTION public.current_clerk_user_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::text;
$$;

-- ─── Re-enable RLS on profiles ──────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ─── Drop old policies (from 001_initial_schema) ────────────────────────────
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;

-- ─── New Clerk-compatible policies ──────────────────────────────────────────

-- SELECT: Public profiles are readable by everyone (including unauthenticated)
-- Only suspeneded profiles are hidden
CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT
  USING (NOT is_suspended);

-- UPDATE: Users can update their own profile
-- Uses current_clerk_user_id() which reads from the incoming JWT
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (clerk_user_id = current_clerk_user_id());

-- INSERT: Users can insert their own profile during onboarding
-- Allows the post-signup profile completion flow
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (clerk_user_id = current_clerk_user_id());

-- Note: DELETE is intentionally not granted. Profile deletion is handled
-- via the Clerk webhook (service role) for data integrity.
