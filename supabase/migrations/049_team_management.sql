
-- 049_team_management
-- Phase 6: Team Management — Team creation, member management, and dashboard integration

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organizer_id UUID REFERENCES profiles(id) NOT NULL,
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE teams ADD CONSTRAINT teams_organizer_fk FOREIGN KEY (organizer_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add team membership table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT DEFAULT 'member',
  UNIQUE(team_id, profile_id)
);

-- Add column to teams table
ALTER TABLE teams ADD COLUMN max_members INTEGER DEFAULT 10;
