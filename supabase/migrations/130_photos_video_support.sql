-- ── Event media: images and video in one table ──────────────────────────
--
-- `photos` was image-only, but the gallery has always wanted video: the
-- GalleryPhoto type in my-app/src/app/(main)/gallery/page.tsx has carried a
-- vestigial `duration?: number` since before any video row could exist.
--
-- Rather than a parallel `videos` table (which would double every join,
-- moderation query, and RLS policy for zero conceptual gain), media type is a
-- discriminator on the existing row. A gallery tile is a photo OR a video; it
-- is never anything else.
--
-- Everything here is additive and nullable-with-default, so existing rows keep
-- working untouched while the app learns to read the new columns.

BEGIN;

-- 1. Discriminator. NOT NULL DEFAULT 'image' means the 0 existing rows and
--    every existing INSERT that omits the column are correct without a
--    rewrite. Application code must always set it explicitly on new media.
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

-- 2. Video-only facts. Null on image rows: an image has no duration, and
--    storing 0 would be indistinguishable from "not recorded yet".
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS duration_seconds numeric(10,3);
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS height integer;

-- 3. Constrain the discriminator. NOT VALID + VALIDATE, per the repo
--    convention: the CHECK is enforced for new rows immediately without
--    taking an ACCESS EXCLUSIVE lock on a table the gallery reads on every
--    page load, then validated once.
DO $$ BEGIN
  ALTER TABLE photos
    ADD CONSTRAINT photos_media_type_check
    CHECK (media_type IN ('image', 'video')) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE photos VALIDATE CONSTRAINT photos_media_type_check;

-- 4. duration_seconds is meaningless for images and the app treats a missing
--    duration as "unknown", so reject the contradictory combination rather
--    than letting it rot into UI that renders "NaN:NaN".
DO $$ BEGIN
  ALTER TABLE photos
    ADD CONSTRAINT photos_duration_only_for_video
    CHECK (media_type = 'video' OR duration_seconds IS NULL) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE photos VALIDATE CONSTRAINT photos_duration_only_for_video;

COMMENT ON COLUMN photos.media_type IS
  '''image'' or ''video''. Discriminator for the gallery renderer; see '
  'my-app/src/lib/cloudinary-url.ts for the URL side and '
  'my-app/src/components/gallery/video-tile.tsx for the rendering side.';

COMMENT ON COLUMN photos.duration_seconds IS
  'Video length. NULL for images, and NULL for video when the uploader did '
  'not report it — the UI must render an unknown-duration state, not 0.';

COMMIT;
