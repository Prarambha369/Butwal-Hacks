-- Migration: 125_reconcile_chapters
-- Purpose: Converge the live `chapters` table onto the schema 121_chapters
-- declares, and apply the parts of 121 that never ran.
--
-- Why this exists: `chapters` was created outside migration 121 by an older
-- org/chapter model (auth0_org_id, logo_url, custom_domain, branding_config,
-- province, tags, social_links). 121 then added its school-chapter columns
-- but stopped short — `whatsapp`, `sort_order`, `is_active`, the sort index,
-- and the seed rows were never applied, and 121 was never recorded in
-- supabase_migrations.
--
-- `CREATE TABLE IF NOT EXISTS` in 121 made this invisible: the statement
-- succeeded while changing nothing, so `supabase db push` reported success
-- against a table the app cannot read. The app selects all 15 columns in
-- my-app/src/lib/actions/chapters.ts, so every query raised PGRST205 and fell
-- through to staticFallback() — the page looked correct while maintainer
-- edits were silently discarded.
--
-- Strictly additive: the org-model columns are left untouched because nothing
-- in the repo reads them, and dropping them is not this migration's call.
-- `highlights` stays jsonb rather than 121's text[], so the seed casts with
-- to_jsonb(...::text[]). PostgREST returns a string array either way, so the
-- app's string[] mapping is unaffected.

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 121 declares a CHECK on status; the live table never got one. Guarded
-- because ADD CONSTRAINT has no IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.chapters'::regclass
      AND conname = 'chapters_status_check'
  ) THEN
    ALTER TABLE public.chapters
      ADD CONSTRAINT chapters_status_check
      CHECK (status IN ('active', 'forming', 'inactive'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chapters_active_order
  ON public.chapters (is_active, sort_order);

-- Seed the three chapters the static page carried, so the public page is
-- served from the database rather than the hardcoded fallback.
INSERT INTO public.chapters
  (slug, name, school, lead_name, city, district, status, established, member_count, description, highlights, whatsapp, sort_order)
VALUES
  ('bhawani-secondary-school', 'Bhawani Secondary School', 'Bhawani Secondary School', 'Sushant Acharya', 'Siddharthanagar', 'Rupandehi', 'active', '2025', 35,
   'Partnered with the school''s coding club to run monthly hackathons and weekend coding workshops. Students are building everything from quiz platforms to local marketplace tools.',
   to_jsonb(ARRAY['Bi-weekly coding circles with 15+ regular attendees', 'Inter-school hackathon 2026 — 8 teams participated', 'Student-built quiz platform used by the school', 'Mentorship partnership with Butwal tech professionals']::text[]),
   'https://chat.whatsapp.com/bhawani-chapter', 0),
  ('adarsha-secondary-school', 'Adarsha Secondary School', 'Adarsha Secondary School', 'Pooja Thapa', 'Butwal', 'Rupandehi', 'active', '2025', 28,
   'A high-energy chapter focused on introducing younger students to programming through game jams and creative coding projects in partnership with the school''s tech club.',
   to_jsonb(ARRAY['Game Jam 2025 — 12 student teams built Scratch and Python games', 'Workshops on web fundamentals with 30+ participants', 'Student-led project showcase every quarter', 'Partnered with the school''s IT club for lab access']::text[]),
   'https://chat.whatsapp.com/adarsha-chapter', 1),
  ('butwal-multiple-campus', 'Butwal Multiple Campus', 'Butwal Multiple Campus', 'Anup Poudel', 'Butwal', 'Rupandehi', 'active', '2026', 52,
   'Partnering with the campus''s tech society to bridge curriculum learning with hands-on project building. Focus areas include web development, open source, and community tech solutions.',
   to_jsonb(ARRAY['Monthly build nights with 20+ student attendees', 'Open source contribution workshop — first PRs merged', 'HackDay Butwal 2026 — 8 campus teams participated', 'Industry mentorship sessions with local tech professionals']::text[]),
   'https://chat.whatsapp.com/bmc-chapter', 2)
ON CONFLICT (slug) DO NOTHING;
