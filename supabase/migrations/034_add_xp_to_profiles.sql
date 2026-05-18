-- Day 34: The Hacker Journey (XP & Leveling)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.xp IS 'Total experience points earned by the hacker';
