-- Migration: 113_gallery_moderation
-- Purpose: Make event photos moderatable, cover-selectable, and
-- Cloudinary-manageable.
--   - status: member uploads land pending, invisible until approved.
--   - is_cover (+ partial unique index): maintainer-picked top image
--     per event; home shows covers only.
--   - cloudinary_public_id: added later in 114 (kept separate so
--     applied history stays honest).
--   - anon SELECT: public reads need table grants with RLS disabled.

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;

-- One cover per event. Partial index (only true rows) keeps it cheap.
CREATE UNIQUE INDEX IF NOT EXISTS photos_one_cover_per_event
  ON public.photos (event_id) WHERE is_cover;

GRANT SELECT ON public.photos TO anon;

CREATE INDEX IF NOT EXISTS idx_photos_status ON public.photos (status);
