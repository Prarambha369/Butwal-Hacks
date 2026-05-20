-- Migration: 061_team_members_delete_policy
-- Date: 2026-07-01
-- Purpose: Add DELETE RLS policy for team_members table.
-- Context: The team-management.tsx component does client-side DELETE on
--          team_members to allow captains to remove members and users to
--          leave teams. Without a DELETE policy, these operations fail.
--
-- Policy:
--   DELETE: Captains can remove any member from their team, and users can
--           remove themselves (leave the team).

-- Grant DELETE base privilege to anon and authenticated (needed for client-side
-- operations to reach RLS evaluation)
GRANT DELETE ON public.team_members TO anon;
GRANT DELETE ON public.team_members TO authenticated;

-- Drop existing policy if re-running migration
DROP POLICY IF EXISTS "Captains can manage their team roster" ON public.team_members;

CREATE POLICY "Captains can manage their team roster" ON public.team_members
  FOR DELETE
  USING (
    -- Users can remove themselves (leave the team)
    auth.uid() = profile_id
    OR
    -- Captains can remove any member from their team
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.profile_id = auth.uid()
        AND tm.is_captain = true
    )
  );
