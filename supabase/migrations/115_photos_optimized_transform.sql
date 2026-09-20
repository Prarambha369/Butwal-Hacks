-- Migration: 115_photos_optimized_transform
-- Purpose: Maintainer-chosen delivery optimization per photo.
-- Stores a validated transform recipe (e.g. "q_auto,f_auto" or
-- "q_auto,f_auto,e_auto_enhance"); display paths append it to the
-- delivery URL. NULL = default sized delivery. Recipes are allowlist-
-- validated server-side before write.

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS optimized_transform TEXT;
