-- 052_idempotency_keys.sql
-- Prevents duplicate mutations from double-submit on event registration and project submission.

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  created_at TIMESTAMZ DEFAULT NOW()
);

-- Auto-expire keys after 24 hours to bound table growth
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- RLS: Only service role can access (server-side only)
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Cleanup function: delete keys older than 24h
CREATE OR REPLACE FUNCTION cleanup_idempotency_keys()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM idempotency_keys WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;
