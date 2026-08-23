-- Migration: 101_grant_public_table_privileges
-- Date: 2026-08-17
-- Purpose: Fix "permission denied for table workspaces" seen by the service
--          role during E2E. Tables created outside Supabase's default
--          privilege setup (e.g. older tables) lack explicit GRANTs for
--          service_role. Re-apply standard Supabase public-schema grants
--          idempotently, restricted to service_role only.
--
-- Security note: anon/authenticated grants are NOT applied here because
-- RLS is disabled and the service role handles all writes. anon/authenticated
-- only need USAGE on the schema for public reads via Supabase client.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Service role needs full access for backend operations
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Future tables/sequences get service_role access automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
