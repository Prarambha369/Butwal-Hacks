-- Migration: 093_add_has_completed_onboarding.sql
-- Date: 2026-07-21
-- Purpose: Track whether a user has completed the onboarding tour.
--          Allows the tour state to persist across devices via Supabase,
--          while localStorage provides a fast local cache.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean NOT NULL DEFAULT false;
