-- Migration: 117_function_and_view_hardening
-- Purpose: Close function/view attack surface flagged by advisors.
--
-- 1. SECURITY DEFINER functions were EXECUTEable by PUBLIC (= anon key
--    holders): increment_xp (XP minting), create_profile_with_bh_id,
--    handle_new_user, cleanup_idempotency_keys. All in-app callers use
--    the service role, so PUBLIC execute is revoked. Service paths keep
--    working (service_role retains EXECUTE; DEFINER still bypasses RLS).
-- 2. Mutable search_path on match_knowledge + get_next_task_position.
--    Both use unqualified refs, so the path is pinned (not emptied):
--    match_knowledge needs the vector operators resolvable.
-- 3. vector extension moves public -> extensions (Supabase-recommended
--    schema). pgvector is relocatable; the column type, HNSW index, and
--    operators move together. service_role gets USAGE on the schema.
-- 4. leaderboard_view (materialized) granted anon FULL privileges and has
--    zero code readers — revoked from anon/authenticated entirely.

-- ─── 1. Revoke PUBLIC execute on custom functions ───
REVOKE ALL ON FUNCTION public.cleanup_idempotency_keys() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_profile_with_bh_id(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_xp(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_growth_metrics() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_next_task_position(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.match_knowledge(vector, double precision, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_workspace_timestamp() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_idempotency_keys() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_profile_with_bh_id(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_xp(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_growth_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_next_task_position(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.match_knowledge(vector, double precision, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_workspace_timestamp() TO service_role;

-- ─── 2. Move vector extension out of public ───
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- ─── 3. Pin search paths (after the move, so operators resolve) ───
-- NOTE: schema-qualified type below — unqualified `vector` no longer
-- resolves once the extension has moved out of public.
ALTER FUNCTION public.match_knowledge(extensions.vector, double precision, integer)
  SET search_path = public, extensions;
ALTER FUNCTION public.get_next_task_position(uuid, text)
  SET search_path = public;

-- ─── 4. leaderboard_view: unreferenced in code, was anon-writable ───
REVOKE ALL ON public.leaderboard_view FROM anon, authenticated;
