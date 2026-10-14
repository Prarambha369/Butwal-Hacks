-- Supports the public gallery's paged read (see migration 132 and gallery/page.tsx).
--
-- The query filters status='approved' and orders by created_at DESC, id ASC.
-- Only the single-column idx_photos_status existed, so every "Load more" click
-- sorted the whole table before discarding most of it. At 566 approved rows that
-- is invisible; it stops being invisible as the corpus grows.
--
-- Partial because only approved rows are paged, and the predicate is stable.
--
-- Deliberately NOT CREATE INDEX CONCURRENTLY. The deploy job runs these files
-- through `supabase db push`, and CONCURRENTLY cannot execute inside a
-- transaction block -- if the runner wraps a file in one, the whole migration
-- step dies at deploy time. On a 566-row table the build takes well under a
-- millisecond, so the brief write lock a plain CREATE INDEX takes is not worth
-- trading for that risk. Revisit CONCURRENTLY only when the table grows enough
-- for the build time to matter.
CREATE INDEX IF NOT EXISTS idx_photos_approved_gallery_order
  ON public.photos (created_at DESC, id ASC)
  WHERE status = 'approved';

COMMENT ON INDEX public.idx_photos_approved_gallery_order IS
  'Paging support for the public event gallery: approved rows in display order.';