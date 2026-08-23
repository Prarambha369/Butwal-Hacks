-- Add linked_accounts JSONB column to profiles table
-- Stores linked Auth0 identity info: [{ provider, connection, user_id, email, name, linked_at }]
-- Used for displaying connected social accounts (GitHub, LinkedIn, Google)
-- and for future account linking flows via Auth0 Management API.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS linked_accounts JSONB DEFAULT '[]'::jsonb;

-- Index for querying profiles by linked provider+user_id (useful for webhook handlers)
CREATE INDEX IF NOT EXISTS idx_profiles_linked_accounts_gin ON profiles USING GIN (linked_accounts);

COMMENT ON COLUMN profiles.linked_accounts IS 'Array of linked Auth0 identities. Each entry: { provider, connection, user_id, email, name, linked_at }';
