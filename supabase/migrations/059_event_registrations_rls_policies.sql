-- Migration: 059_event_registrations_rls_policies
-- Date: 2026-07-01
-- Purpose: Add RLS policies for event_registrations table.
-- Context: The event_registrations table had RLS enabled but ZERO policies,
--          which denied ALL operations for anon and authenticated roles.
--          This broke the client-side event registration button which does
--          supabase.from('event_registrations').insert(...) via the anon key.
--
-- Policies:
--   1. SELECT: Users can view their own registrations
--   2. INSERT: Users can register themselves for events
--      (profile_id must match their own auth.uid())

-- Grant base SELECT and INSERT to anon and authenticated roles (needed for
-- client-side operations to reach RLS evaluation)
GRANT SELECT, INSERT ON public.event_registrations TO anon;
GRANT SELECT, INSERT ON public.event_registrations TO authenticated;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;

-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations" ON public.event_registrations
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can register themselves for events
CREATE POLICY "Users can register for events" ON public.event_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
