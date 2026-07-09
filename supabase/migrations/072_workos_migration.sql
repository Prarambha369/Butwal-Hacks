-- Migration: 072_workos_migration
-- Purpose: Rename Clerk-specific columns to WorkOS equivalents
-- Replaces: 063_add_clerk_user_id_to_profiles.sql, 053_clerk_only_auth.sql

-- Step 1: Add workos_user_id column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workos_user_id TEXT;

-- Step 2: Copy data from clerk_user_id to workos_user_id
UPDATE public.profiles SET workos_user_id = clerk_user_id WHERE workos_user_id IS NULL;

-- Step 3: Create UNIQUE index on workos_user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_workos_user_id ON public.profiles (workos_user_id);

-- Step 4: Add workos_org_id to chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS workos_org_id TEXT;

-- Step 5: Copy data from clerk_org_id to workos_org_id
UPDATE public.chapters SET workos_org_id = clerk_org_id WHERE workos_org_id IS NULL;

-- Step 6: Create UNIQUE index on workos_org_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_workos_org_id ON public.chapters (workos_org_id);

-- Step 7: Update RLS functions to use workos_user_id
CREATE OR REPLACE FUNCTION public.current_workos_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  -- Read from the JWT claim set by WorkOS AuthKit
  -- WorkOS puts the user ID in the 'sub' claim by default
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::TEXT;
$$;

-- Step 8: Update RLS policies to use workos_user_id
-- Drop old policies that reference clerk_user_id
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate policies with workos_user_id
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (workos_user_id = current_workos_user_id());

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (workos_user_id = current_workos_user_id())
  WITH CHECK (workos_user_id = current_workos_user_id());

-- Note: old clerk_user_id and clerk_org_id columns are kept for rollback safety
-- They can be dropped in a future migration after verification
