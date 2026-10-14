-- Truthful gallery totals.
--
-- The gallery stat bar used to count the rows that happened to be in the
-- fetched page, so a hard query cap made the page understate its own corpus
-- ("100 photos, 0 videos" while 566 were approved). Totals now come from the
-- database instead.
--
-- COUNT(DISTINCT ...) is not expressible through PostgREST, and the naive
-- alternative — fetching every event_id just to Set() them client-side — grows
-- with the corpus. One SQL function gives all three counts, exactly, in a
-- single round trip.
--
-- SECURITY INVOKER (the default) on purpose: this must not be SECURITY
-- DEFINER, since that would hand the function the owner's privileges and
-- become a privilege-escalation surface. The gallery reads through the
-- service client, which already bypasses RLS by design.

CREATE OR REPLACE FUNCTION public.gallery_totals()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'photos', (
      SELECT count(*) FROM public.photos WHERE status = 'approved'
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
  'Counts of approved photos, videos, and distinct events for the public gallery stat bar.';

REVOKE ALL ON FUNCTION public.gallery_totals() FROM anon;
