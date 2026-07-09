-- Migration: 080_read_replicas_setup.sql
-- Date: 2026-07-09
-- Purpose: Prepare for Supabase Read Replicas by optimizing heavy queries
--
-- Supabase Read Replicas allow you to offload SELECT queries to read-only
-- replicas of your database, reducing load on the primary (writer) instance.
--
-- Key queries that benefit from read replicas:
--   1. Profile lookups by BH-ID (used by embed widget, public pages)
--   2. Hacker discovery search (sponsor dashboard)
--   3. Project listings with joins (explore page, event expo)
--   4. Leaderboard queries (XP ranking)
--   5. Event registration counts (attendee lists)
--
-- For production enablement:
--   supabase branches enable-read-replicas
--   supabase branches set-read-replica-regions --regions us-west-1,eu-west-1
--
-- Connection string for replicas (from Supabase Dashboard → Database):
--   postgresql://postgres.[project-ref]:[password]@[region]-[project-ref]-replica.pooler.supabase.com:6543/postgres
--
-- The service client should point at the replica URL for read-only queries.
-- See: src/lib/actions/ for patterns using `createServiceClient()` which
-- should be adapted to accept a `readOnly` flag.

-- ─── Indexes for Read Replica Performance ────────────────────────────────────

-- Profile BH-ID lookups (high-frequency, embed widget, public pages)
CREATE INDEX IF NOT EXISTS idx_profiles_bh_id ON profiles(bh_id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug_id ON profiles(slug_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth0_user_id ON profiles(auth0_user_id);

-- Hacker discovery (sponsor dashboard — complex queries)
CREATE INDEX IF NOT EXISTS idx_profiles_role_xp ON profiles(role, xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_profiles_is_claimed ON profiles(is_claimed);

-- Project queries (explore, event expo, team portfolios)
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_event_id ON projects(event_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);

-- Event registration counts
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);

-- Trust marker queries (public verification)
CREATE INDEX IF NOT EXISTS idx_trust_markers_created ON trust_markers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_markers_profile ON trust_markers(profile_id);

-- ─── Materialized View for Leaderboard ───────────────────────────────────────
-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_view;
-- This offloads the heavy XP aggregation query from the primary.
-- ponytail: EXISTS check to make the migration idempotent.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'leaderboard_view'
  ) THEN
    CREATE MATERIALIZED VIEW leaderboard_view AS
    SELECT
      id,
      bh_id,
      full_name,
      role,
      xp,
      created_at,
      is_claimed
    FROM profiles
    WHERE xp > 0
    ORDER BY xp DESC;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_view_id ON leaderboard_view(id);
  END IF;
END $$;

COMMENT ON MATERIALIZED VIEW leaderboard_view IS 'Cached XP leaderboard for read replica offloading. Refresh via REFRESH MATERIALIZED VIEW CONCURRENTLY.';
