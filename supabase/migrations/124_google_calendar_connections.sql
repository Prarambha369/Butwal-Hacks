-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 124: Google Calendar connection + encrypted token storage
-- ═══════════════════════════════════════════════════════════════════════════
-- Per-user Google Calendar OAuth for calendar.butwalhacks.com.
--
-- A Google refresh token is a long-lived credential: anyone holding it can
-- read and write the user's calendar indefinitely. It is therefore encrypted
-- at rest with a symmetric key that lives in Supabase Vault and is NEVER
-- exposed to the application or the browser.
--
-- The key is read inside SECURITY DEFINER functions, so the plaintext token
-- and the key never appear in the same trust boundary as application code.
-- The app calls encrypt_google_token()/decrypt_google_token() over PostgREST
-- with the service role and never sees the key material.
--
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ─── Encryption key ───────────────────────────────────────────────────
-- Generated once. Re-running keeps the existing key, which is essential:
-- regenerating it would make every already-stored token undecryptable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'google_calendar_token_key'
  ) THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'google_calendar_token_key',
      'pgp_sym key for Google Calendar OAuth tokens. Rotating this invalidates all stored tokens.'
    );
  END IF;
END $$;

-- ─── Encrypt / decrypt helpers ───────────────────────────────────────
-- Exposed as RPC so the key stays inside the database.

CREATE OR REPLACE FUNCTION public.encrypt_google_token(plaintext text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
  SELECT CASE
    WHEN plaintext IS NULL OR plaintext = '' THEN NULL
    ELSE encode(
      extensions.pgp_sym_encrypt(
        plaintext,
        (SELECT decrypted_secret FROM vault.decrypted_secrets
          WHERE name = 'google_calendar_token_key')
      ),
      'escape'
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_google_token(ciphertext text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
  SELECT CASE
    WHEN ciphertext IS NULL OR ciphertext = '' THEN NULL
    ELSE extensions.pgp_sym_decrypt(
      decode(ciphertext, 'escape'),
      (SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'google_calendar_token_key')
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.encrypt_google_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_google_token(text) FROM PUBLIC;
-- service_role only (the app connects with the service role key)
GRANT EXECUTE ON FUNCTION public.encrypt_google_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_google_token(text) TO service_role;

-- ─── updated_at trigger ──────────────────────────────────────────────
-- The rest of the schema only has `DEFAULT now()` with no trigger, so the
-- shared helper is defined here. Reusable by later migrations.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── Connections table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_user_id text NOT NULL UNIQUE,

  -- Encrypted with encrypt_google_token(). Never store these in plaintext.
  refresh_token_enc text,
  access_token_enc text,

  -- Non-secret metadata.
  scopes text,
  google_email text,
  calendar_id text NOT NULL DEFAULT 'primary',

  -- Token lifecycle
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_sync_error text,
  sync_enabled boolean NOT NULL DEFAULT true,

  -- Google-side identifiers for idempotent sync. The sync is create/update
  -- only (never delete), so a revoked or reset calendar self-heals.
  google_event_ids jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.google_calendar_connections.refresh_token_enc IS
  'pgp_sym encrypted. Access only via decrypt_google_token().';
COMMENT ON COLUMN public.google_calendar_connections.google_event_ids IS
  'Map of BH event slug -> Google event id, so re-sync updates in place.';

DROP TRIGGER IF EXISTS google_calendar_connections_updated_at ON public.google_calendar_connections;
CREATE TRIGGER google_calendar_connections_updated_at
  BEFORE UPDATE ON public.google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Sync log ────────────────────────────────────────────────────────
-- Append-only. Gives organizers/maintainers a way to answer "did my event
-- reach anyone's calendar?" without reading logs.
CREATE TABLE IF NOT EXISTS public.google_calendar_sync_log (
  id bigserial PRIMARY KEY,
  auth0_user_id text NOT NULL,
  bh_event_slug text NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'skipped', 'failed')),
  google_event_id text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_log_user
  ON public.google_calendar_sync_log (auth0_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_log_slug
  ON public.google_calendar_sync_log (bh_event_slug, created_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────
-- This table holds encrypted credentials, so RLS is not optional here.
-- The app reaches it only through the service role, which bypasses RLS; the
-- policies below exist to make a direct anon/authenticated read impossible.

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- No anon or authenticated access at all: everything goes through the
-- service role, which is bound to the authenticated user in application code.
DROP POLICY IF EXISTS "google_calendar_connections_no_direct_access" ON public.google_calendar_connections;
CREATE POLICY "google_calendar_connections_no_direct_access"
  ON public.google_calendar_connections
  FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "google_calendar_sync_log_no_direct_access" ON public.google_calendar_sync_log;
CREATE POLICY "google_calendar_sync_log_no_direct_access"
  ON public.google_calendar_sync_log
  FOR ALL
  USING (false)
  WITH CHECK (false);
