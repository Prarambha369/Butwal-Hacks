-- 148: a human-written caption per gallery item.
--
-- The public gallery used the event title as the only text for every tile, so
-- 778 items shared one alt text ("HackDay Butwal") and the lightbox had nothing
-- to say about the photo itself. The caption is optional: rows without one fall
-- back to the event title in the UI.
--
-- Additive and nullable, so existing reads and writes are unaffected.

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS caption text;

-- Keep captions short enough to work as alt text and as an Open Graph
-- description. NOT VALID + VALIDATE per the repo convention for table checks.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'photos_caption_length'
  ) THEN
    ALTER TABLE public.photos
      ADD CONSTRAINT photos_caption_length
      CHECK (caption IS NULL OR char_length(caption) BETWEEN 1 AND 300) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.photos VALIDATE CONSTRAINT photos_caption_length;

COMMENT ON COLUMN public.photos.caption IS
  'Optional one-line caption shown in the gallery and used as alt text; null falls back to the event title.';
