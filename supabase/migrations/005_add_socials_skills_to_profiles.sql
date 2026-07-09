-- Day 24: Add skills and socials to profiles for full onboarding
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS socials jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.skills IS 'Array of technical skills (e.g., ["React", "Python"])';
COMMENT ON COLUMN profiles.socials IS 'JSON object for social links (github, linkedin, twitter, website)';
