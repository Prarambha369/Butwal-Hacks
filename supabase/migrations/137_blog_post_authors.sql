-- Migration: 137_blog_post_authors
-- Purpose: let any signed-in member draft a blog post, while keeping
-- publishing a maintainer decision.
--
-- The application talks to this table through the service role, so these
-- policies are not the only gate. They exist so that a future anon/
-- authenticated client (or a direct PostgREST call with a user JWT) cannot
-- read someone else's unpublished draft or flip `is_published` itself.

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_blog_posts_author
  ON public.blog_posts (author_id, created_at DESC);

-- `updated_at` maintenance. `set_updated_at()` is defined in migration 124.
DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row-level security ────────────────────────────────────────────────────
-- RLS is already enabled on this table with no policies, which is why only
-- the service role could touch it. `current_profile_id()` (migration 127)
-- maps the JWT subject to a profile.

-- Anyone may read a published post; an author may read their own draft.
DROP POLICY IF EXISTS "Published posts are public" ON public.blog_posts;
CREATE POLICY "Published posts are public" ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR author_id = current_profile_id());

-- A member may create a draft attributed to themselves, never pre-published.
DROP POLICY IF EXISTS "Members can create own drafts" ON public.blog_posts;
CREATE POLICY "Members can create own drafts" ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = current_profile_id()
    AND is_published = false
  );

-- A member may edit or delete their own draft. The WITH CHECK repeats the
-- `is_published = false` guard so an UPDATE cannot publish as a side effect;
-- once a maintainer publishes it, the author loses write access.
DROP POLICY IF EXISTS "Members can update own drafts" ON public.blog_posts;
CREATE POLICY "Members can update own drafts" ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (author_id = current_profile_id() AND is_published = false)
  WITH CHECK (author_id = current_profile_id() AND is_published = false);

DROP POLICY IF EXISTS "Members can delete own drafts" ON public.blog_posts;
CREATE POLICY "Members can delete own drafts" ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (author_id = current_profile_id() AND is_published = false);
