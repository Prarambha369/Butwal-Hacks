-- Day 35: Resource Hub & Learning Paths
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL, -- e.g., 'Frontend', 'Backend', 'Web3', 'Design'
  url text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 10,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resource_completions (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, resource_id)
);

-- Seed some initial learning paths.
--
-- `resources` has no natural unique key (the seed omits `id`, so gen_random_uuid()
-- mints a fresh one every run) which means a plain re-insert silently duplicates
-- the whole catalogue. Guard on "table is empty" instead -- this is seed data, so
-- refusing to re-apply is the correct semantic.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.resources) THEN
    INSERT INTO resources (title, description, category, url, xp_reward, order_index) VALUES
('Next.js Documentation', 'The official guide to the most popular React framework.', 'Frontend', 'https://nextjs.org/docs', 20, 1),
('Tailwind CSS Guide', 'Master the utility-first CSS framework.', 'Frontend', 'https://tailwindcss.com/docs', 15, 2),
('TypeScript Handbook', 'Strongly typed JavaScript for scalable apps.', 'Frontend', 'https://www.typescriptlang.org/docs/', 25, 3),
('Supabase Auth Guide', 'Implementing secure authentication in minutes.', 'Backend', 'https://supabase.com/docs/guides/auth', 20, 4),
('PostgreSQL Basics', 'The world most advanced open source database.', 'Backend', 'https://www.postgresql.org/docs/', 20, 5),
('Figma for Developers', 'Bridging the gap between design and code.', 'Design', 'https://help.figma.com/', 15, 6);
  END IF;
END $$;
