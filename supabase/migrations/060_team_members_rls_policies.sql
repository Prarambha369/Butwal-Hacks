-- Migration: 060_team_members_rls_policies
-- Date: 2026-07-01
-- Purpose: Add RLS policies for team_members table.
-- Context: The team_members table had RLS enabled but ZERO policies,
--          which denied ALL operations for anon and authenticated roles.
--          This broke client-side team management components that do
--          SELECT and INSERT on team_members via the anon key.
--
-- Policies:
--   1. SELECT: Users can view their own team memberships
--   2. INSERT: Users can add themselves to teams
--      (profile_id must match their own auth.uid())

-- Grant base SELECT and INSERT to anon and authenticated roles (needed for
-- client-side operations to reach RLS evaluation)
GRANT SELECT, INSERT ON public.team_members TO anon;
GRANT SELECT, INSERT ON public.team_members TO authenticated;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Users can join teams" ON public.team_members;

-- Users can view their own team memberships
CREATE POLICY "Users can view their team memberships" ON public.team_members
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can add themselves to teams
CREATE POLICY "Users can join teams" ON public.team_members
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
