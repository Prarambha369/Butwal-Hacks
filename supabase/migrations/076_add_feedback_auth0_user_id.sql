-- Migration: 076_add_feedback_auth0_user_id
-- Date: 2026-07-09
-- Purpose: Add auth0_user_id column to feedback table for user attribution,
-- and fix the RLS policy that references the now-removed legacy auth function.

-- Add auth0_user_id column (nullable — anonymous feedback is allowed)
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS auth0_user_id text;

COMMENT ON COLUMN feedback.auth0_user_id IS 'Auth0 user ID of the submitter (null for anonymous feedback)';

-- Drop the old legacy auth-based RLS policy that references current_clerk_user_id()
DROP POLICY IF EXISTS "Maintainers can read feedback" ON feedback;

-- Recreate the maintainer read policy using auth0_user_id
CREATE POLICY "Maintainers can read feedback" ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth0_user_id = current_setting('request.jwt.claims')::json->>'sub'
        AND profiles.role = 'maintainer'
    )
  );
