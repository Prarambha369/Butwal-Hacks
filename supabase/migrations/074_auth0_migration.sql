-- Migration: 074_auth0_finalize
-- Purpose: Clean up legacy auth columns — all users now use Auth0
-- auth0_user_id and auth0_org_id are already set up by migration 072.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS clerk_user_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS workos_user_id;

-- Step 2: Drop legacy columns from chapters
ALTER TABLE public.chapters DROP COLUMN IF EXISTS clerk_org_id;
ALTER TABLE public.chapters DROP COLUMN IF EXISTS workos_org_id;

-- Step 3: Drop legacy RLS helper function if it exists (replaced by auth.jwt())
DROP FUNCTION IF EXISTS public.current_clerk_user_id();
DROP FUNCTION IF EXISTS public.current_workos_user_id();
