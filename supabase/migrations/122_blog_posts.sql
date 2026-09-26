-- Migration: 122_blog_posts
-- Purpose: Maintainer-authored blog (replaces the two hardcoded posts).
-- Public reads go through the service-role server action with a static
-- fallback; RLS deny-by-default like partners/chapters.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_image TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts (is_published, published_at DESC);

-- Seed the two posts the static list carried.
INSERT INTO public.blog_posts
  (slug, title, excerpt, body, tags, cover_image, is_published, published_at)
VALUES
  ('why-butwal-needs-community-tech', 'Why Community-Led Tech Learning Matters in Butwal',
   'A practical framework for volunteer-driven mentorship in Nepal''s tech communities.',
   ARRAY['Butwal Hacks is a community where students build real projects and learn from each other. No gatekeeping, no fees — just people who show up to build.',
         'As a nonprofit, we keep our roadmap public and our finances transparent. Every rupee is tracked on Open Collective.'],
   ARRAY['community', 'education', 'mentorship', 'butwal', 'learning'],
   'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200', true, '2026-02-10'),
  ('building-open-mentorship-culture', 'Building an Open Mentorship Culture',
   'What we have learned from setting up volunteer-driven mentorship in Butwal and beyond.',
   ARRAY['Mentorship works best when the community shares ownership. Butwal Hacks helps mentors and learners work together consistently.',
         'Next up: better documentation, more consistent events, and community systems that work for everyone.'],
   ARRAY['mentorship', 'community', 'culture', 'opensource', 'volunteer'],
   'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200', true, '2026-02-18')
ON CONFLICT (slug) DO NOTHING;
