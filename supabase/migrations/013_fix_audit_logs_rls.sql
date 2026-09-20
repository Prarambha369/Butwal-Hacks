-- Fix audit_logs RLS permissions
-- The server action uses createServiceClient() (service_role key) but RLS still
-- blocks SELECT/INSERT on audit_logs because the service_role hasn't been granted
-- explicit privileges. Disable RLS and grant full access.
--
-- Run this after migration 073 (disable_rls_service_role.sql) which disables RLS
-- on most tables but may not cover audit_logs.

ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Grant full access to the service_role (used by createServiceClient())
GRANT ALL PRIVILEGES ON TABLE public.audit_logs TO service_role;
-- NOTE: no sequence grant — audit_logs.id is a UUID (gen_random_uuid), so no
-- audit_logs_id_seq exists. The original line errored on fresh chains.

-- Also ensure the anon key can't read audit logs (security)
REVOKE ALL PRIVILEGES ON TABLE public.audit_logs FROM anon, authenticated;
