-- Migration: 067_add_sponsor_profiles
-- Date: 2026-07-05
-- Purpose: Create a sponsor_profiles table for storing company/organization
--          information linked to sponsor role profiles.

CREATE TABLE IF NOT EXISTS sponsor_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  company_name    text NOT NULL DEFAULT '',
  company_website text,
  company_logo_url text,
  description     text,
  locations       text[] DEFAULT '{}',
  industries      text[] DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE sponsor_profiles IS 'Company/organization details for sponsor role profiles';
COMMENT ON COLUMN sponsor_profiles.company_name IS 'Display name of the sponsoring company or organization';
COMMENT ON COLUMN sponsor_profiles.company_website IS 'Company website URL';
COMMENT ON COLUMN sponsor_profiles.company_logo_url IS 'Cloudinary URL for company logo';
COMMENT ON COLUMN sponsor_profiles.description IS 'Brief description of the company/mission';
COMMENT ON COLUMN sponsor_profiles.locations IS 'Array of location strings (e.g. Butwal, Kathmandu)';
COMMENT ON COLUMN sponsor_profiles.industries IS 'Array of industry tags (e.g. Fintech, EdTech, AI)';

-- Ensure auth0_user_id column exists on profiles (created here for RLS policies;
-- fully set up in migration 072 — this is safe because ADD COLUMN IF NOT EXISTS
-- is a no-op if the column already exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth0_user_id TEXT;

-- Enable RLS
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;

-- Sponsors can read their own profile
-- Auth0 user ID comes from JWT 'sub' claim, matched against profiles.auth0_user_id
CREATE POLICY "Sponsors can view own company profile" ON sponsor_profiles
  FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE auth0_user_id = (auth.jwt() ->> 'sub')
  ));

-- Sponsors can insert their own profile
CREATE POLICY "Sponsors can create own company profile" ON sponsor_profiles
  FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE auth0_user_id = (auth.jwt() ->> 'sub')
  ));

-- Sponsors can update their own profile
CREATE POLICY "Sponsors can update own company profile" ON sponsor_profiles
  FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM profiles WHERE auth0_user_id = (auth.jwt() ->> 'sub')
  ));

-- Maintainers can read all sponsor profiles
CREATE POLICY "Maintainers can view all sponsor profiles" ON sponsor_profiles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth0_user_id = (auth.jwt() ->> 'sub')
      AND profiles.role = 'maintainer'
  ));
