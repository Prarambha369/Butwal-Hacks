-- Migration: 110_site_content
-- Purpose: Maintainer-editable displayed copy (site-config page finally
--   gets a purpose). Key-value store; values are { en, ne } JSON so the
--   bilingual contract holds. Reads fall back to i18n defaults when a key
--   is absent, so an empty table renders today's site exactly.

CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{"en": "", "ne": ""}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS intentionally disabled per architecture decision (see 073): Auth0
-- handles auth, service_role bypasses RLS. Reads go through server actions
-- with the service client, same as every other table.
ALTER TABLE public.site_content DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.site_content TO service_role;
