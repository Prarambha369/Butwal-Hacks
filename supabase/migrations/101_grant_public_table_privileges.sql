-- Migration: 101_grant_public_table_privileges
-- Date: 2026-08-17
-- Purpose: Fix "permission denied for table workspaces" seen by the service
--          role during E2E. Tables created outside Supabase's default
--          privilege setup (e.g. older tables) lack explicit GRANTs for
--          anon / authenticated / service_role. Re-apply the standard
--          Supabase public-schema grants idempotently.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO anon, authenticated, service_role;
