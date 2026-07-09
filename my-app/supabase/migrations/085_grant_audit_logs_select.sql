-- ═══════════════════════════════════════════════════════════════════════
-- 085_grant_audit_logs_select.sql — Fix service_role permissions
-- ═══════════════════════════════════════════════════════════════════════
--
-- The activity feed (src/lib/actions/activity.ts) queries audit_logs
-- via the service_role client. While RLS is disabled (migration 073),
-- the service_role still needs explicit table-level grants to SELECT.
--
-- Error observed:
--   permission denied for table audit_logs
--   HINT: GRANT SELECT ON public.audit_logs TO service_role;
-- ═══════════════════════════════════════════════════════════════════════

-- Grant SELECT on audit_logs to service_role for the activity feed
GRANT SELECT ON public.audit_logs TO service_role;

-- Also grant SELECT on other tables that the activity feed joins against
GRANT SELECT ON public.profiles TO service_role;

-- ═══ Done ═════════════════════════════════════════════════════════════
