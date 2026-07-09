-- Migration: 078_add_chapter_branding.sql
-- Date: 2026-07-09
-- Purpose: Add custom subdomain and branding configuration columns to chapters
-- for white-label chapter pages (e.g., pokhara.butwalhacks.com)

ALTER TABLE chapters ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN chapters.custom_domain IS 'Custom subdomain for white-label chapter pages (e.g., pokhara)';
COMMENT ON COLUMN chapters.branding_config IS 'JSON config for chapter branding: { primary_color, logo_url, favicon_url, tagline, cover_image_url }';

-- Index for subdomain lookups in middleware
CREATE INDEX IF NOT EXISTS idx_chapters_custom_domain ON chapters(custom_domain) WHERE custom_domain IS NOT NULL;
