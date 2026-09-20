-- Migration: 107_fix_profiles_api_keys_grants
-- Date: 2026-09-07
-- Purpose: Final reconciliation sweep for drifted databases (production is
--          at ~migration 055): universal service-role grants plus the
--          profiles/api_keys columns the app queries but production lacks.
--
-- Audit findings (production, 2026-09-07):
--   - 15 tables return 403 for the service role (no GRANT): activities,
--     api_keys, badges, chapter_members, chapters, claim_tokens, feedback,
--     leaderboard_view, micro_credentials, notifications, resources,
--     sponsor_profiles, tasks, team_messages, workspaces.
--   - profiles lacks has_completed_onboarding (onboarding completion,
--     onboarding-tour.tsx), linked_accounts (account linking,
--     api/auth/link/*), cal_com_url (mentor directory + profile form).
--   - api_keys lacks is_active (API key create/revoke/validate,
--     lib/actions/api-keys.ts + api/v1/api-keys).
--
-- Fully idempotent: no-op on fresh databases.

-- ─── 1. Universal service-role grants ──────────────────────────────────
-- Covers every current and future public table/view/sequence/function.
-- GRANTs are idempotent; this cannot fail on missing objects.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ─── 2. profiles: missing app-facing columns ───────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_accounts jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cal_com_url text;

-- ─── 3. api_keys: missing is_active column ─────────────────────────────
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ─── Notes ─────────────────────────────────────────────────────────────
-- trust_markers / claim_tokens / workspaces / tasks reconciliation is in
-- migrations 103 and 106. Policy + function cleanup is in 104 and 105.
-- ═══ Done ═══════════════════════════════════════════════════════════════