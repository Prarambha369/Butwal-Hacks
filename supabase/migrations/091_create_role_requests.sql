-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 089: Create role_requests table
--
-- Handles role upgrade requests for organizer and sponsor roles.
-- Users who want Organizer or Sponsor access submit a request.
-- Maintainers review and approve/reject via the admin dashboard.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_user_id text NOT NULL,
  email text NOT NULL,
  requested_role text NOT NULL CHECK (requested_role IN ('organizer', 'sponsor')),
  message text NOT NULL CHECK (char_length(message) >= 10),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for listing pending requests efficiently
CREATE INDEX IF NOT EXISTS idx_role_requests_status ON public.role_requests(status);

-- Index for checking duplicate pending requests
CREATE INDEX IF NOT EXISTS idx_role_requests_user_role ON public.role_requests(auth0_user_id, requested_role, status);

-- Grant service_role full access (the app uses the service role key)
GRANT ALL ON public.role_requests TO service_role;

-- Enable RLS but allow service_role to bypass
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Service role policies (bypass RLS for the backend)
CREATE POLICY "service_role_all" ON public.role_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.role_requests IS 'Role upgrade requests from users who want Organizer or Sponsor access. Reviewed by Maintainers.';
COMMENT ON COLUMN public.role_requests.auth0_user_id IS 'Auth0 sub (user identifier)';
COMMENT ON COLUMN public.role_requests.email IS 'User email for contact';
COMMENT ON COLUMN public.role_requests.requested_role IS 'Role being requested: organizer or sponsor';
COMMENT ON COLUMN public.role_requests.message IS 'User explanation for why they need this role';
COMMENT ON COLUMN public.role_requests.status IS 'pending | approved | rejected';
COMMENT ON COLUMN public.role_requests.reviewed_by IS 'Auth0 sub of the maintainer who reviewed this request';
COMMENT ON COLUMN public.role_requests.reviewed_at IS 'When the request was reviewed';
