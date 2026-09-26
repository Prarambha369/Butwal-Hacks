-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 123: make the role-request duplicate guard atomic
-- ═══════════════════════════════════════════════════════════════════════════
-- requestRoleUpgrade() does a read-then-write to reject a second pending
-- request for the same role. That sequence is not atomic, so two concurrent
-- submits can both pass the check and both insert. 091's index
-- (idx_role_requests_user_role) is non-unique and cannot prevent this.
--
-- A partial unique index makes the database the authority: at most one PENDING
-- request per (user, role). Approved and rejected rows are excluded, so a user
-- can legitimately request a role again after a rejection.
--
-- Deliberately NOT "CONCURRENTLY": `supabase db push` wraps each migration in
-- a transaction and CONCURRENTLY cannot run inside a transaction block.
-- role_requests is a very low-write table, so a brief ACCESS EXCLUSIVE lock
-- during index build is not a concern.
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: collapse any duplicates the old guard let through.
-- Keeps the earliest request per (user, role) -- the original intent -- and
-- removes later ones. `id` breaks created_at ties so this is deterministic
-- and the unique index below cannot fail on a fresh run.
DELETE FROM public.role_requests AS newer
USING public.role_requests AS older
WHERE newer.status = 'pending'
  AND older.status = 'pending'
  AND newer.auth0_user_id = older.auth0_user_id
  AND newer.requested_role = older.requested_role
  AND (older.created_at, older.id) < (newer.created_at, newer.id);

-- Step 2: enforce one pending request per user per role going forward.
CREATE UNIQUE INDEX IF NOT EXISTS
  idx_role_requests_one_pending_per_role
  ON public.role_requests (auth0_user_id, requested_role)
  WHERE status = 'pending';

COMMENT ON INDEX public.idx_role_requests_one_pending_per_role IS
  'At most one pending role request per user per role. Enforces the duplicate '
  'guard in requestRoleUpgrade(), which the non-unique '
  'idx_role_requests_user_role cannot.';
