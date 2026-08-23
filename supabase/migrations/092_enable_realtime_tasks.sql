-- Migration: 092_enable_realtime_tasks.sql
-- Date: 2026-07-20
-- Purpose: Enable Realtime publication on the tasks table for live Kanban sync.
--          When a teammate moves or updates a task, all connected clients
--          receive the change via postgres_changes subscription.

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
