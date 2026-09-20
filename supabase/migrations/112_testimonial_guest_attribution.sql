-- Migration: 112_testimonial_guest_attribution
-- Purpose: VIP quotes come from people with no platform account. Stuffing
--   fake rows into profiles would inflate member counts, so attribution
--   lives on the review itself. profile_id stays NULL for guest quotes.

ALTER TABLE public.event_reviews
  ADD COLUMN IF NOT EXISTS guest_name TEXT;

ALTER TABLE public.event_reviews
  ADD COLUMN IF NOT EXISTS guest_title TEXT;
