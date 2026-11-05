-- Migration: 139_partners_cloudinary_public_id.sql
-- Purpose: Add cloudinary_public_id to partners table for Cloudinary-managed logos.
-- This column was expected by the partners service action but the column
-- was never added to the schema. Adding it now to fix production errors.

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;

CREATE INDEX IF NOT EXISTS idx_partners_cloudinary_public_id
  ON public.partners (cloudinary_public_id)
  WHERE cloudinary_public_id IS NOT NULL;

COMMENT ON COLUMN public.partners.cloudinary_public_id IS
  'Cloudinary public ID for the partner logo, if uploaded via Cloudinary widget (migration 139). NULL if using external logo_url.';
