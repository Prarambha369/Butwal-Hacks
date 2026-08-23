-- Day 601: Mentor Directory — Cal.com integration
-- Adds a field for users to store their Cal.com booking link for mentorship sessions.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cal_com_url TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.cal_com_url IS
  'Cal.com booking link for 1:1 mentorship sessions. Displayed on the Mentor Directory page.';
