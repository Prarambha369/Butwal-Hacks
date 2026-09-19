-- Migration: 111_testimonial_nullable_event
-- Purpose: Community testimonials aren't tied to an event, but
--   event_reviews.event_id was NOT NULL. Allow NULL so the community
--   submission form can insert rows without an event.
--   (Post-event feedback in submitEventFeedback still passes an event_id.)

ALTER TABLE public.event_reviews ALTER COLUMN event_id DROP NOT NULL;
