-- Migration: 094_enable_realtime_audit_logs.sql
-- Date: 2026-07-21
-- Purpose: Enable Realtime publication on the audit_logs table so
--          the Maintainer dashboard receives new entries live
--          without requiring a page refresh.
--
--          New INSERT events are pushed to all connected clients
--          via postgres_changes subscription.

ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
