-- Migration: 058_trusted_profiles_security_invoker
-- Date: 2026-07-01
-- Purpose: Close SECURITY DEFINER security gap on trusted_profiles view.
-- Context: The trusted_profiles view was created with SECURITY DEFINER (the default),
--          which runs all queries as the view owner (postgres), bypassing RLS on
--          the underlying profiles table. This means any client querying this view
--          can see ALL profiles including sensitive fields (email, role, etc.)
--          regardless of RLS policies.
--
-- Fix: Set security_invoker = true, which makes the view respect the calling
--      user's RLS policies on the underlying profiles table. The profiles table
--      already has a SELECT policy ("Profiles are viewable by everyone") so
--      public read access still works — but it now respects any future RLS
--      restrictions.

ALTER VIEW public.trusted_profiles SET (security_invoker = true);
