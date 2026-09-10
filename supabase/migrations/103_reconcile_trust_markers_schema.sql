-- Migration: 103_reconcile_trust_markers_schema
-- Date: 2026-09-07
-- Purpose: Reconcile drifted/legacy databases with the canonical trust_markers
--          schema defined in the repo migrations (001, 054, 084).
--
-- Background:
--   Some environments carry a legacy trust_markers design:
--     issued_by    (instead of issuer_id)
--     marker_type  (instead of type)
--     evidence_url (legacy-only column, kept harmlessly)
--   and are missing the columns the app + UI rely on:
--     title, description, event_id, is_revoked, revocation_reason, crypto_signature.
--
--   Consequences on those DBs:
--     - /p/[slug_id] and /profile/[bh_id] 404 (ambiguous trust_markers embed,
--       missing FK hint name) — PGRST201.
--     - Marker issuance fails (INSERT uses issuer_id/title/description/type).
--     - /verify/[markerId] and OB3 assertions cannot work (no crypto_signature).
--
--   This migration is fully idempotent: every statement guards on the existing
--   shape, so it is a no-op on fresh databases (001–102 applied) and heals
--   legacy-drifted databases in place.
--
--   It also fills grant gaps that block the service role on the work
--   distribution and claim flows (workspaces/tasks/claim_tokens were created
--   without service_role GRANTs in migrations 012/054).

-- ─── 1. Column renames (guarded) ────────────────────────────────────────
-- Legacy DBs only. Skip if the target column already exists (fresh DBs).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trust_markers' AND column_name = 'issued_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trust_markers' AND column_name = 'issuer_id'
  ) THEN
    ALTER TABLE public.trust_markers RENAME COLUMN issued_by TO issuer_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trust_markers' AND column_name = 'marker_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trust_markers' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.trust_markers RENAME COLUMN marker_type TO type;
  END IF;
END $$;

-- ─── 2. FK constraint rename (guarded) ──────────────────────────────────
-- The app embeds issuer via profiles!trust_markers_issuer_id_fkey. Legacy
-- DBs name that constraint trust_markers_issued_by_fkey (name survives a
-- column rename), so it must be renamed explicitly.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trust_markers_issued_by_fkey'
      AND conrelid = 'public.trust_markers'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trust_markers_issuer_id_fkey'
      AND conrelid = 'public.trust_markers'::regclass
  ) THEN
    ALTER TABLE public.trust_markers
      RENAME CONSTRAINT trust_markers_issued_by_fkey TO trust_markers_issuer_id_fkey;
  END IF;
END $$;

-- ─── 3. Missing columns (no-op on fresh DBs) ────────────────────────────
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id);
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS is_revoked boolean NOT NULL DEFAULT false;
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS revocation_reason text;
ALTER TABLE public.trust_markers ADD COLUMN IF NOT EXISTS crypto_signature text;

-- ─── 4. Missing indexes (084, no-op if present) ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_trust_markers_issuer_id ON public.trust_markers (issuer_id);
CREATE INDEX IF NOT EXISTS idx_trust_markers_event_id ON public.trust_markers (event_id);

-- ─── 5. Service-role grants (fill 012/054/055 gaps) ─────────────────────
-- The app queries these with the service role key (bypassing RLS), which
-- still requires table-level GRANTs. Without them, PostgREST returns 403.
GRANT ALL ON public.workspaces TO service_role;
GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.claim_tokens TO service_role;
GRANT ALL ON public.trust_markers TO service_role;

COMMENT ON COLUMN public.trust_markers.evidence_url IS
  'Legacy column from the pre-001 trust_markers design. Retained for backwards compatibility; new markers use title/description.';

-- ═══ Done ═══════════════════════════════════════════════════════════════