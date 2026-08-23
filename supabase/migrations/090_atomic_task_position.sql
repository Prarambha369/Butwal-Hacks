-- Migration: 090_atomic_task_position
-- Date: 2026-07-19
-- Purpose: Replace read-then-increment task positioning with an atomic
--          database operation using advisory locks. Prevents race conditions
--          when two users create/update tasks in the same status column
--          simultaneously.

-- Atomically compute the next position for a task in a given workspace + status column.
-- Uses pg_try_advisory_xact_lock for concurrency control: if two transactions
-- try to compute the next position simultaneously, one will block until the
-- other completes, ensuring unique sequential positions.
CREATE OR REPLACE FUNCTION get_next_task_position(
  p_workspace_id UUID,
  p_status TEXT
) RETURNS INTEGER
  LANGUAGE plpgsql
  VOLATILE
AS $$
DECLARE
  lock_key BIGINT;
  next_pos INTEGER;
BEGIN
  -- Generate a deterministic lock key from workspace_id (hashed) + status hash
  lock_key := (
    ('x' || substr(md5(p_workspace_id::text || '-' || p_status), 1, 16))::bit(64)::bigint
  );

  -- Acquire a transaction-level advisory lock (released automatically on commit/rollback)
  PERFORM pg_advisory_xact_lock(lock_key);

  -- Read the current max position (safe inside the lock)
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos
  FROM tasks
  WHERE workspace_id = p_workspace_id AND status = p_status;

  RETURN next_pos;
END;
$$;

COMMENT ON FUNCTION get_next_task_position IS
  'Atomically computes the next task position for a workspace+status combination '
  'using advisory locks to prevent race conditions under concurrent access.';
