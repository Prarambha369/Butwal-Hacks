-- Migration: 120_partners
-- Purpose: Maintainer-managed "Supported by" wall (replaces hardcoded
-- placeholder logos). Organizers don't touch this; only maintainers
-- decide whose logo appears on the homepage.
-- RLS enabled with NO anon/authenticated policies (deny-by-default, see
-- 116): all reads go through the service-role server action.

CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_partners_active_order
  ON public.partners (is_active, sort_order);
