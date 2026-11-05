-- Migration: 141_missing_indexes_and_sponsorship_policy_merge.sql
--
-- Missing foreign-key / lookup indexes plus a duplicate-SELECT-policy merge
-- on event_sponsorships. Additive only; no table shapes change.
--
-- Indexes (all IF NOT EXISTS, so re-running is a no-op):
--
--   certificate_deliveries_template_id_idx
--     ON certificate_deliveries (template_id). There was no index on the
--     template_id FK (126), so any lookup/join by template scanned the
--     deliveries table. Sequences seq scan -> index scan. SET NULL on
--     template delete also has a FK to maintain. Plain btree, not partial.
--
--   certificate_templates_created_by_idx
--     ON certificate_templates (created_by). No index on the created_by FK
--     (126). Same missing-index gap as above. Plain btree, not partial.
--
--   event_sponsorships_verified_by_idx
--     ON event_sponsorships (verified_by). 127 indexed (event_id),
--     (sponsor_profile_id) and (sponsor_profile_id, status) partial, but
--     never verified_by -- the column every audit/verification lookup keys
--     off. Plain btree on (verified_by); deliberately NOT partial
--     (WHERE verified_by IS NOT NULL) because a partial unique index
--     cannot serve as an ON CONFLICT arbiter; a plain index needs no
--     arbiter role here, so WHERE is kept off for maximal simplicity.
--
-- Policy merge on event_sponsorships (duplicate SELECT policies -> one):
--
--   127 created TWO FOR SELECT policies on event_sponsorships:
--     "Sponsors can view own event sponsorships"
--       USING (sponsor_profile_id IN (
--         SELECT id FROM sponsor_profiles WHERE profile_id = current_profile_id()))
--     "Verified sponsorships are readable"
--       USING (status = 'verified')
--
--   Postgres permits multiple permissive policies of the same command; rows
--   matching ANY are visible. Having two is legal but noisy and easy to
--   drift: an edit to one policy site no longer reflects the full read
--   surface. This migration drops both and recreates a single SELECT policy
--   with the exact OR union of the two 127 USING clauses:
--
--     "Sponsors can view own or verified event sponsorships"
--       USING (status = 'verified' OR sponsor_profile_id IN (...))
--
--   Exact USING clauses reconstructed from 127_event_sponsorships.sql
--   (lines 138-165) — no predicate invented or altered. The OR operands are
--   the refactored equivalents of the two original USING bodies, so the
--   visible row set is identical: sponsor-own rows (any status) UNION
--   verified rows (any sponsor).
--
-- auth.jwt(): no new RLS policy introduced here re-derives identity inline;
--   the merged CREATE POLICY reuses current_profile_id(), the function 127
--   defined from auth.jwt() ->> 'sub'. No auth.uid() pattern is copied.
--
-- NOT VALID: inapplicable — no new constraint is added by this migration.

BEGIN;

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS certificate_deliveries_template_id_idx
  ON public.certificate_deliveries (template_id);

CREATE INDEX IF NOT EXISTS certificate_templates_created_by_idx
  ON public.certificate_templates (created_by);

CREATE INDEX IF NOT EXISTS event_sponsorships_verified_by_idx
  ON public.event_sponsorships (verified_by);

-- ─── Policy merge: duplicate SELECT policies -> single OR union ────────────
-- Using clauses verbatim from 127_event_sponsorships.sql:
--   127 "Sponsors can view own event sponsorships":
--     USING (sponsor_profile_id IN (
--       SELECT id FROM sponsor_profiles WHERE profile_id = current_profile_id()))
--   127 "Verified sponsorships are readable":
--     USING (status = 'verified')

DROP POLICY IF EXISTS "Sponsors can view own event sponsorships" ON public.event_sponsorships;
DROP POLICY IF EXISTS "Verified sponsorships are readable" ON public.event_sponsorships;
-- Idempotent re-runs: drop the merged policy before recreating it.
DROP POLICY IF EXISTS "Sponsors can view own or verified event sponsorships" ON public.event_sponsorships;

CREATE POLICY "Sponsors can view own or verified event sponsorships" ON public.event_sponsorships
  FOR SELECT
  USING (
    status = 'verified'
    OR sponsor_profile_id IN (
      SELECT id FROM sponsor_profiles WHERE profile_id = current_profile_id()
    )
  );

COMMIT;
