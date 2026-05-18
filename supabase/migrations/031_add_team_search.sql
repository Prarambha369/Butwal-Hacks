-- Day 31: Teammate Finder / Mentorship Match
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS looking_for_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS open_to_mentor boolean DEFAULT false;

COMMENT ON COLUMN profiles.looking_for_team IS 'If true, the user is actively seeking a team for upcoming events';
COMMENT ON COLUMN profiles.open_to_mentor IS 'If true, the user is available to mentor other hackers';
