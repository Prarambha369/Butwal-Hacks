-- Migration: 062_team_invites_base_grants
-- Date: 2026-07-01
-- Purpose: Add base GRANTs for team_invites so existing RLS policies can be reached.
-- Context: The team_invites table already has two RLS policies:
--   1. "Users can view their own invites" (SELECT)
--   2. "Captains can manage invites" (ALL, covers INSERT)
--
-- However, the anon and authenticated roles were missing base SELECT and INSERT
-- privileges, which meant client-side operations never reached RLS evaluation.
-- The policies existed but were effectively dead code.
--
-- This migration adds the missing base GRANTs to make the existing policies
-- functional for client-side components.

GRANT SELECT, INSERT ON public.team_invites TO anon;
GRANT SELECT, INSERT ON public.team_invites TO authenticated;
