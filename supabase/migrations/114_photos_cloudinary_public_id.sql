-- Migration: 114_photos_cloudinary_public_id
-- Purpose: Store Cloudinary public_id per photo so orphaned binaries
-- can be cleaned via the Admin API later. (113 already shipped
-- status/is_cover/anon grant; this column was added to the plan after.)

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;
