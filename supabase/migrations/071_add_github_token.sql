-- Day: GitHub Sync — Store encrypted GitHub OAuth token for repo auto-import
-- ponytail: Single column, encrypted at rest. Clerk also stores the token,
-- but we cache it here to avoid hitting Clerk's API on every sync.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS github_access_token text,
  ADD COLUMN IF NOT EXISTS github_token_scope text;
