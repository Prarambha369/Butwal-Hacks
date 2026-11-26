-- 150: the Cloudinary public_id behind an event banner.
--
-- events.banner_url has always held the delivery URL. Photos (114) and
-- partners (139) also keep the asset's public_id, so a binary can be found,
-- replaced or cleaned up without parsing it back out of a URL. Banners now do
-- the same: the save action verifies the uploaded asset with Cloudinary and
-- stores both values.
--
-- Additive and nullable. The public pages read banner_url only, so they are
-- unaffected before and after this runs, and the save action retries without
-- this column on a database that has not applied it yet.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS banner_public_id text;

-- A public_id is a short path ("butwal-hacks/<sub>/<id>"); bound it so the
-- column cannot be used as free-form storage. NOT VALID + VALIDATE per the
-- repo convention for table checks.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_banner_public_id_length'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_banner_public_id_length
      CHECK (banner_public_id IS NULL OR char_length(banner_public_id) BETWEEN 1 AND 300) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.events VALIDATE CONSTRAINT events_banner_public_id_length;

COMMENT ON COLUMN public.events.banner_public_id IS
  'Cloudinary public_id of the banner in banner_url; null when the event has no banner or it predates migration 150.';
