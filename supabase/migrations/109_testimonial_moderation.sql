-- Migration: 109_testimonial_moderation
-- Purpose: Moderation + attribution fields for community testimonials.
--   event_reviews is written by submitEventFeedback but never displayed;
--   these columns let maintainers approve/feature member quotes and
--   author VIP quotes (author_type = 'maintainer') with a source line.
--   Nothing is public until status = 'approved' (enforced in queries).

ALTER TABLE public.event_reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.event_reviews
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.event_reviews
  ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL DEFAULT 'member'
    CHECK (author_type IN ('member', 'maintainer', 'guest'));

ALTER TABLE public.event_reviews
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Constrain rating now that the column gates public display (was nullable,
-- unchecked; submitEventFeedback validates 1-5 server-side as well).
DO $$ BEGIN
  ALTER TABLE public.event_reviews
    ADD CONSTRAINT event_reviews_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_reviews_status ON public.event_reviews (status);
CREATE INDEX IF NOT EXISTS idx_event_reviews_featured ON public.event_reviews (is_featured) WHERE is_featured;
