-- Migration: 056_fix_project_likes_permissions
-- Date: 2026-07-01
-- Purpose: Fix missing service_role privileges on project_likes table.
-- Context: The project_likes table was created with RLS enabled but service_role
--          was missing SELECT, INSERT, DELETE, and UPDATE privileges. This caused
--          server-side operations (toggleProjectLike, getFeaturedProjects, 
--          getUserProjects, generateImpactReport) to fail with:
--          "permission denied for table project_likes"
--
-- Root cause: Migration 055 included GRANT ALL ON project_likes TO service_role,
--             but the table may have been recreated after the migration ran, or
--             the GRANT didn't take effect because the table didn't exist yet.
--             This migration reissues the GRANT to ensure it takes effect.

-- Grant full CRUD access to service_role
GRANT ALL PRIVILEGES ON public.project_likes TO service_role;

-- Also ensure sequence grants are in place
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
