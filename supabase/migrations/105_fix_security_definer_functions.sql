-- Migration: 105_fix_security_definer_functions
-- Date: 2026-09-07
-- Purpose: Fix SECURITY DEFINER function exposure and mutable search_path,
--          as parity for migration 084 on databases that never received it.
--
-- Background:
--   The Production Security Advisor flags:
--     - Public/Signed-In Users Can Execute SECURITY DEFINER Function
--         exec_sql(), rls_auto_enable(), handle_new_user(), increment_xp(),
--         cleanup_idempotency_keys()
--     - Function Search Path Mutable
--         exec_sql(), update_workspace_timestamp(), increment_xp(),
--         get_growth_metrics(), cleanup_idempotency_keys()
--
--   exec_sql() is the critical one: a SECURITY DEFINER function that runs
--   arbitrary SQL as its owner (supabase_admin/postgres) and is callable by
--   the public role — a remote code execution vector. Migration 084 was
--   written to drop it (plus rls_auto_enable) and revoke EXECUTE from
--   anon/authenticated, but it was never applied to production.
--
--   This migration is fully idempotent and a no-op on fresh databases
--   (001–084 already applied).

-- ─── 1. Drop the ad-hoc SQL executors (m084 parity) ─────────────────────
DROP FUNCTION IF EXISTS public.exec_sql;
DROP FUNCTION IF EXISTS public.rls_auto_enable;
-- Also drop unqualified names (in case they were created via search_path)
DROP FUNCTION IF EXISTS exec_sql;
DROP FUNCTION IF EXISTS rls_auto_enable;

-- ─── 2. Revoke EXECUTE from anon/authenticated (m084 parity) ───────────
-- No-op if there are no functions. This kills the remaining
-- "Public/Signed-In Users Can Execute SECURITY DEFINER Function" findings
-- (handle_new_user, increment_xp, cleanup_idempotency_keys) without
-- needing to drop functions the app may still call.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- ─── 3. Lock search_path on remaining functions ─────────────────────────
-- SECURITY DEFINER functions with a mutable search_path are hijackable
-- (a user-controlled schema earlier in the path can shadow built-ins).
-- ALTER FUNCTION IF EXISTS is a no-op where the function is absent.
ALTER FUNCTION IF EXISTS public.update_workspace_timestamp() SET search_path = '';
ALTER FUNCTION IF EXISTS public.increment_xp(uuid, integer) SET search_path = '';
ALTER FUNCTION IF EXISTS public.get_growth_metrics() SET search_path = '';
ALTER FUNCTION IF EXISTS public.cleanup_idempotency_keys() SET search_path = '';
ALTER FUNCTION IF EXISTS public.handle_new_user() SET search_path = '';

-- ─── Notes ─────────────────────────────────────────────────────────────
-- handle_new_user() and its trigger (m002/m006) target auth.users, which
-- does not exist in the Auth0-only setup. It is retained for environments
-- that still use Supabase Auth; it is now unusable by anon/authenticated
-- after the REVOKE above. Drop it explicitly if this project is 100% Auth0:
--   DROP FUNCTION IF EXISTS public.handle_new_user();
-- ═══ Done ═══════════════════════════════════════════════════════════════