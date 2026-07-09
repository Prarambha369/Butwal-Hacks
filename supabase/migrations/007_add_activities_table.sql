-- Day 28: Community Wall Activity Feed
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('onboarding', 'registration', 'achievement')),
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast retrieval of latest activity
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
