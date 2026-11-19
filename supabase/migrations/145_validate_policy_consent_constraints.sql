-- 145_validate_policy_consent_constraints.sql
--
-- Validate the CHECK constraints that migration 144 added as NOT VALID: the
-- two consent checks and the closed-report resolution check.
--
-- Why a separate migration: VALIDATE CONSTRAINT only avoids blocking writes
-- when it runs in a different transaction from the ADD CONSTRAINT. In the
-- same transaction, the ACCESS EXCLUSIVE lock taken by ADD CONSTRAINT is held
-- until COMMIT, so the full-table scan happens under it anyway. A separate
-- file is a separate transaction however the migration runner batches
-- statements. Here the scan takes only SHARE UPDATE EXCLUSIVE, so reads and
-- writes to event_registrations and projects continue while it runs.
--
-- Each VALIDATE gets its own transaction, so one large table does not hold
-- the other's lock.

BEGIN;
ALTER TABLE event_registrations
  VALIDATE CONSTRAINT event_registrations_consent_complete;
COMMIT;

BEGIN;
ALTER TABLE projects
  VALIDATE CONSTRAINT projects_submission_consent_complete;
COMMIT;

BEGIN;
ALTER TABLE conduct_reports
  VALIDATE CONSTRAINT conduct_reports_closed_requires_resolution;
COMMIT;
