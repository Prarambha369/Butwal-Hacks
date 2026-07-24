-- Migration: 093_add_chapter_school_columns.sql
-- Purpose: Add school- and location-related columns to chapters table
-- for the dedicated school chapter feature. Also make auth0_org_id nullable
-- since chapters can exist without an Auth0 Organization link.

-- Make auth0_org_id nullable — school chapters don't have an Auth0 org
ALTER TABLE chapters ALTER COLUMN auth0_org_id DROP NOT NULL;

-- School & location columns
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS lead_name TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS district TEXT;

-- Metadata columns
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'Lumbini Province';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS established TEXT;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Rich content columns
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chapters_city ON chapters(city);
CREATE INDEX IF NOT EXISTS idx_chapters_district ON chapters(district);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);

COMMENT ON COLUMN chapters.auth0_org_id IS 'Optional Auth0 Organization ID. NULL for school-dedicated chapters.';
COMMENT ON COLUMN chapters.school IS 'School name for school-dedicated chapters.';
COMMENT ON COLUMN chapters.lead_name IS 'Student lead name for school-dedicated chapters.';
COMMENT ON COLUMN chapters.city IS 'City where the chapter is based.';
COMMENT ON COLUMN chapters.district IS 'District where the chapter is based.';
COMMENT ON COLUMN chapters.province IS 'Province where the chapter is based. Defaults to Lumbini Province.';
COMMENT ON COLUMN chapters.status IS 'Chapter status: active, inactive, archived.';
COMMENT ON COLUMN chapters.established IS 'Year the chapter was established.';
COMMENT ON COLUMN chapters.member_count IS 'Approximate number of members.';
COMMENT ON COLUMN chapters.highlights IS 'Array of highlight strings for the chapter.';
COMMENT ON COLUMN chapters.tags IS 'Array of tag strings for discoverability.';
COMMENT ON COLUMN chapters.social_links IS 'JSON object of social media links.';
