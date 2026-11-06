-- Migration: 143_repair_schema_drift
-- Date: 2026-11-06
-- Purpose: Reconcile a database whose migration HISTORY says "up to date" while
--          the live schema is missing whole tables and service-role grants.
--
-- ── What this fixes ──────────────────────────────────────────────────────
-- Verified against project lbapbsgwrtwgbetcnpju on 2026-11-06, while the
-- deploy job logged "Remote database is up to date":
--
--   403 (table exists, no service_role grant)
--     chapters, chapter_members, notifications, sponsor_profiles, photos,
--     site_config, activities, badges, feedback, tasks, workspaces,
--     claim_tokens
--
--   404 (table absent, though its migration is recorded as applied)
--     partners (120), blog_posts (122), role_requests (091), site_content (110),
--     certificate_templates + certificate_deliveries (126),
--     event_sponsorships (127), sponsor_opportunities + opportunity_applications
--     (077), sponsor_payouts (081), google_calendar_connections +
--     google_calendar_sync_log (124), knowledge_embeddings (136)
--
-- User-visible symptoms this was hiding: /blog served the hardcoded static
-- fallback because `getPublishedPosts` treats PGRST205 as "no posts yet",
-- /sponsors rendered its empty state because `fetchSponsors` returns [] on
-- error, and the maintainer System Check page reported `Table: chapters` as a
-- failure.
--
-- ── Why a new file instead of re-running the originals ───────────────────
-- `supabase db push` skips a version already present in
-- supabase_migrations.schema_migrations, so the original files will not run
-- again however often the deploy job pushes. This file carries the same DDL
-- with the later ALTERs folded in, so ONE normal deploy heals the schema.
--
-- ── Follow-up the maintainer should still do ─────────────────────────────
-- The history table is still wrong. Once this has been applied, repair the
-- recorded versions so the original files remain the source of truth:
--
--   supabase migration repair --status reverted 077 081 091 110 120 122 124 \
--     126 127 136
--   supabase db push --include-all
--
-- Everything here is idempotent: on a healthy database every statement is a
-- no-op, which is what makes it safe to carry on main.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 0. Extensions ─────────────────────────────────────────────────────────
-- pgcrypto backs the Google Calendar token encryption (124); vector backs the
-- MrBallu knowledge base (136). Both live in `extensions` per migration 117.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ─── 1. Grants for tables that already exist ───────────────────────────────
-- This is the half that fixes the 403s. Grants are additive and idempotent.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ─── 2. Shared helpers ─────────────────────────────────────────────────────
-- set_updated_at() is migration 124's helper, referenced by 137 and 127.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- current_profile_id() is migration 127's JWT-subject resolver. The app
-- authenticates with Auth0, so profiles.id (uuid) is NOT auth.uid(); this maps
-- the `sub` claim through profiles.auth0_user_id.
CREATE OR REPLACE FUNCTION public.current_profile_id() RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE auth0_user_id = (auth.jwt() ->> 'sub');
$$ LANGUAGE sql STABLE;

-- ─── 3. partners (migration 120 + 139) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  cloudinary_public_id TEXT
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_partners_active_order
  ON public.partners (is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_partners_cloudinary_public_id
  ON public.partners (cloudinary_public_id)
  WHERE cloudinary_public_id IS NOT NULL;

-- ─── 4. blog_posts (migration 122 + 137) ───────────────────────────────────
DO $$
DECLARE
  blog_posts_created boolean := to_regclass('public.blog_posts') IS NULL;
BEGIN
IF blog_posts_created THEN
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
  created_at timestamptz NOT NULL DEFAULT now(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  updated_at timestamptz NOT NULL DEFAULT now()
);

END IF;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts (is_published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author
  ON public.blog_posts (author_id, created_at DESC);

DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Policies from 137. Publishing stays a maintainer decision even if a future
-- anon/authenticated client reaches the table directly.
DROP POLICY IF EXISTS "Published posts are public" ON public.blog_posts;
CREATE POLICY "Published posts are public" ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR author_id = current_profile_id());

DROP POLICY IF EXISTS "Members can create own drafts" ON public.blog_posts;
CREATE POLICY "Members can create own drafts" ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = current_profile_id()
    AND is_published = false
  );

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

-- Seed from 122: the same two posts the static list carries, so the page looks
-- identical before and after the drift is repaired. Existing tables retain
-- editorial deletions: seed only when this migration creates the table.
IF blog_posts_created THEN
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
END IF;
END $$;

-- ─── 5. site_content (migration 110) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{"en": "", "ne": ""}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS intentionally disabled per the 073 architecture decision: Auth0 handles
-- auth, service_role bypasses RLS, reads go through server actions.
ALTER TABLE public.site_content DISABLE ROW LEVEL SECURITY;

-- ─── 6. role_requests (migration 091) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_user_id text NOT NULL,
  email text NOT NULL,
  requested_role text NOT NULL CHECK (requested_role IN ('organizer', 'sponsor')),
  message text NOT NULL CHECK (char_length(message) >= 10),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_requests_status ON public.role_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_requests_user_role
  ON public.role_requests(auth0_user_id, requested_role, status);

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.role_requests;
CREATE POLICY "service_role_all" ON public.role_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 7. Sponsor opportunities + applications (migration 077) ───────────────
CREATE TABLE IF NOT EXISTS public.sponsor_opportunities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_profile_id uuid NOT NULL REFERENCES public.sponsor_profiles(profile_id) ON DELETE CASCADE,
  title             text NOT NULL CHECK (char_length(title) >= 3),
  description       text NOT NULL CHECK (char_length(description) >= 10),
  type              text NOT NULL CHECK (type IN ('job', 'internship', 'grant', 'bounty', 'other')),
  compensation      text DEFAULT '',
  currency          text DEFAULT 'USD',
  location          text DEFAULT '',
  is_remote         boolean DEFAULT false,
  skills_required   text[] DEFAULT '{}',
  application_url   text DEFAULT '',
  application_deadline timestamptz,
  is_active         boolean DEFAULT true,
  is_bounty         boolean DEFAULT false,
  bounty_amount     numeric(12,2),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.opportunity_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id    uuid NOT NULL REFERENCES public.sponsor_opportunities(id) ON DELETE CASCADE,
  profile_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message           text,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, profile_id)
);

-- Service-role pattern, consistent with 077: no anon/authenticated access.
ALTER TABLE public.sponsor_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_opportunities_active
  ON public.sponsor_opportunities(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_bounty
  ON public.sponsor_opportunities(is_bounty, is_active)
  WHERE is_bounty = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_opportunities_sponsor
  ON public.sponsor_opportunities(sponsor_profile_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity
  ON public.opportunity_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_profile
  ON public.opportunity_applications(profile_id);

-- ─── 8. Sponsor payouts (migration 081) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sponsor_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID NOT NULL REFERENCES public.sponsor_opportunities(id) ON DELETE CASCADE,
  sponsor_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hacker_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          INTEGER NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  oc_expense_id   TEXT,
  notes           TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsor_payouts DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sponsor_payouts_sponsor
  ON public.sponsor_payouts(sponsor_id, status);
CREATE INDEX IF NOT EXISTS idx_sponsor_payouts_hacker
  ON public.sponsor_payouts(hacker_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_payouts_opportunity
  ON public.sponsor_payouts(opportunity_id);

-- ─── 9. Certificate templates + deliveries (migration 126) ─────────────────
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  background_url text,
  page_width integer NOT NULL DEFAULT 1056 CHECK (page_width BETWEEN 200 AND 5000),
  page_height integer NOT NULL DEFAULT 816 CHECK (page_height BETWEEN 200 AND 5000),
  fields jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(fields) = 'array'),
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_one_global_default
  ON public.certificate_templates ((event_id IS NULL)) WHERE is_default AND event_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_one_default_per_event
  ON public.certificate_templates (event_id)
  WHERE is_default AND event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS certificate_templates_event_idx
  ON public.certificate_templates (event_id);

CREATE TABLE IF NOT EXISTS public.certificate_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid REFERENCES public.certificates(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'download', 'widget')),
  recipient_email text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  downloaded_at timestamptz,
  download_count integer NOT NULL DEFAULT 0 CHECK (download_count >= 0)
);

-- Plain unique index so it can serve as an ON CONFLICT arbiter (see 126).
CREATE UNIQUE INDEX IF NOT EXISTS certificate_deliveries_once_per_channel
  ON public.certificate_deliveries (certificate_id, channel);

CREATE INDEX IF NOT EXISTS certificate_deliveries_event_sent_idx
  ON public.certificate_deliveries (event_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS certificate_deliveries_recipient_email_idx
  ON public.certificate_deliveries (recipient_email);

-- Bonus index from migration 141: no FK index existed on template_id.
CREATE INDEX IF NOT EXISTS certificate_deliveries_template_id_idx
  ON public.certificate_deliveries (template_id);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_deliveries ENABLE ROW LEVEL SECURITY;

-- Organiser data and recipient data: neither belongs in a browser.
REVOKE ALL ON public.certificate_templates FROM anon, authenticated;
REVOKE ALL ON public.certificate_deliveries FROM anon, authenticated;

-- Atomic download counter (126). A read-then-write from the route would lose
-- counts when two people open the same certificate at once.
CREATE OR REPLACE FUNCTION public.record_certificate_download(
  p_certificate_id uuid,
  p_event_id uuid
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.certificate_deliveries
    (certificate_id, event_id, channel, status, downloaded_at, download_count)
  VALUES
    (p_certificate_id, p_event_id, 'download', 'sent', now(), 1)
  ON CONFLICT (certificate_id, channel) DO UPDATE
    SET download_count = public.certificate_deliveries.download_count + 1,
        downloaded_at = now();
$$;

REVOKE ALL ON FUNCTION public.record_certificate_download(uuid, uuid) FROM public, anon, authenticated;

-- ─── 10. event_sponsorships (migration 127) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_profile_id UUID NOT NULL REFERENCES public.sponsor_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  CONSTRAINT verified_requires_verifier CHECK (
    status <> 'verified' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)
  ),
  CONSTRAINT one_sponsorship_per_sponsor_per_event UNIQUE (event_id, sponsor_profile_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_sponsorships_event_idx
  ON public.event_sponsorships (event_id);
CREATE INDEX IF NOT EXISTS event_sponsorships_sponsor_idx
  ON public.event_sponsorships (sponsor_profile_id);
CREATE INDEX IF NOT EXISTS event_sponsorships_verified_lookup_idx
  ON public.event_sponsorships (sponsor_profile_id, status)
  WHERE status = 'verified';

DROP TRIGGER IF EXISTS event_sponsorships_touch ON public.event_sponsorships;
CREATE TRIGGER event_sponsorships_touch
  BEFORE UPDATE ON public.event_sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bind the verifier to the acting identity: an organizer cannot approve on
-- behalf of somebody else.
CREATE OR REPLACE FUNCTION public.bind_event_sponsorship_verifier() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status IS DISTINCT FROM 'verified' THEN
    NEW.verified_by := public.current_profile_id();
    NEW.verified_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_sponsorships_bind_verifier ON public.event_sponsorships;
CREATE TRIGGER event_sponsorships_bind_verifier
  BEFORE UPDATE ON public.event_sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.bind_event_sponsorship_verifier();

-- The (event_id, sponsor_profile_id) pair is the row's identity; letting an
-- UPDATE rewrite it would move a verification to another event or sponsor.
-- RLS WITH CHECK cannot see OLD, so this is a trigger.
CREATE OR REPLACE FUNCTION public.event_sponsorships_immutable_linkage() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_id IS DISTINCT FROM OLD.event_id
     OR NEW.sponsor_profile_id IS DISTINCT FROM OLD.sponsor_profile_id THEN
    RAISE EXCEPTION 'event_sponsorships.event_id and sponsor_profile_id are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_sponsorships_immutable_linkage ON public.event_sponsorships;
CREATE TRIGGER event_sponsorships_immutable_linkage
  BEFORE UPDATE ON public.event_sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.event_sponsorships_immutable_linkage();

ALTER TABLE public.event_sponsorships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sponsors can view own event sponsorships" ON public.event_sponsorships;
CREATE POLICY "Sponsors can view own event sponsorships" ON public.event_sponsorships
  FOR SELECT
  USING (
    sponsor_profile_id IN (
      SELECT id FROM public.sponsor_profiles WHERE profile_id = current_profile_id()
    )
  );

DROP POLICY IF EXISTS "Sponsors can propose event sponsorships" ON public.event_sponsorships;
CREATE POLICY "Sponsors can propose event sponsorships" ON public.event_sponsorships
  FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND sponsor_profile_id IN (
      SELECT id FROM public.sponsor_profiles WHERE profile_id = current_profile_id()
    )
  );

DROP POLICY IF EXISTS "Verified sponsorships are readable" ON public.event_sponsorships;
CREATE POLICY "Verified sponsorships are readable" ON public.event_sponsorships
  FOR SELECT
  USING (status = 'verified');

DROP POLICY IF EXISTS "Organizers verify own event sponsorships" ON public.event_sponsorships;
CREATE POLICY "Organizers verify own event sponsorships" ON public.event_sponsorships
  FOR UPDATE
  USING (
    current_profile_id() IN (
      SELECT id FROM public.profiles
      WHERE role = 'maintainer'
         OR id IN (SELECT organizer_id FROM public.events WHERE id = event_id)
    )
  )
  WITH CHECK (
    current_profile_id() IN (
      SELECT id FROM public.profiles
      WHERE role = 'maintainer'
         OR id IN (SELECT organizer_id FROM public.events WHERE id = event_id)
    )
  );

-- ─── 11. knowledge_embeddings + match_knowledge (migration 136) ────────────
set search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text,
  embedding vector(768),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Older databases may carry a 384-dimensional column from migration 096.
DO $$
BEGIN
  IF (
    SELECT format_type(atttypid, atttypmod)
    FROM pg_attribute
    WHERE attrelid = 'public.knowledge_embeddings'::regclass
      AND attname = 'embedding'
      AND NOT attisdropped
  ) IS DISTINCT FROM 'vector(768)' THEN
    DROP INDEX IF EXISTS public.idx_knowledge_embeddings_hnsw;

    DELETE FROM public.knowledge_embeddings
    WHERE embedding IS NOT NULL
      AND vector_dims(embedding) <> 768;

    ALTER TABLE public.knowledge_embeddings
      ALTER COLUMN embedding TYPE vector(768)
      USING embedding::vector(768);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_hnsw
  ON public.knowledge_embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_embeddings_hash
  ON public.knowledge_embeddings (content_hash)
  WHERE content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_type
  ON public.knowledge_embeddings ((metadata->>'type'));

CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.35,
  match_count int DEFAULT 4
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    ke.id,
    ke.content,
    ke.metadata,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_embeddings ke
  WHERE ke.embedding IS NOT NULL
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT least(match_count, 8);
$$;

ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.knowledge_embeddings FROM anon, authenticated;

reset search_path;

-- ─── 12. Google Calendar connections + sync log (migration 124) ────────────
-- The encryption key lives in Supabase Vault, guarded so this file can still
-- run on a database without the vault schema instead of aborting the push.
DO $$
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE NOTICE '143: vault schema absent — skipping google_calendar_token_key';
  ELSIF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'google_calendar_token_key'
  ) THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'google_calendar_token_key',
      'pgp_sym key for Google Calendar OAuth tokens. Rotating this invalidates all stored tokens.'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE NOTICE '143: vault schema absent — skipping encrypt/decrypt helpers';
    RETURN;
  END IF;

  EXECUTE $sql$
    CREATE OR REPLACE FUNCTION public.encrypt_google_token(plaintext text)
    RETURNS text
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public, vault, extensions
    AS $fn$
      SELECT CASE
        WHEN plaintext IS NULL OR plaintext = '' THEN NULL
        ELSE encode(
          extensions.pgp_sym_encrypt(
            plaintext,
            (SELECT decrypted_secret FROM vault.decrypted_secrets
              WHERE name = 'google_calendar_token_key')
          ),
          'escape'
        )
      END;
    $fn$;

    CREATE OR REPLACE FUNCTION public.decrypt_google_token(ciphertext text)
    RETURNS text
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public, vault, extensions
    AS $fn$
      SELECT CASE
        WHEN ciphertext IS NULL OR ciphertext = '' THEN NULL
        ELSE extensions.pgp_sym_decrypt(
          decode(ciphertext, 'escape'),
          (SELECT decrypted_secret FROM vault.decrypted_secrets
            WHERE name = 'google_calendar_token_key')
        )
      END;
    $fn$;
  $sql$;

  EXECUTE 'REVOKE ALL ON FUNCTION public.encrypt_google_token(text) FROM PUBLIC, anon, authenticated';
  EXECUTE 'REVOKE ALL ON FUNCTION public.decrypt_google_token(text) FROM PUBLIC, anon, authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.encrypt_google_token(text) TO service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.decrypt_google_token(text) TO service_role';
END $$;

CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_user_id text NOT NULL UNIQUE,
  refresh_token_enc text,
  access_token_enc text,
  scopes text,
  google_email text,
  calendar_id text NOT NULL DEFAULT 'primary',
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_sync_error text,
  sync_enabled boolean NOT NULL DEFAULT true,
  google_event_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS google_calendar_connections_updated_at ON public.google_calendar_connections;
CREATE TRIGGER google_calendar_connections_updated_at
  BEFORE UPDATE ON public.google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.google_calendar_sync_log (
  id bigserial PRIMARY KEY,
  auth0_user_id text NOT NULL,
  bh_event_slug text NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'skipped', 'failed')),
  google_event_id text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_log_user
  ON public.google_calendar_sync_log (auth0_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_log_slug
  ON public.google_calendar_sync_log (bh_event_slug, created_at DESC);

-- Both tables hold credentials/audit data: deny direct anon/authenticated
-- access outright and let only the service role through.
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "google_calendar_connections_no_direct_access" ON public.google_calendar_connections;
CREATE POLICY "google_calendar_connections_no_direct_access"
  ON public.google_calendar_connections
  FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "google_calendar_sync_log_no_direct_access" ON public.google_calendar_sync_log;
CREATE POLICY "google_calendar_sync_log_no_direct_access"
  ON public.google_calendar_sync_log
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ─── 13. Grants for everything created above ───────────────────────────────
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Stop the next table from being born without a grant. Migrations run as
-- `postgres`, so this covers every future public object they create.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ═══ Done ═══════════════════════════════════════════════════════════════
