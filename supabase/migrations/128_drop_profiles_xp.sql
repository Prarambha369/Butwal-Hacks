-- Migration: 128_drop_profiles_xp
-- Purpose: Drop the profiles.xp column, completing the de-gamification started in
-- 119_degamify_drops (which noted "profiles.xp column itself → drop after this
-- branch merges + deploys"). No src code references xp anymore (verified: zero
-- references in my-app/src).

ALTER TABLE public.profiles DROP COLUMN IF EXISTS xp;
