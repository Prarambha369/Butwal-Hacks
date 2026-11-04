-- Migration: 140_drop_micro_credentials.sql
-- Purpose: Archive the micro_credentials / profile_micro_credentials tables
--          (069 created them; Skill Trees removed in PR #58) via guarded
--          archive-rename (NOT plain DROP).
--
-- Why archive-rename, not DROP:
--   A production scan showed mig 140 was NOT applied and these tables hold
--   8 (micro_credentials) + 7 (profile_micro_credentials) rows — a plain
--   DROP would irretrievably lose that data. This migration renames both
--   tables to *_archive_140 instead of dropping them, preserving every row.
--   Task statement: "production scan showed mig140 not applied and tables
--   have 8+7 rows so plain DROP would lose data."
--
-- Guard:
--   The BEGIN block below refuses to run while either table is non-empty:
--   counts are read inside DO $$ and if either count > 0 it raises an
--   exception with both counts, aborting the transaction before any rename.
--   When the guard passes (both empty), RENAME preserves the rows as an
--   archive rather than deleting them — the guard makes the rename safe,
--   the archive makes it recoverable.
--
-- Recovery (inverse rename):
--   ALTER TABLE public.profile_micro_credentials_archive_140 RENAME TO profile_micro_credentials;
--   ALTER TABLE public.micro_credentials_archive_140 RENAME TO micro_credentials;
--
-- NOT VALID: inapplicable — this migration adds no new constraint, so there
--   is nothing to mark NOT VALID. No rows are scanned, nothing is dropped.
--
-- auth.jwt(): not needed — this is owner DDL (ALTER TABLE ... RENAME) run
--   as the migration role, not per-row RLS. No SELECT policy or JWT claim
--   lookup is required for DDL; AGENTS.md's auth.jwt() ->> 'sub' rule
--   applies to new RLS policies, of which this migration defines none.
--
-- RLS/grant migrations referencing these tables (073, 116) use IF EXISTS
-- guards, so they become harmless no-ops after the rename. No edit needed.

BEGIN;

-- Guard: refuse to archive if either table currently holds data. The counts
-- are embedded in the exception message so an operator seeing the failure
-- knows exactly how many rows must be migrated or cleared first.
DO $$
DECLARE
  v_micro_count bigint;
  v_profile_count bigint;
BEGIN
  SELECT count(*) INTO v_micro_count FROM public.micro_credentials;
  SELECT count(*) INTO v_profile_count FROM public.profile_micro_credentials;

  IF v_micro_count > 0 OR v_profile_count > 0 THEN
    RAISE EXCEPTION
      'Migration 140 guarded: refusing to archive-rename non-empty tables. '
      'public.micro_credentials has % rows, public.profile_micro_credentials has % rows. '
      'Migrate or clear the rows first, then re-run.',
      v_micro_count, v_profile_count;
  END IF;
END $$;

ALTER TABLE public.profile_micro_credentials RENAME TO profile_micro_credentials_archive_140;
ALTER TABLE public.micro_credentials RENAME TO micro_credentials_archive_140;

COMMIT;
