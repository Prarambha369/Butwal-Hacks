-- Migration: 072_auth0_migration
-- Purpose: Add auth0_user_id column and migrate from legacy auth to Auth0
-- Replaces: 063_add_clerk_user_id_to_profiles.sql, 053_clerk_only_auth.sql,
--           072_workos_migration.sql (consolidated into this single step)

-- Step 1: Add auth0_user_id column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth0_user_id TEXT;

-- Step 2: Create UNIQUE index on auth0_user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_auth0_user_id ON public.profiles (auth0_user_id);

-- Step 3: Add auth0_org_id to chapters (if the column doesn't already exist from migration 050)
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS auth0_org_id TEXT;

-- Step 4: Create UNIQUE index on auth0_org_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_auth0_org_id ON public.chapters (auth0_org_id);
