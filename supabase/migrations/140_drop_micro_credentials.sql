-- Migration: 140_drop_micro_credentials.sql
-- Purpose: Retire the micro_credentials / profile_micro_credentials tables
--          (created by 069; Skill Trees removed in PR #58) by archiving them
--          through a RENAME — never a DROP.
--
-- Why archive-rename instead of DROP:
--   A production scan showed this migration had not been applied and both
--   tables still hold rows (8 in micro_credentials, 7 in
--   profile_micro_credentials). A plain DROP would irretrievably lose that
--   data. RENAME keeps every row, index, constraint, FK, policy and grant
--   attached to the table; only the name changes, so nothing is destroyed.
--
-- Why not copy-then-rename:
--   An earlier draft created *_archive_140 tables and then renamed the
--   originals onto those same names, which collides. Copying is also
--   redundant: RENAME already preserves the data in place.
--
-- Recovery (inverse rename, no data re-copy needed):
--   ALTER TABLE public.profile_micro_credentials_archive_140
--     RENAME TO profile_micro_credentials;
--   ALTER TABLE public.micro_credentials_archive_140 RENAME TO micro_credentials;
--
-- Idempotency:
--   This file runs once (migration ledger). If it is re-run the RENAME fails
--   because the archive names already exist — that is intentional, so a
--   half-applied state surfaces instead of being silently skipped.
--
-- NOT VALID: inapplicable — this migration adds no new constraint, so there
--   is nothing to mark NOT VALID.
--
-- auth.jwt(): inapplicable — this is owner DDL (ALTER TABLE ... RENAME) run
--   as the migration role, not a per-row RLS policy. AGENTS.md's
--   auth.jwt() ->> 'sub' rule applies to new RLS policies; none are defined
--   here and the existing policies travel with the renamed table.
--
-- RLS/grant migrations that referenced these tables (073, 116) already ran
-- and use IF EXISTS guards; they are not re-executed after this point.

BEGIN;

-- Archive both tables by renaming them. Data, PKs, FKs, indexes, RLS
-- policies and grants all follow the rename, so the rows stay intact and
-- recoverable. The child table is renamed first to keep the FK's referenced
-- parent name stable for the duration of the statement.
ALTER TABLE public.profile_micro_credentials
  RENAME TO profile_micro_credentials_archive_140;

ALTER TABLE public.micro_credentials
  RENAME TO micro_credentials_archive_140;

COMMIT;
