-- ═══════════════════════════════════════════════════════════════════
-- 🌱 BUTWAL HACKS SEED DATA
-- ═══════════════════════════════════════════════════════════════════
--
-- Usage:
--   psql "postgresql://..." -f supabase/seed.sql
--
-- Or from Supabase dashboard:
--   1. Open SQL Editor
--   2. Paste this file
--   3. Run
--
-- Note: The profiles table has a FK constraint referencing auth.users.
--       Since Butwal Hacks uses Auth0 (not Supabase Auth), this FK
--       may have been dropped. If INSERT fails on FK violation, run:
--         ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
--
-- ═══════════════════════════════════════════════════════════════════

-- ── Clear existing data (safe to re-run) ──────────────────────────
TRUNCATE TABLE
  trust_markers,
  event_registrations,
  team_members,
  teams,
  projects,
  events,
  profiles
CASCADE;

-- ── Profiles ──────────────────────────────────────────────────────
-- Hackers
INSERT INTO profiles (id, auth0_user_id, slug_id, bh_id, email, full_name, role, is_claimed, xp, bio, avatar_url)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'auth0|seed-hacker-1', 'BH-26-001', 'BH-26-001', 'anupa.sharma@example.com',  'Anupa Sharma',  'hacker',     true, 2450, 'Full-stack developer passionate about EdTech. Built 3 hackathon projects this year.', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Anupa'),
  ('a0000000-0000-0000-0000-000000000002', 'auth0|seed-hacker-2', 'BH-26-002', 'BH-26-002', 'bibek.rai@example.com',     'Bibek Rai',     'hacker',     true,  870, 'AI/ML enthusiast exploring computer vision applications for agriculture in Nepal.', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bibek'),
  ('a0000000-0000-0000-0000-000000000003', 'auth0|seed-hacker-3', 'BH-26-003', 'BH-26-003', 'sneha.adhikari@example.com','Sneha Adhikari','hacker',     true, 1520, 'UI/UX designer and frontend developer. Love creating accessible, delightful interfaces.', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sneha')
ON CONFLICT (slug_id) DO NOTHING;

-- Organizer
INSERT INTO profiles (id, auth0_user_id, slug_id, bh_id, email, full_name, role, is_claimed, xp, bio, avatar_url)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'auth0|seed-organizer-1', 'BH-26-010', 'BH-26-010', 'rajesh.gurung@example.com','Rajesh Gurung','organizer',  true, 4800, 'Community builder and hackathon organizer. Running Butwal Hacks events since 2024.', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rajesh')
ON CONFLICT (slug_id) DO NOTHING;

-- Maintainer
INSERT INTO profiles (id, auth0_user_id, slug_id, bh_id, email, full_name, role, is_claimed, xp, bio, avatar_url)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'auth0|seed-maintainer-1', 'BH-26-100', 'BH-26-100', 'admin@butwalhacks.com',    'Prarambha B.', 'maintainer', true, 9999, 'Core maintainer of the Butwal Hacks platform. Building the future of credentialing.', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Prarambha')
ON CONFLICT (slug_id) DO NOTHING;

-- ── Events ────────────────────────────────────────────────────────
INSERT INTO events (id, organizer_id, title, description, start_date, end_date, location, is_published)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'DayDream Butwal 2025',
    'A 48-hour hackathon bringing together 100+ students from Lumbini Province to build solutions for local challenges. Tracks: EdTech, Agriculture, and Civic Tech.',
    '2025-09-15 09:00:00+05:45',
    '2025-09-17 18:00:00+05:45',
    'Butwal Multiple Campus, Butwal',
    true
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Innovate Nepal 2024',
    'Nepal-wide virtual hackathon focused on climate resilience and sustainable development. 200+ participants from 7 provinces.',
    '2024-03-01 09:00:00+05:45',
    '2024-03-03 18:00:00+05:45',
    'Virtual (Zoom + Discord)',
    true
  );

-- ── Event Registrations ───────────────────────────────────────────
INSERT INTO event_registrations (event_id, profile_id, attended)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', true),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', true),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', true),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', true),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', true);

-- ── Teams ─────────────────────────────────────────────────────────
INSERT INTO teams (id, event_id, name, looking_for_members)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Team EduForge', false),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Team AgroSense', true);

INSERT INTO team_members (team_id, profile_id, is_captain)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', true),
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', false),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', true);

-- ── Projects ──────────────────────────────────────────────────────
INSERT INTO projects (id, profile_id, name, description, image_url, tech_stack, github_url, demo_url, hackathon_origin)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'EduForge — Localized Learning Platform',
    'An adaptive learning platform supporting Nepali and English. Features offline-capable lessons, progress tracking, and AI-powered quiz generation. Built for rural schools with limited internet access.',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    ARRAY['Next.js', 'PostgreSQL', 'Groq AI', 'Tailwind CSS'],
    'https://github.com/butwalhacks/eduforge',
    'https://eduforge.demo.butwalhacks.com',
    'DayDream Butwal 2025'
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'AgroSense — Smart Farming Dashboard',
    'IoT-integrated farming dashboard that analyzes soil moisture, temperature, and weather forecasts. Provides actionable insights to farmers via SMS and a simple web dashboard.',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
    ARRAY['React', 'Node.js', 'MongoDB', 'Arduino', 'Twilio'],
    'https://github.com/butwalhacks/agrosense',
    'https://agrosense.demo.butwalhacks.com',
    'Innovate Nepal 2024'
  );

-- ── Trust Markers ─────────────────────────────────────────────────
-- Verified marker (issued by organizer, not revoked)
INSERT INTO trust_markers (id, profile_id, issuer_id, event_id, type, title, description, is_revoked)
VALUES
  (
    'g0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'achievement',
    'Best Overall Hack — DayDream Butwal 2025',
    'Awarded for building EduForge, the most impactful project addressing education accessibility in rural Nepal.',
    false
  );

-- Self-reported marker (claimed by hacker, no organizer verification)
INSERT INTO trust_markers (id, profile_id, issuer_id, type, title, description, is_revoked)
VALUES
  (
    'g0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'self-reported',
    'Completed Google Data Analytics Certificate',
    'Successfully completed the 8-course Google Data Analytics Professional Certificate on Coursera.',
    false
  );

-- Revoked marker (was verified, but later revoked by maintainer)
INSERT INTO trust_markers (id, profile_id, issuer_id, event_id, type, title, description, is_revoked, revocation_reason)
VALUES
  (
    'g0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'achievement',
    'Runner-Up — Innovate Nepal 2024',
    'Originally awarded as runner-up, but later revoked due to eligibility dispute.',
    true,
    'Eligibility criteria not met — participant was enrolled in a full-time degree program outside Lumbini Province.'
  );

-- ═══════════════════════════════════════════════════════════════════
-- ✅ SEED COMPLETE
--
-- Summary:
--   3 hackers (BH-26-001, BH-26-002, BH-26-003)
--   1 organizer  (BH-26-010)
--   1 maintainer (BH-26-100)
--   2 events (1 upcoming, 1 past)
--   3 trust markers (1 verified, 1 self-reported, 1 revoked)
--   2 projects with teams
-- ═══════════════════════════════════════════════════════════════════
