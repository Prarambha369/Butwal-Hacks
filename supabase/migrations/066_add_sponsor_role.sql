-- Migration: 066_add_sponsor_role
-- Date: 2026-07-05
-- Purpose: Add 'sponsor' as a valid recruiter/sponsor role to the profiles table.

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check,
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('hacker', 'sponsor', 'organizer', 'maintainer'));

COMMENT ON COLUMN profiles.role IS 'User role: hacker (participant), sponsor (recruiter/partner), organizer (event host), maintainer (admin)';
