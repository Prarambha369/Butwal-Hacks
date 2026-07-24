-- Day 521: GitHub Deep Sync — store repo metadata on projects
-- Allows the Hacker ID profile to display commit counts, stars, and README previews.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS github_meta JSONB DEFAULT NULL;

COMMENT ON COLUMN projects.github_meta IS
  'GitHub repo metadata from deep sync. Shape: { stargazers_count, forks_count, commit_count, readme_preview, pushed_at, topics, language }';
