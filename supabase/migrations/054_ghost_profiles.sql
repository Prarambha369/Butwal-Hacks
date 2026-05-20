-- 054_ghost_profiles.sql
-- Ghost Profile & Claim Token System
-- Allows organizers to issue trust markers to emails without existing profiles.
-- Markers are "pending" until the recipient signs up and claims them.

-- 1. Allow trust_markers to exist without a linked profile (for unclaimed markers)
ALTER TABLE trust_markers ALTER COLUMN profile_id DROP NOT NULL;
ALTER TABLE trust_markers ADD COLUMN IF NOT EXISTS claimant_email TEXT;
ALTER TABLE trust_markers ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE;
ALTER TABLE trust_markers ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;
ALTER TABLE trust_markers ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Track claim token lifecycle
CREATE TABLE IF NOT EXISTS claim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  trust_marker_id UUID REFERENCES trust_markers(id) ON DELETE CASCADE,
  is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_by UUID REFERENCES profiles(id),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index for fast lookups by claim_token and email
CREATE INDEX IF NOT EXISTS idx_trust_markers_claim_token ON trust_markers(claim_token);
CREATE INDEX IF NOT EXISTS idx_trust_markers_claimant_email ON trust_markers(claimant_email);
CREATE INDEX IF NOT EXISTS idx_claim_tokens_token ON claim_tokens(token);

COMMENT ON COLUMN trust_markers.claimant_email IS 'Email of the intended recipient (for unclaimed markers)';
COMMENT ON COLUMN trust_markers.claim_token IS 'Unique token for claiming this marker';
COMMENT ON COLUMN trust_markers.claim_expires_at IS 'When the claim token expires';
COMMENT ON COLUMN trust_markers.is_claimed IS 'Whether the marker has been claimed by the recipient';
