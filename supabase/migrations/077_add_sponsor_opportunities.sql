-- Migration: 077_add_sponsor_opportunities.sql
-- Date: 2026-07-09
-- Purpose: Create sponsor_opportunities table for job/internship/grant/bounty listings
-- and an applications table for hackers to express interest.

CREATE TABLE IF NOT EXISTS sponsor_opportunities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_profile_id uuid NOT NULL REFERENCES sponsor_profiles(profile_id) ON DELETE CASCADE,
  title             text NOT NULL CHECK (char_length(title) >= 3),
  description       text NOT NULL CHECK (char_length(description) >= 10),
  type              text NOT NULL CHECK (type IN ('job', 'internship', 'grant', 'bounty', 'other')),
  compensation      text DEFAULT '',
  currency          text DEFAULT 'USD',
  location          text DEFAULT '',
  is_remote         boolean DEFAULT false,
  skills_required   text[] DEFAULT '{}',
  application_url   text DEFAULT '',
  application_deadline timestamptz,
  is_active         boolean DEFAULT true,
  is_bounty         boolean DEFAULT false,
  bounty_amount     numeric(12,2),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE sponsor_opportunities IS 'Job/internship/grant/bounty listings posted by sponsors';
COMMENT ON COLUMN sponsor_opportunities.type IS 'job, internship, grant, bounty, or other';
COMMENT ON COLUMN sponsor_opportunities.is_bounty IS 'If true, listed on the public Bounty Board';
COMMENT ON COLUMN sponsor_opportunities.bounty_amount IS 'Monetary reward for bounty completions';

-- Track hacker interest/applications
CREATE TABLE IF NOT EXISTS opportunity_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id    uuid NOT NULL REFERENCES sponsor_opportunities(id) ON DELETE CASCADE,
  profile_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message           text,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, profile_id)
);

COMMENT ON TABLE opportunity_applications IS 'Hacker applications/expressions of interest for sponsor opportunities';

-- RLS: disable since we use service_role for all server actions
ALTER TABLE sponsor_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_applications DISABLE ROW LEVEL SECURITY;

-- Index for public listing queries
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON sponsor_opportunities(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_bounty ON sponsor_opportunities(is_bounty, is_active) WHERE is_bounty = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_opportunities_sponsor ON sponsor_opportunities(sponsor_profile_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON opportunity_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_profile ON opportunity_applications(profile_id);
