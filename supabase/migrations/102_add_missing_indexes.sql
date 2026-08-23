-- Migration: 102_add_missing_indexes
-- Date: 2026-08-24
-- Purpose: Add missing indexes identified during Phase 4 audit of Supabase
--          query patterns. These indexes cover commonly-filtered columns that
--          lacked index support, improving query performance for hot paths.
--
-- Audit methodology:
--   1. Scanned all .from("table").eq("col", val) patterns in my-app/src/
--   2. Cross-referenced against existing indexes in migrations 001-101
--   3. Identified columns queried frequently without index coverage
--
-- What was already covered (no action needed):
--   - profiles: auth0_user_id (partial unique, m100), bh_id (m080),
--     slug_id (unique + m080), is_claimed (m080), role+xp (m080),
--     skills GIN (m080), last_seen (m082), linked_accounts GIN (m095)
--   - team_members: team_id (m084), profile_id (m084), team_id+profile_id (m100)
--   - tasks: workspace_id, status, position composite (m012)
--   - projects: profile_id (m032), created_at (m080), event_id, team_id, created_by (m084)
--   - trust_markers: claim_token, claimant_email (m054), created_at, profile_id (m080), event_id (m084)
--   - event_registrations: event_id (m080/m084), profile_id (m084), UNIQUE(event_id, profile_id) (m001)
--   - api_keys: key_hash UNIQUE (m001), profile_id (m084), prefix (m083)
--   - claim_tokens: token (m054), profile_id (m084)
--   - team_messages: team_id + created_at DESC (m079)
--   - knowledge_embeddings: HNSW vector (m096), content_hash (m097)
--   - sponsor_opportunities: multiple indexes (m077)
--   - feedback: auth0_user_id (m100)
--   - role_requests: status (m089), auth0_user_id+requested_role+status (m089)
--   - profiles.email: UNIQUE constraint (implicit index, m001)

-- ─── 1. team_invites(profile_id) ─────────────────────────────────────
-- Queries: team-invite-list.tsx filters by .eq('profile_id', profileUuid)
--          to show pending invites for the current user.
-- Existing indexes: team_id, inviter_id, invitee_id (m084) — none on profile_id.
CREATE INDEX IF NOT EXISTS idx_team_invites_profile_id
  ON public.team_invites(profile_id);

COMMENT ON INDEX idx_team_invites_profile_id IS
  'Index for invite lookups by profile (team-invite-list.tsx). Covers .eq("profile_id") queries.';

-- ─── 2. event_registrations(event_id, attended) ──────────────────────
-- Queries: events.ts filters by .eq('event_id', eventId).eq('attended', true)
--          to count attendees for event analytics.
-- Existing index: idx_event_registrations_event (event_id only, m080).
-- A composite index including attended avoids scanning all registrations
-- for an event just to filter by attendance status.
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_attended
  ON public.event_registrations(event_id, attended)
  WHERE attended = true;

COMMENT ON INDEX idx_event_registrations_event_attended IS
  'Partial composite index for attendance checks. Covers event analytics queries that filter event_id + attended=true.';

-- ─── 3. knowledge_embeddings(metadata) ────────────────────────────────
-- Queries: embeddings.ts filters by .eq('metadata->>slug', slug)
--          and .eq('metadata->>type', type) to find existing embeddings.
-- Existing indexes: HNSW vector index (m096), content_hash (m097).
-- A GIN index on the metadata JSONB column accelerates ->> lookups.
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_metadata
  ON public.knowledge_embeddings USING GIN (metadata);

COMMENT ON INDEX idx_knowledge_embeddings_metadata IS
  'GIN index on knowledge_embeddings.metadata for JSONB ->> lookups (slug, type filters).';

-- ─── 4. profiles(is_suspended, is_claimed) ────────────────────────────
-- Queries: sitemap.ts filters by .eq('is_claimed', true).eq('is_suspended', false)
--          to generate public profile URLs.
-- Existing index: idx_profiles_is_claimed (is_claimed only, m080).
-- A composite index covering both filters avoids scanning claimed profiles
-- that are suspended.
CREATE INDEX IF NOT EXISTS idx_profiles_claimed_suspended
  ON public.profiles(is_claimed, is_suspended)
  WHERE is_claimed = true;

COMMENT ON INDEX idx_profiles_claimed_suspended IS
  'Partial composite index for sitemap generation. Covers is_claimed + is_suspended filters.';

-- ─── Notes ─────────────────────────────────────────────────────────────
-- Not added (low impact or already covered):
--   - profiles.created_at: Filtered in annual-report/metrics but these are
--     admin-only queries on small result sets. Sequential scan is acceptable.
--   - api_keys(key_hash, is_active): key_hash has UNIQUE constraint (implicit index).
--     is_active is low-cardinality boolean — composite not worth the overhead.
--   - team_invites(team_id, status): team_id already indexed (m084).
--     status is low-cardinality — adding it to composite has marginal benefit.

-- ═══ Done ═══════════════════════════════════════════════════════════════
