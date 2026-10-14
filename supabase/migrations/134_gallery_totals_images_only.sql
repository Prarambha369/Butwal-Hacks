-- Correct the gallery stat bar's photo count.
--
-- Migration 132 computed `photos` as every approved row and `videos` as the
-- approved subset with media_type = 'video'. That double-counts: a gallery of
-- 547 images and 19 videos reported "566 photos, 19 videos" — 585 for a
-- corpus of 566. `photos` must exclude videos so the two numbers partition
-- the corpus and sum to the real total.
--
-- `media_type` is nullable, so rows that never got the hint written are
-- images. IS DISTINCT FROM treats NULL as "not video", which is the intent:
-- only rows explicitly typed 'video' leave the photo bucket.

CREATE OR REPLACE FUNCTION public.gallery_totals()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'photos', (
      SELECT count(*) FROM public.photos
      WHERE status = 'approved'
        AND media_type IS DISTINCT FROM 'video'
    ),
    'videos', (
      SELECT count(*) FROM public.photos
      WHERE status = 'approved' AND media_type = 'video'
    ),
    'events', (
      -- Events represented in the gallery, not all published events: an event
      -- with no approved media should not inflate the gallery's event count.
      SELECT count(DISTINCT event_id) FROM public.photos
      WHERE status = 'approved' AND event_id IS NOT NULL
    )
  );
$$;

COMMENT ON FUNCTION public.gallery_totals() IS
  'Counts of approved images, videos, and distinct events for the public gallery stat bar. photos and videos partition the corpus and sum to the total.';

REVOKE ALL ON FUNCTION public.gallery_totals() FROM anon;