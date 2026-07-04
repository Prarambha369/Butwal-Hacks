-- Migration: 083_add_api_keys_prefix.sql
-- Date: 2026-07-13
-- Purpose: Add prefix column to api_keys table for display purposes
--
-- The prefix stores the first 8 characters of the API key for UI display,
-- allowing users to identify which key is which without exposing the full key.
-- The full key hash (sha256) is stored in key_hash for authentication.

ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS prefix TEXT;

COMMENT ON COLUMN public.api_keys.prefix IS 'First 8 chars of the API key for identification in UI. Not a secret.';

-- Index for quick lookups by prefix
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys (prefix);
