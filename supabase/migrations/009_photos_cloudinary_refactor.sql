-- 009_photos_cloudinary_refactor.sql
-- Clean up legacy photos table for Cloudinary integration.
-- The photos table had RLS policies referencing auth.uid(), which is broken
-- since Supabase Auth was disabled (migration 053). The backend now uses
-- the Supabase Service Role Key which bypasses RLS entirely.

-- Drop old, broken RLS policies on the photos table
DROP POLICY IF EXISTS "Photos viewable" ON photos;
DROP POLICY IF EXISTS "Organizers insert photos" ON photos;

-- Disable RLS on photos to prevent any auth-jwt conflicts
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;

-- Note: photos.url is already TEXT type and ready to accept Cloudinary URLs.
-- No column type changes needed.
