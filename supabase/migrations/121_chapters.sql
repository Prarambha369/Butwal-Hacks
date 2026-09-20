-- Migration: 121_chapters
-- Purpose: Maintainer-managed school chapters (replaces the hardcoded
-- three-chapter list). Public reads go through the service-role server
-- action; RLS deny-by-default like partners (see 116/120).

CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  school TEXT NOT NULL DEFAULT '',
  lead_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT 'Rupandehi',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'forming', 'inactive')),
  established TEXT NOT NULL DEFAULT '',
  member_count INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  highlights TEXT[] NOT NULL DEFAULT '{}',
  whatsapp TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chapters_active_order
  ON public.chapters (is_active, sort_order);

-- Seed the three chapters the static page carried, so the public page
-- never regresses to empty. Maintainers edit from here on.
INSERT INTO public.chapters
  (slug, name, school, lead_name, city, district, status, established, member_count, description, highlights, whatsapp, sort_order)
VALUES
  ('bhawani-secondary-school', 'Bhawani Secondary School', 'Bhawani Secondary School', 'Sushant Acharya', 'Siddharthanagar', 'Rupandehi', 'active', '2025', 35,
   'Partnered with the school''s coding club to run monthly hackathons and weekend coding workshops. Students are building everything from quiz platforms to local marketplace tools.',
   ARRAY['Bi-weekly coding circles with 15+ regular attendees', 'Inter-school hackathon 2025 — 8 teams participated', 'Student-built quiz platform used by the school', 'Mentorship partnership with Butwal tech professionals'],
   'https://chat.whatsapp.com/bhawani-chapter', 0),
  ('adarsha-secondary-school', 'Adarsha Secondary School', 'Adarsha Secondary School', 'Pooja Thapa', 'Butwal', 'Rupandehi', 'active', '2025', 28,
   'A high-energy chapter focused on introducing younger students to programming through game jams and creative coding projects in partnership with the school''s tech club.',
   ARRAY['Game Jam 2025 — 12 student teams built Scratch and Python games', 'Workshops on web fundamentals with 30+ participants', 'Student-led project showcase every quarter', 'Partnered with the school''s IT club for lab access'],
   'https://chat.whatsapp.com/adarsha-chapter', 1),
  ('butwal-multiple-campus', 'Butwal Multiple Campus', 'Butwal Multiple Campus', 'Anup Poudel', 'Butwal', 'Rupandehi', 'active', '2026', 52,
   'Partnering with the campus''s tech society to bridge curriculum learning with hands-on project building. Focus areas include web development, open source, and community tech solutions.',
   ARRAY['Monthly build nights with 20+ student attendees', 'Open source contribution workshop — first PRs merged', 'HackDay Butwal 2026 — 8 campus teams participated', 'Industry mentorship sessions with local tech professionals'],
   'https://chat.whatsapp.com/bmc-chapter', 2)
ON CONFLICT (slug) DO NOTHING;
