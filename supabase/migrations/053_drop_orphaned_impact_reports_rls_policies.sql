-- Migration: 054_drop_orphaned_impact_reports_rls_policies
-- Date: 2026-06-30
-- Purpose: Drop any orphaned RLS policies on public.impact_reports.
-- Context: RLS was disabled on impact_reports in migration 053 (legacy auth-only architecture).
--          The Supabase dashboard may still show policies that were created before RLS
--          was disabled, causing lint warnings about "RLS disabled but policies exist."
--          These policies are dead code — they are never enforced. This migration
--          cleans them up to silence the dashboard lint warning.

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE tablename = 'impact_reports' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.impact_reports', pol.policyname);
    END LOOP;
END $$;
