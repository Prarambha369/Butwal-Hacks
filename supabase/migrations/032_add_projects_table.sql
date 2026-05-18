-- Day 32: Project Showcase
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  tech_stack text[],
  github_url text,
  demo_url text,
  hackathon_origin text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_profile_id ON projects(profile_id);
