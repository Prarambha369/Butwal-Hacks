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

-- Enable RLS
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;

-- Sponsors can read their own profile
CREATE POLICY "Sponsors can view own company profile" ON sponsor_profiles
  FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = current_clerk_user_id()
  ));

-- Sponsors can insert their own profile
CREATE POLICY "Sponsors can create own company profile" ON sponsor_profiles
  FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = current_clerk_user_id()
  ));

-- Sponsors can update their own profile
CREATE POLICY "Sponsors can update own company profile" ON sponsor_profiles
  FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM profiles WHERE clerk_user_id = current_clerk_user_id()
  ));

-- Maintainers can read all sponsor profiles
CREATE POLICY "Maintainers can view all sponsor profiles" ON sponsor_profiles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.clerk_user_id = current_clerk_user_id()
      AND profiles.role = 'maintainer'
  ));
