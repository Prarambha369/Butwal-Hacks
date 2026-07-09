-- Day 24: Add Hacker ID (BH-ID) and full name to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS bh_id text UNIQUE;

-- Update the is_claimed logic: a profile is claimed once they have a bh_id
COMMENT ON COLUMN profiles.bh_id IS 'The unique Butwal Hacks ID (e.g., BH-26-001)';
