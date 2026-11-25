-- Migration: 065_add_feedback_table
-- Date: 2026-07-05
-- Purpose: Create a feedback/bug_reports table for the floating feedback widget.
-- Allows anonymous submissions (no auth required) with basic spam protection.

CREATE TABLE IF NOT EXISTS feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL DEFAULT '',
  email       text,
  category    text NOT NULL DEFAULT 'bug' CHECK (category IN ('bug', 'feature', 'improvement', 'other')),
  message     text NOT NULL CHECK (char_length(message) >= 3),
  page_url    text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Replay guard: on a database where feedback already existed with a
-- different shape, CREATE TABLE IF NOT EXISTS is a no-op and the COMMENTs
-- below would fail. These are no-ops when the columns are present.
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS name       text NOT NULL DEFAULT '';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS email      text;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS category   text NOT NULL DEFAULT 'bug';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS message    text;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS page_url   text;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Same guard for the two CHECKs declared inline above. Names match the ones
-- Postgres generates for a fresh CREATE, so both blocks are no-ops wherever
-- the table was created by this migration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid = 'public.feedback'::regclass AND conname = 'feedback_category_check') THEN
    ALTER TABLE public.feedback ADD CONSTRAINT feedback_category_check
      CHECK (category IN ('bug', 'feature', 'improvement', 'other')) NOT VALID;
    ALTER TABLE public.feedback VALIDATE CONSTRAINT feedback_category_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conrelid = 'public.feedback'::regclass AND conname = 'feedback_message_check') THEN
    ALTER TABLE public.feedback ADD CONSTRAINT feedback_message_check
      CHECK (char_length(message) >= 3) NOT VALID;
    ALTER TABLE public.feedback VALIDATE CONSTRAINT feedback_message_check;
  END IF;
END $$;

COMMENT ON TABLE feedback IS 'User-submitted feedback and bug reports from the floating feedback widget';
COMMENT ON COLUMN feedback.name IS 'Optional display name of the submitter';
COMMENT ON COLUMN feedback.email IS 'Optional email for follow-up';
COMMENT ON COLUMN feedback.category IS 'Type of feedback: bug, feature, improvement, other';
COMMENT ON COLUMN feedback.message IS 'The feedback/bug report body';
COMMENT ON COLUMN feedback.page_url IS 'Page URL where the feedback was submitted from';
COMMENT ON COLUMN feedback.user_agent IS 'Browser user-agent for debugging';

-- Ensure auth0_user_id column exists on profiles (created here for RLS policies;
-- fully set up in migration 072 — this is safe because ADD COLUMN IF NOT EXISTS
-- is a no-op if the column already exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth0_user_id TEXT;

-- Enable RLS (allows anonymous inserts, restricts reads)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedback;
CREATE POLICY "Anyone can insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Only maintainers can read feedback entries
-- Auth0 user ID is available via JWT 'sub' claim, matched against profiles.auth0_user_id
DROP POLICY IF EXISTS "Maintainers can read feedback" ON feedback;
CREATE POLICY "Maintainers can read feedback" ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth0_user_id = (auth.jwt() ->> 'sub')
        AND profiles.role = 'maintainer'
    )
  );

-- No update or delete policies — feedback is append-only
