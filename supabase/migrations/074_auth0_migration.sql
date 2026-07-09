-- Migration: 074_auth0_migration
-- Purpose: Rename auth columns to auth0_user_id (final auth provider: Auth0)

-- Step 1: Add auth0_user_id column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth0_user_id TEXT;

-- Step 2: Copy data from workos_user_id or clerk_user_id
UPDATE public.profiles SET auth0_user_id = COALESCE(workos_user_id, clerk_user_id) WHERE auth0_user_id IS NULL;

-- Step 3: Create UNIQUE index on auth0_user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_auth0_user_id ON public.profiles (auth0_user_id);

-- Step 4: Rename clerk_org_id to auth0_org_id in chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS auth0_org_id TEXT;
UPDATE public.chapters SET auth0_org_id = COALESCE(workos_org_id, clerk_org_id) WHERE auth0_org_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_auth0_org_id ON public.chapters (auth0_org_id);
