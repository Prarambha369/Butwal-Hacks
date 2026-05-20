-- 050_organizations.sql
-- Chapter/Community management via Clerk Organizations
-- Clerk Organizations = persistent chapters (e.g., Butwal Hacks, Pokhara Hacks)
-- NOT for ephemeral event teams (those stay in the `teams` table)

-- Create chapters table (mirrors Clerk Organizations)
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link profiles to chapters (membership mirror)
CREATE TABLE IF NOT EXISTS chapter_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clerk_org_role TEXT DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, profile_id)
);

-- Add chapter_id to events for chapter-scoped events
ALTER TABLE events ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id);

-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_members ENABLE ROW LEVEL SECURITY;

-- RLS: Public can read chapters
CREATE POLICY "Public can read chapters" ON chapters FOR SELECT USING (true);

-- RLS: Public can read chapter members
CREATE POLICY "Public can read chapter members" ON chapter_members FOR SELECT USING (true);

-- RLS: Users can join chapters (self-service)
CREATE POLICY "Users can join chapters" ON chapter_members FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);

-- RLS: Chapter admins can update chapter details
CREATE POLICY "Admins can update chapters" ON chapters FOR UPDATE 
  USING (auth.jwt() ->> 'org_role' = 'admin');

-- RLS: Chapter admins can manage members
CREATE POLICY "Admins can manage members" ON chapter_members FOR ALL
  USING (auth.jwt() ->> 'org_role' = 'admin');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_chapters_clerk_org_id ON chapters(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug);
CREATE INDEX IF NOT EXISTS idx_chapter_members_profile ON chapter_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_chapter_members_chapter ON chapter_members(chapter_id);
