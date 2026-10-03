-- 127_event_sponsorships.sql
--
-- Links a sponsor to an event they sponsor, with organizer-side verification.
--
-- Why this table exists: the sponsor access model is "a sponsor may see the
-- projects and people behind an event they sponsored, once the organizer has
-- verified it". There was no way to record that. `sponsor_profiles` points at a
-- profile (a company record), `sponsor_opportunities` are job/bounty postings,
-- and `sponsor_payouts` settle money against an opportunity. None of them
-- references an event, and none had a verification status. So the relationship
-- was unenforceable: it could not be recorded, and therefore could not be
-- checked.
--
-- `status` is the gate. A sponsorship is created 'pending' -- typically by the
-- sponsor or by admin tooling -- and only the organizer of that event (or a
-- maintainer) may move it to 'verified'. Read policies key off 'verified' only,
-- so an unverified sponsorship grants nothing.

BEGIN;

CREATE TABLE IF NOT EXISTS event_sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The event being sponsored. CASCADE: no event, no sponsorship.
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- The sponsor's company record, not the person. A company is what sponsors.
  sponsor_profile_id UUID NOT NULL REFERENCES sponsor_profiles(id) ON DELETE CASCADE,

  -- 'pending' on insert. Only an organizer/maintainer may verify, so a sponsor
  -- cannot vouch for their own sponsorship -- the whole point of the status.
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected')),

  -- Who verified it, and when. Null while pending or after rejection.
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,

  -- Invariant: a verified sponsorship must record who verified it. Enforced
  -- here rather than in the application so a bad write cannot slip through a
  -- code path that forgot the rule.
  CONSTRAINT verified_requires_verifier CHECK (
    status <> 'verified' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)
  ),

  -- One company per event. Re-sponsoring means updating status, not inserting
  -- a second row that would make "is this sponsored?" ambiguous.
  CONSTRAINT one_sponsorship_per_sponsor_per_event UNIQUE (event_id, sponsor_profile_id),

  -- NOTE: "only this event's organizer may verify it" is deliberately NOT a
  -- CHECK constraint. Postgres rejects subqueries in CHECK (verified against a
  -- real 16.15 server while writing this), and the rule needs to read
  -- profiles.role and events.organizer_id. It is enforced by the RLS policy
  -- below instead, which is the layer that can actually see other tables. The
  -- only CHECK that remains is the self-contained one above.

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_sponsorships_event_idx
  ON event_sponsorships (event_id);
CREATE INDEX IF NOT EXISTS event_sponsorships_sponsor_idx
  ON event_sponsorships (sponsor_profile_id);
-- The access path is always "my verified sponsorships", so index the status
-- alongside the sponsor rather than leaving the read policies to scan.
CREATE INDEX IF NOT EXISTS event_sponsorships_verified_lookup_idx
  ON event_sponsorships (sponsor_profile_id, status)
  WHERE status = 'verified';

-- ── updated_at ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_sponsorships_touch ON event_sponsorships;
CREATE TRIGGER event_sponsorships_touch
  BEFORE UPDATE ON event_sponsorships
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Row level security ───────────────────────────────────────────────────
ALTER TABLE event_sponsorships ENABLE ROW LEVEL SECURITY;

-- Helper: the caller's profile id, via the Auth0 'sub' JWT claim. Matches the
-- convention already used by sponsor_profiles so the policies read alike.
CREATE OR REPLACE FUNCTION current_profile_id() RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth0_user_id = (auth.jwt() ->> 'sub');
$$ LANGUAGE sql STABLE;

-- A sponsor may read their OWN company sponsorships, any status -- they need to
-- see that a submission is still pending, otherwise they cannot tell "not
-- submitted" from "rejected".
DROP POLICY IF EXISTS "Sponsors can view own event sponsorships" ON event_sponsorships;
CREATE POLICY "Sponsors can view own event sponsorships" ON event_sponsorships
  FOR SELECT
  USING (
    sponsor_profile_id IN (
      SELECT id FROM sponsor_profiles WHERE profile_id = current_profile_id()
    )
  );

-- A sponsor may propose a sponsorship. Always 'pending' -- the CHECK constraint
-- plus the verify-only policy make it impossible to self-verify.
DROP POLICY IF EXISTS "Sponsors can propose event sponsorships" ON event_sponsorships;
CREATE POLICY "Sponsors can propose event sponsorships" ON event_sponsorships
  FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND sponsor_profile_id IN (
      SELECT id FROM sponsor_profiles WHERE profile_id = current_profile_id()
    )
  );

-- The gate. Verified sponsorships are readable by any signed-in user, because
-- the verified set is what public-facing "who sponsored this event" rendering
-- reads. Unverified rows stay invisible to everyone but the parties above.
DROP POLICY IF EXISTS "Verified sponsorships are readable" ON event_sponsorships;
CREATE POLICY "Verified sponsorships are readable" ON event_sponsorships
  FOR SELECT
  USING (status = 'verified');

-- Only the organizer of that event, or a maintainer, may verify or reject.
--
-- Identity resolves through `current_profile_id()`, not `auth.uid()`. The two
-- are not interchangeable here: this app authenticates with Auth0, so the JWT
-- `sub` is an Auth0 subject, while profiles.id is a generated UUID. Migration
-- 001 writes policies as `profiles.id = auth.uid()` and migration 067 (the
-- sponsor tables) writes `auth.jwt() ->> 'sub' = auth0_user_id`. Only the
-- latter can match a real session here. This migration follows 067 and flags
-- the 001 inconsistency for separate review rather than extending a pattern
-- that cannot resolve an Auth0 session.
DROP POLICY IF EXISTS "Organizers verify own event sponsorships" ON event_sponsorships;
CREATE POLICY "Organizers verify own event sponsorships" ON event_sponsorships
  FOR UPDATE
  USING (
    current_profile_id() IN (
      SELECT id FROM profiles
      WHERE role = 'maintainer'
         OR id IN (SELECT organizer_id FROM events WHERE id = event_id)
    )
  )
  WITH CHECK (
    current_profile_id() IN (
      SELECT id FROM profiles
      WHERE role = 'maintainer'
         OR id IN (SELECT organizer_id FROM events WHERE id = event_id)
    )
  );

COMMIT;