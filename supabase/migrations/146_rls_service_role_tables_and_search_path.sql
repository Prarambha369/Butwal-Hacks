-- 146_rls_service_role_tables_and_search_path.sql
--
-- 1. Enable RLS on the four tables migration 143 recreated with RLS disabled:
--    sponsor_opportunities, opportunity_applications, sponsor_payouts,
--    site_content.
--
--    143 disabled RLS on the reasoning that only service_role reads them.
--    That holds today only because anon/authenticated happen to hold no
--    grants on these tables; any future GRANT (or a default-privileges
--    change) would expose every row through PostgREST. With RLS enabled and
--    no policies, anon/authenticated are denied regardless of grants, and
--    service_role keeps full access because it bypasses RLS. Every code path
--    that touches these tables uses createServiceClient(), so app behaviour
--    is unchanged. Same pattern as 116_rls_lockdown.
--
-- 2. Pin search_path on the six functions the Supabase linter flags
--    (0011_function_search_path_mutable), so a caller-controlled search_path
--    cannot redirect their unqualified references.

ALTER TABLE public.sponsor_opportunities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_payouts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content             ENABLE ROW LEVEL SECURITY;

-- Belt and braces: no direct client access, matching the 077/081 intent.
REVOKE ALL ON public.sponsor_opportunities    FROM anon, authenticated;
REVOKE ALL ON public.opportunity_applications FROM anon, authenticated;
REVOKE ALL ON public.sponsor_payouts          FROM anon, authenticated;
REVOKE ALL ON public.site_content             FROM anon, authenticated;

ALTER FUNCTION public.bind_event_sponsorship_verifier()       SET search_path = public, pg_temp;
ALTER FUNCTION public.conduct_reports_bind_resolver()         SET search_path = public, pg_temp;
ALTER FUNCTION public.current_profile_id()                    SET search_path = public, pg_temp;
ALTER FUNCTION public.event_registrations_consent_immutable() SET search_path = public, pg_temp;
ALTER FUNCTION public.event_sponsorships_immutable_linkage()  SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at()                        SET search_path = public, pg_temp;
