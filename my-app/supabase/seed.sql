-- ─────────────────────────────────────────────────────────────────────────────
-- Butwal Hacks — Seed Data
-- ─────────────────────────────────────────────────────────────────────────────
-- Provides realistic demo records for local development:
--   • 3 hackers (BH-24-001, BH-24-002, BH-24-003)
--   • 1 organizer
--   • 1 maintainer
--   • 2 events (1 upcoming, 1 past)
--   • 3 trust markers (1 verified, 1 self-reported, 1 revoked)
--   • 2 projects with tech stacks
--   • 1 team with members
--   • Event registrations for the hackers
--
-- Idempotent: safe to run multiple times (clears seed data first).
--
-- Usage:
--   psql -f supabase/seed.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Idempotent cleanup ────────────────────────────────────────────────────

TRUNCATE
  event_registrations,
  team_members,
  teams,
  trust_markers,
  projects,
  events,
  profiles
CASCADE;

-- Reset auto-increment sequences (if any use them)
ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;

-- ─── Profiles ──────────────────────────────────────────────────────────────

INSERT INTO profiles (id, auth0_user_id, slug_id, full_name, display_name, role, xp, bio, skills, social_links, is_claimed, avatar_url) VALUES

-- Hacker 1: Pranav Acharya (full-stack, experienced)
(
  'a0000000-0000-0000-0000-000000000001',
  'auth0|seed-hacker-01',
  'BH-24-001',
  'Pranav Acharya',
  'Pranav',
  'hacker',
  2450,
  'Full-stack developer passionate about open source and building tools for Nepali education. Winner of Butwal Hacks 2024.',
  '["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Tailwind CSS"]',
  '{"github": "https://github.com/pranav-acharya", "linkedin": "https://linkedin.com/in/pranav-acharya", "twitter": "https://twitter.com/pranav_dev"}',
  true,
  'https://avatars.githubusercontent.com/u/1'
),

-- Hacker 2: Samjhana Thapa (designer + frontend, mid-level)
(
  'a0000000-0000-0000-0000-000000000002',
  'auth0|seed-hacker-02',
  'BH-24-002',
  'Samjhana Thapa',
  'Samjhana',
  'hacker',
  980,
  'UI/UX designer and frontend developer. I build beautiful, accessible interfaces for Nepali startups.',
  '["Figma", "React", "TypeScript", "CSS", "Tailwind CSS", "Accessibility"]',
  '{"github": "https://github.com/samjhana-t", "linkedin": "https://linkedin.com/in/samjhana-thapa"}',
  true,
  'https://avatars.githubusercontent.com/u/2'
),

-- Hacker 3: Bishal Gurung (beginner, learning)
(
  'a0000000-0000-0000-0000-000000000003',
  'auth0|seed-hacker-03',
  'BH-24-003',
  'Bishal Gurung',
  'Bishal',
  'hacker',
  320,
  'Aspiring developer from Pokhara. Learning full-stack development and looking to collaborate on impactful projects.',
  '["JavaScript", "Python", "HTML", "CSS", "React"]',
  '{"github": "https://github.com/bishal-g", "linkedin": "https://linkedin.com/in/bishal-gurung"}',
  true,
  NULL
),

-- Organizer: Anjali Sharma
(
  'a0000000-0000-0000-0000-000000000010',
  'auth0|seed-organizer-01',
  'BH-24-ORG-01',
  'Anjali Sharma',
  'Anjali',
  'organizer',
  8900,
  'Community organizer and tech educator. Organizing hackathons across western Nepal to empower the next generation of builders.',
  '["Event Management", "Community Building", "Mentoring", "Public Speaking"]',
  '{"github": "https://github.com/anjali-sharma", "linkedin": "https://linkedin.com/in/anjali-sharma", "twitter": "https://twitter.com/anjali_org"}',
  true,
  'https://avatars.githubusercontent.com/u/10'
),

-- Maintainer: Deepak Pandey (core team, god mode)
(
  'a0000000-0000-0000-0000-000000000020',
  'auth0|seed-maintainer-01',
  'BH-24-MNT-01',
  'Deepak Pandey',
  'Deepak',
  'maintainer',
  15000,
  'Core maintainer of the Butwal Hacks platform. Infrastructure, security, and trust markers.',
  '["Rust", "Go", "TypeScript", "DevOps", "Security", "PostgreSQL"]',
  '{"github": "https://github.com/deepak-pandey", "linkedin": "https://linkedin.com/in/deepak-pandey", "website": "https://deepakpandey.dev"}',
  true,
  'https://avatars.githubusercontent.com/u/20'
);

-- ─── Events ────────────────────────────────────────────────────────────────

INSERT INTO events (id, title, slug, description, start_date, end_date, location, banner_url, is_published, organizer_id, max_attendees) VALUES

-- Past event (Butwal Hacks 2024)
(
  'b0000000-0000-0000-0000-000000000001',
  'Butwal Hacks 2024',
  'butwal-hacks-2024',
  'The inaugural Butwal Hacks — a 48-hour hackathon bringing together 100+ builders from across Lumbini Province to solve local challenges with technology.',
  '2024-09-15 09:00:00+05:45',
  '2024-09-17 18:00:00+05:45',
  'Butwal Multiple Campus, Butwal',
  'https://res.cloudinary.com/demo/image/upload/v1/events/butwal-hacks-2024',
  true,
  'a0000000-0000-0000-0000-000000000010',
  150
),

-- Upcoming event (Butwal Hacks 2025)
(
  'b0000000-0000-0000-0000-000000000002',
  'Butwal Hacks 2025',
  'butwal-hacks-2025',
  'The second edition of Butwal Hacks — bigger and better. Two tracks: Open Innovation and Climate Tech. 200+ hackers expected from across Nepal.',
  '2025-09-20 09:00:00+05:45',
  '2025-09-22 18:00:00+05:45',
  'Butwal Engineering College, Butwal',
  'https://res.cloudinary.com/demo/image/upload/v1/events/butwal-hacks-2025',
  true,
  'a0000000-0000-0000-0000-000000000010',
  200
);

-- ─── Teams ─────────────────────────────────────────────────────────────────

INSERT INTO teams (id, name, event_id, created_at) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'Code4Change',
  'b0000000-0000-0000-0000-000000000001',
  '2024-09-14 20:00:00+05:45'
);

-- ─── Team Members ──────────────────────────────────────────────────────────

INSERT INTO team_members (id, team_id, profile_id, role, created_at) VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'captain',
  '2024-09-14 20:00:00+05:45'
),
(
  'd0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'member',
  '2024-09-14 20:05:00+05:45'
),
(
  'd0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'member',
  '2024-09-14 20:10:00+05:45'
);

-- ─── Event Registrations ──────────────────────────────────────────────────

INSERT INTO event_registrations (id, event_id, profile_id, attended, created_at) VALUES

-- All 3 hackers registered for Butwal Hacks 2024 (all attended)
(
  'e0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  true,
  '2024-09-01 10:00:00+05:45'
),
(
  'e0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  true,
  '2024-09-02 11:00:00+05:45'
),
(
  'e0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  true,
  '2024-09-03 09:00:00+05:45'
),

-- Pranav and Samjhana registered for BH 2025 (upcoming, not yet attended)
(
  'e0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  '2025-06-15 10:00:00+05:45'
),
(
  'e0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  NULL,
  '2025-06-16 14:00:00+05:45'
);

-- ─── Projects ──────────────────────────────────────────────────────────────

INSERT INTO projects (id, title, description, profile_id, team_id, tech_stack, github_url, image_url, created_at) VALUES

-- Project 1: ShikshaSetu (by Code4Change team)
(
  'f0000000-0000-0000-0000-000000000001',
  'ShikshaSetu — Bridging Rural Education Gaps',
  'A platform connecting rural school students in Nepal with volunteer tutors via SMS and offline-first mobile app. Uses NLP to translate lessons into Nepali and Maithili. Won Best Social Impact at Butwal Hacks 2024.',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  '["React", "Node.js", "MongoDB", "Twilio", "Python", "NLP"]',
  'https://github.com/code4change/shikshasetu',
  'https://res.cloudinary.com/demo/image/upload/v1/projects/shikshasetu',
  '2024-09-17 16:00:00+05:45'
),

-- Project 2: KrishiKhoj (solo project by Pranav)
(
  'f0000000-0000-0000-0000-000000000002',
  'KrishiKhoj — Smart Farming Assistant',
  'An AI-powered assistant for Nepali farmers that provides real-time crop disease detection, weather forecasting, and market price tracking via a simple mobile interface.',
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  '["Next.js", "TypeScript", "TensorFlow.js", "PostgreSQL", "Twilio"]',
  'https://github.com/pranav-acharya/krishikhoj',
  'https://res.cloudinary.com/demo/image/upload/v1/projects/krishikhoj',
  '2024-10-05 12:00:00+05:45'
);

-- ─── Trust Markers ─────────────────────────────────────────────────────────

INSERT INTO trust_markers (id, title, description, type, profile_id, issuer_id, event_id, is_revoked, is_verified, is_claimed, created_at) VALUES

-- Verified marker: Pranav won Best Social Impact at Butwal Hacks 2024
(
  'g0000000-0000-0000-0000-000000000001',
  'Best Social Impact — Butwal Hacks 2024',
  'Awarded for building ShikshaSetu, a platform bridging rural education gaps in Nepal. Chosen by judges for most impactful solution.',
  'hackathon_award',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000010',
  'b0000000-0000-0000-0000-000000000001',
  false,
  true,
  true,
  '2024-09-17 19:00:00+05:45'
),

-- Self-reported marker: Samjhana's personal achievement
(
  'g0000000-0000-0000-0000-000000000002',
  'Google UX Design Certificate',
  'Completed the Google UX Design Professional Certificate — 7-course program covering UX research, prototyping, and design systems.',
  'self_reported',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  NULL,
  false,
  false,
  true,
  '2024-11-10 14:00:00+05:45'
),

-- Revoked marker: was issued to Bishal but later revoked
(
  'g0000000-0000-0000-0000-000000000003',
  'Community Mentor Badge',
  'Temporary mentor recognition — revoked after policy violation.',
  'badge',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'b0000000-0000-0000-0000-000000000001',
  true,
  false,
  true,
  '2024-09-18 10:00:00+05:45'
),

-- Verified marker: Pranav's GitHub verified marker
(
  'g0000000-0000-0000-0000-000000000004',
  'Open Source Contributor — Nepal Open Source',
  'Verified 10+ merged PRs to Nepal Open Source Collective projects including contributions to Nepali NLP libraries and educational tools.',
  'open_source',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000020',
  NULL,
  false,
  true,
  true,
  '2024-12-01 09:00:00+05:45'
);

-- ─── Summary ───────────────────────────────────────────────────────────────

-- After seeding, the /api/metrics endpoint should return:
--   total_hackers: 3    (profiles with role = 'hacker')
--   total_events: 2     (events with is_published = true)
--   total_projects: 2
--   total_trust_markers: 3  (trust_markers with is_revoked = false)
