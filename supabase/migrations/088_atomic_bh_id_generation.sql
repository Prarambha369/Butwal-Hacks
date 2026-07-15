-- Migration: 088_atomic_bh_id_generation
-- Purpose: Create an atomic BH-ID generator using advisory locks to prevent
--          race conditions when two users sign up concurrently.
--
-- The webhook handler previously queried for MAX(slug_id), incremented in
-- application code, then inserted — a non-atomic pattern. If two requests
-- ran concurrently, both could compute the same next number, causing a
-- UNIQUE violation on slug_id.
--
-- This function uses pg_advisory_xact_lock() to serialize BH-ID generation
-- within a year, ensuring each caller gets a unique sequential ID.
--
-- Usage from TypeScript:
--   const { data, error } = await supabase.rpc('create_profile_with_bh_id', {
--     p_auth0_user_id: sub,
--     p_email: email,
--     p_full_name: name || 'New Hacker',
--     p_role: 'hacker',
--   });

-- ─── Atomic BH-ID generator + profile insert ──────────────────────────

CREATE OR REPLACE FUNCTION public.create_profile_with_bh_id(
  p_auth0_user_id text,
  p_email text,
  p_full_name text DEFAULT 'New Hacker',
  p_role text DEFAULT 'hacker'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text;
  v_next_num integer;
  v_bh_id text;
  v_id uuid;
BEGIN
  v_year := to_char(now(), 'YY');
  v_id := gen_random_uuid();

  -- Advisory lock scoped to BH-ID generation for this year.
  -- pg_advisory_xact_lock(42, <year>) serializes concurrent callers:
  --   42 = magic constant meaning "BH-ID sequence"
  --   v_year::int = the current year suffix (e.g., 26 for 2026)
  -- The lock auto-releases at transaction commit.
  PERFORM pg_advisory_xact_lock(42, v_year::int);

  -- Atomically find the next number within this year
  SELECT COALESCE(MAX(CAST(SPLIT_PART(slug_id, '-', 3) AS integer)), 0) + 1
  INTO v_next_num
  FROM profiles
  WHERE slug_id LIKE 'BH-' || v_year || '-%';

  v_bh_id := 'BH-' || v_year || '-' || LPAD(v_next_num::text, 3, '0');

  INSERT INTO profiles (id, auth0_user_id, slug_id, bh_id, email, full_name, role, is_claimed)
  VALUES (v_id, p_auth0_user_id, v_bh_id, v_bh_id, p_email, p_full_name, p_role, true);

  RETURN jsonb_build_object('id', v_id, 'bh_id', v_bh_id);
END;
$$;

COMMENT ON FUNCTION public.create_profile_with_bh_id IS
  'Atomically generates a sequential BH-ID (BH-YY-NNN) and inserts a new profile. Uses pg_advisory_xact_lock to prevent race conditions during concurrent signups.';
