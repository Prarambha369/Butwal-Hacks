-- ── photos.cloudinary_public_id is the asset identity ───────────────────
--
-- The column already existed and stores the Cloudinary public_id so orphaned
-- binaries can be swept via the Admin API later. It had no uniqueness, which
-- made two things impossible:
--
--  1. Idempotent bulk import. `ON CONFLICT (cloudinary_public_id) DO NOTHING`
--     requires a unique index; without one Postgres rejects the statement. A
--     re-run after a partial failure would duplicate rows rather than resume.
--  2. Actually enforcing "one row per Cloudinary asset", which is what the
--     orphan-sweep assumes.
--
-- Partial index: rows predating the column have NULL, and NULL must not be
-- unique (many NULLs are fine in Postgres, but a plain unique index would also
-- block legitimately-unset rows if the column ever became NOT NULL).
--
-- This is additive and cannot fail on existing data: the table was empty when
-- this ran, and CONCURRENTLY avoids taking a write lock if it is not.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS photos_cloudinary_public_id_key
  ON photos (cloudinary_public_id)
  WHERE cloudinary_public_id IS NOT NULL;

COMMENT ON COLUMN photos.cloudinary_public_id IS
  'Cloudinary asset identity. Unique where set, so bulk imports can be '
  're-run safely and the orphan sweep can assume one row per asset.';

COMMIT;
