-- Migration: 118_fk_coverage_and_dedup_indexes
-- Purpose: Address the performance advisor's index findings that are
-- safe to act on.
--
-- 1. Covering indexes for all 23 unindexed foreign keys (cheap, safe,
--    helps joins + FK cascade checks). project_comments/project_views/
--    project_contributions/project_nominations each need two.
-- 2. Drop 4 byte-identical duplicate index pairs (verified identical
--    definitions in prod; keeps the *_id naming convention).
--
-- Deliberately NOT touched: the 76 "unused" indexes. Prod holds almost
-- no rows yet, so "unused" reflects zero traffic, not zero value.
-- Re-scan after real traffic before dropping anything.

CREATE INDEX IF NOT EXISTS idx_activities_profile_id ON public.activities (profile_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_organizer_id ON public.batch_jobs (organizer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON public.certificates (event_id);
CREATE INDEX IF NOT EXISTS idx_claim_tokens_trust_marker_id ON public.claim_tokens (trust_marker_id);
CREATE INDEX IF NOT EXISTS idx_events_chapter_id ON public.events (chapter_id);
CREATE INDEX IF NOT EXISTS idx_profile_badges_badge_id ON public.profile_badges (badge_id);
CREATE INDEX IF NOT EXISTS idx_profile_micro_credentials_credential_id ON public.profile_micro_credentials (credential_id);
CREATE INDEX IF NOT EXISTS idx_profile_roles_profile_id ON public.profile_roles (profile_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_profile_id ON public.project_comments (profile_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments (project_id);
CREATE INDEX IF NOT EXISTS idx_project_contributions_profile_id ON public.project_contributions (profile_id);
CREATE INDEX IF NOT EXISTS idx_project_contributions_project_id ON public.project_contributions (project_id);
CREATE INDEX IF NOT EXISTS idx_project_nominations_profile_id ON public.project_nominations (profile_id);
CREATE INDEX IF NOT EXISTS idx_project_nominations_project_id ON public.project_nominations (project_id);
CREATE INDEX IF NOT EXISTS idx_project_views_profile_id ON public.project_views (profile_id);
CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON public.project_views (project_id);
CREATE INDEX IF NOT EXISTS idx_projects_profile_id ON public.projects (profile_id);
CREATE INDEX IF NOT EXISTS idx_resource_completions_resource_id ON public.resource_completions (resource_id);
CREATE INDEX IF NOT EXISTS idx_site_content_updated_by ON public.site_content (updated_by);
CREATE INDEX IF NOT EXISTS idx_skills_endorsements_endorsee_id ON public.skills_endorsements (endorsee_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_profile_id ON public.team_messages (profile_id);
-- One index covers both teams organizer FK constraints.
CREATE INDEX IF NOT EXISTS idx_teams_organizer_id ON public.teams (organizer_id);

DROP INDEX IF EXISTS public.idx_chapter_members_chapter;
DROP INDEX IF EXISTS public.idx_chapter_members_profile;
DROP INDEX IF EXISTS public.idx_event_registrations_event;
DROP INDEX IF EXISTS public.idx_trust_markers_profile;
