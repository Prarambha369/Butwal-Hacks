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

COMMENT ON TABLE feedback IS 'User-submitted feedback and bug reports from the floating feedback widget';
COMMENT ON COLUMN feedback.name IS 'Optional display name of the submitter';
COMMENT ON COLUMN feedback.email IS 'Optional email for follow-up';
COMMENT ON COLUMN feedback.category IS 'Type of feedback: bug, feature, improvement, other';
COMMENT ON COLUMN feedback.message IS 'The feedback/bug report body';
COMMENT ON COLUMN feedback.page_url IS 'Page URL where the feedback was submitted from';
COMMENT ON COLUMN feedback.user_agent IS 'Browser user-agent for debugging';

-- Enable RLS (allows anonymous inserts, restricts reads)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit feedback
CREATE POLICY "Anyone can insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Only maintainers can read feedback entries
CREATE POLICY "Maintainers can read feedback" ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = current_clerk_user_id()
        AND profiles.role = 'maintainer'
    )
  );

-- No update or delete policies — feedback is append-only
