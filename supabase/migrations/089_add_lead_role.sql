-- Migration: 089_add_lead_role
-- Date: 2026-07-16
-- Purpose: Add 'lead' (Chapter Lead) as a valid role alongside hacker, sponsor, organizer, maintainer.
--          This enables Auth0 Roles sync where Auth0 roles (Hacker, Organizer, Maintainer, Sponsors, Lead)
--          are mapped to app-internal roles in the profiles table.

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check,
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('hacker', 'sponsor', 'organizer', 'maintainer', 'lead'));

COMMENT ON COLUMN profiles.role IS 'User role: hacker (participant), sponsor (recruiter/partner), organizer (event host), maintainer (admin), lead (chapter lead)';
