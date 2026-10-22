-- 135_policy_consent_and_reports.sql
--
-- Three related pieces of the policy layer:
--
--   1. event_registrations gains the consent columns. A registration now
--      records that the person accepted the Code of Conduct, the Contest
--      Hackathon Rules and the Privacy Policy, which version of the policy text
--      they accepted, and whether they opted into event communications.
--   2. projects gains the submission-side consent: that the rules were
--      accepted, that the code is publicly available, which prize categories
--      the team opted into, and which AI tools were used.
--   3. conduct_reports is a new table for code of conduct and suspected
--      cheating reports, so a report has somewhere to live other than an
--      inbox.
--
-- Why the consent columns are on the row and not in a separate table: the
-- consent belongs to one registration of one person to one event. A separate
-- table would make "what did this person agree to at this event" a join,
-- and joins are where consent records go missing.
--
-- Design constraints:
--   - The app authenticates with Auth0, not Supabase Auth, so RLS cannot
--     scope rows to a session. Every write here goes through a service-role
--     route with an in-code authorization check. The RLS policies below are
--     therefore deny-by-default for anon/authenticated, matching migration
--     116's lockdown.
--   - Consent timestamps are immutable once written. A consent record that
--     can be edited after the fact is not evidence of anything. The
--     marketing opt-in is the exception: it is a preference, and people are
--     allowed to change their mind about it.
--   - Rows that predate this migration have no consent columns set. The
--     CHECK constraint allows that (all three NULL), so old registrations
--     stay valid rather than failing a constraint on a column they never had.

BEGIN;

-- ─── 1. Registration consent ──────────────────────────────────────────────
ALTER TABLE event_registrations
  ADD COLUMN IF NOT EXISTS code_of_conduct_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rules_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS policy_version TEXT,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- All three acceptances are present, or none of them are. A partial consent
-- record is not a state the application should be able to write, and a
-- policy version without acceptances describes nothing.
--
-- NOT VALID then VALIDATE: the constraint is added without scanning the
-- table under an ACCESS EXCLUSIVE lock, then validated separately.
ALTER TABLE event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_consent_complete;
ALTER TABLE event_registrations
  ADD CONSTRAINT event_registrations_consent_complete CHECK (
    (
      code_of_conduct_accepted_at IS NULL
      AND rules_accepted_at IS NULL
      AND privacy_accepted_at IS NULL
      AND policy_version IS NULL
    )
    OR (
      code_of_conduct_accepted_at IS NOT NULL
      AND rules_accepted_at IS NOT NULL
      AND privacy_accepted_at IS NOT NULL
      AND policy_version IS NOT NULL
    )
  ) NOT VALID;
ALTER TABLE event_registrations
  VALIDATE CONSTRAINT event_registrations_consent_complete;

-- Once written, an acceptance cannot be rewritten -- and neither can the
-- policy version, because the version is the record of *which* wording the
-- person agreed to. A row whose version changed while the timestamps stayed
-- put would say "accepted 2026-10-21" about text that is no longer that
-- version's text.
CREATE OR REPLACE FUNCTION event_registrations_consent_immutable() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code_of_conduct_accepted_at IS DISTINCT FROM OLD.code_of_conduct_accepted_at
     OR NEW.rules_accepted_at IS DISTINCT FROM OLD.rules_accepted_at
     OR NEW.privacy_accepted_at IS DISTINCT FROM OLD.privacy_accepted_at
     OR NEW.policy_version IS DISTINCT FROM OLD.policy_version THEN
    RAISE EXCEPTION 'event_registrations consent is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_registrations_consent_immutable ON event_registrations;
CREATE TRIGGER event_registrations_consent_immutable
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION event_registrations_consent_immutable();

-- ─── 2. The consent columns are not public data ────────────────────────────
-- Migration 116 granted SELECT on the whole event_registrations table to
-- anon and authenticated. That grant is table-level, so it covers every
-- column added later -- including the consent timestamps, the policy
-- version, and the marketing opt-in.
--
-- The anon key is a NEXT_PUBLIC_* variable that ships to every browser, so
-- a blanket table grant would turn `marketing_opt_in` into a ready-made
-- mailing list that anyone could select. Replace the blanket grant with a
-- column-level one.
--
-- The columns kept below are the ones the browser client actually reads:
-- the project submission form reads a registrant's own `event_id` and
-- filters on `profile_id`, and nothing else is read from the browser.
REVOKE SELECT ON public.event_registrations FROM anon, authenticated;
GRANT SELECT (
  id, event_id, profile_id, attended, created_at
) ON public.event_registrations TO anon, authenticated;

-- ─── 3. Project submission consent ────────────────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS rules_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_code_attested BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prize_categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_tools TEXT[] NOT NULL DEFAULT '{}';

-- A submitted project either carries the full submission consent or carries
-- none of it. Legacy projects (submitted before this migration) carry none.
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_submission_consent_complete;
ALTER TABLE projects
  ADD CONSTRAINT projects_submission_consent_complete CHECK (
    (rules_accepted_at IS NULL AND public_code_attested = FALSE)
    OR (rules_accepted_at IS NOT NULL AND public_code_attested = TRUE)
  ) NOT VALID;
ALTER TABLE projects
  VALIDATE CONSTRAINT projects_submission_consent_complete;

-- ─── 4. Conduct and cheating reports ──────────────────────────────────────
-- A report has to land somewhere durable. Without a table, reports live in
-- an inbox, and the person who filed one has no way to know it was received
-- or that anything happened.
CREATE TABLE IF NOT EXISTS conduct_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What the report is about. Both are nullable: a report can be about an
  -- event (a general incident) or a project (suspected cheating), and a
  -- project whose event is later deleted must not take the report with it.
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Who filed it. NULL when the person asked to stay anonymous -- the
  -- reporter_anonymous flag is what records that, so a NULL reported_by is
  -- never ambiguous.
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_anonymous BOOLEAN NOT NULL DEFAULT FALSE,

  -- Who the report is about. NULL when the reporter is not sure, or when the
  -- report is about behaviour rather than a person.
  subject_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  category TEXT NOT NULL
    CHECK (category IN ('code_of_conduct', 'cheating', 'other')),

  -- The report itself. A minimum length keeps "this is bad" out of the table:
  -- a review needs something to work with.
  details TEXT NOT NULL
    CHECK (char_length(details) BETWEEN 20 AND 2000),

  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),

  -- What was decided, written down. The reason a decision was made is part
  -- of the record, not an optional extra.
  resolution TEXT,

  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conduct_reports_event_idx
  ON conduct_reports (event_id);
CREATE INDEX IF NOT EXISTS conduct_reports_project_idx
  ON conduct_reports (project_id);
-- The working queue is "open and under review", newest first.
CREATE INDEX IF NOT EXISTS conduct_reports_open_idx
  ON conduct_reports (created_at DESC)
  WHERE status IN ('open', 'under_review');

-- updated_at maintenance, reusing the trigger function migration 127 created.
DROP TRIGGER IF EXISTS conduct_reports_touch ON conduct_reports;
CREATE TRIGGER conduct_reports_touch
  BEFORE UPDATE ON conduct_reports
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Bind the resolver to the acting identity on the transition into a closed
-- status, so a report cannot be closed by someone else's name. Same pattern
-- as event_sponsorships in migration 127.
--
-- One difference from 127: the trigger only fills the resolver in when the
-- caller did not supply one. Every write to this table goes through the
-- service role, and a service-role request carries no Auth0 `sub`, so
-- current_profile_id() -- defined in migration 127 -- would be NULL here,
-- which would then trip the closed_requires_resolution constraint below. The
-- API route resolves the caller from the session and passes the profile id
-- in explicitly; the trigger is the backstop for any path that does not.
CREATE OR REPLACE FUNCTION conduct_reports_bind_resolver() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('resolved', 'dismissed') AND OLD.status NOT IN ('resolved', 'dismissed') THEN
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
    IF NEW.resolved_by IS NULL THEN
      NEW.resolved_by := current_profile_id();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conduct_reports_bind_resolver ON conduct_reports;
CREATE TRIGGER conduct_reports_bind_resolver
  BEFORE UPDATE ON conduct_reports
  FOR EACH ROW EXECUTE FUNCTION conduct_reports_bind_resolver();

-- A closed report must say what was decided and who decided it.
ALTER TABLE conduct_reports
  DROP CONSTRAINT IF EXISTS conduct_reports_closed_requires_resolution;
ALTER TABLE conduct_reports
  ADD CONSTRAINT conduct_reports_closed_requires_resolution CHECK (
    status NOT IN ('resolved', 'dismissed')
    OR (resolution IS NOT NULL AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
  ) NOT VALID;
ALTER TABLE conduct_reports
  VALIDATE CONSTRAINT conduct_reports_closed_requires_resolution;

-- ─── Row level security ───────────────────────────────────────────────────
-- Deny-by-default for anon and authenticated: reports contain names, and
-- they are handled through service-role routes with in-code authorization.
--
-- There is deliberately no "reporter can read their own report" policy. It
-- could not work: this app authenticates with Auth0, so `auth.jwt() ->> 'sub'`
-- is never an Auth0 subject, and current_profile_id() always resolves to
-- NULL over the anon key. A reporter who wants to follow up emails
-- conduct@butwalhacks.com with the reference id the API returned.
ALTER TABLE conduct_reports ENABLE ROW LEVEL SECURITY;

COMMIT;
