-- Skill Trees / Micro-Credentials (Phase 15, Days 341-360)
-- Hackers unlock credentials by completing specific project combos.

CREATE TABLE micro_credentials (
  id text PRIMARY KEY, -- e.g. 'react-pro', 'full-stack'
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆', -- emoji icon for display
  category text NOT NULL DEFAULT 'tech' CHECK (category IN ('tech', 'soft', 'community', 'event')),
  
  -- Rules: stored as JSONB, evaluated by the Server Action
  -- Example:
  --   { "type": "tech_count", "tech": "React", "min_count": 3 }
  --   { "type": "tech_categories", "categories": ["Frontend","Backend"], "min_count": 2 }
  --   { "type": "github_verified", "min_count": 2 }
  rules jsonb NOT NULL,
  
  xp_reward integer NOT NULL DEFAULT 100,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profile_micro_credentials (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  credential_id text REFERENCES micro_credentials(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  progress jsonb, -- stores how far along they were when unlocked (optional)
  PRIMARY KEY (profile_id, credential_id)
);

-- Seed credentials
INSERT INTO micro_credentials (id, name, description, icon, category, rules, xp_reward, sort_order) VALUES
  ('react-pro', 'React Pro', 'Build 3+ projects using React', '⚛️', 'tech', 
   '{"type": "tech_count", "tech": "React", "min_count": 3}', 200, 1),
  
  ('pythonista', 'Pythonista', 'Build 1+ project using Python', '🐍', 'tech',
   '{"type": "tech_count", "tech": "Python", "min_count": 1}', 100, 2),
  
  ('git-master', 'Git Master', 'Ship 2+ GitHub-verified projects', '🔗', 'tech',
   '{"type": "github_verified", "min_count": 2}', 150, 3),
  
  ('full-stack', 'Full Stack', 'Build projects using both frontend and backend technologies', '🌐', 'tech',
   '{"type": "tech_categories", "categories": ["Frontend","Backend"], "min_count": 2}', 250, 4),
  
  ('ai-explorer', 'AI Explorer', 'Build 1+ project using AI/ML technologies', '🤖', 'tech',
   '{"type": "tech_count", "tech": "AI", "min_count": 1}', 200, 5),
  
  ('polyglot', 'Polyglot Dev', 'Use 5+ different technologies across your projects', '📚', 'tech',
   '{"type": "unique_tech_count", "min_count": 5}', 300, 6),
  
  ('hackathon-hero', 'Hackathon Hero', 'Participate in 3+ events', '🏅', 'event',
   '{"type": "event_count", "min_count": 3}', 150, 7),
  
  ('community-champion', 'Community Champion', 'Submit 3+ projects total', '💪', 'community',
   '{"type": "project_count", "min_count": 3}', 100, 8)
ON CONFLICT (id) DO NOTHING;

-- RLS disabled: auth handled at application layer via legacy auth (matching migration 053 pattern)
-- Server Action `createAuthenticatedClient()` enforces auth before inserts
ALTER TABLE micro_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_micro_credentials DISABLE ROW LEVEL SECURITY;
