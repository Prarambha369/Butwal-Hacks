-- Migration: 142_claim_ghost_profile_on_signup
-- Purpose: Let signup claim a pre-existing identity-less profile row instead of
--          colliding with the UNIQUE(profiles.email) constraint.
--
-- Background: profiles.email is UNIQUE (001_initial_schema), and rows can exist
-- before the person ever authenticates -- the legacy Supabase `handle_new_user`
-- trigger (002/006) and lead capture both write `auth0_user_id = NULL` ghosts.
-- create_profile_with_bh_id only ever inserted, so the first login for such an
-- address failed with 23505. The webhook returned 500 "Failed to create
-- profile", the dashboard bootstrap hit the same error, and the user finished
-- sign-in with no profile row at all.
--
-- Live example (2026-11-05): prarambha@butwalhacks.com had a ghost row
-- (slug_id NULL, is_claimed false) while the Auth0 accounts for that address
-- had 17 combined logins and no profile between them.
--
-- The function now attaches the Auth0 identity to the ghost row, marks it
-- claimed, and mints the BH-ID it never had. A row that already has a slug_id
-- keeps it -- that slug may be printed on a badge, certificate, or public
-- profile URL. Ordinary signups (no matching ghost) are byte-for-byte the same
-- insert as before, including the advisory lock that serialises BH-ID minting.
--
-- Privileges are unchanged: 117_function_and_view_hardening already restricts
-- EXECUTE to service_role, and CREATE OR REPLACE preserves the function's ACL.

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
  v_ghost_id uuid;
  v_ghost_role text;
BEGIN
  v_year := to_char(now(), 'YY');
  v_id := gen_random_uuid();

  -- Advisory lock scoped to BH-ID generation for this year.
  -- pg_advisory_xact_lock(42, <year>) serializes concurrent callers:
  --   42 = magic constant meaning "BH-ID sequence"
  --   v_year::int = the current year suffix (e.g., 26 for 2026)
  -- The lock auto-releases at transaction commit.
  PERFORM pg_advisory_xact_lock(42, v_year::int);

  -- Claim a matching identity-less row, if one exists. Callers cannot know a
  -- ghost is sitting on the address (webhook payloads carry only the Auth0
  -- user), so the lookup belongs here, under the same lock.
  SELECT id, role
  INTO v_ghost_id, v_ghost_role
  FROM profiles
  WHERE auth0_user_id IS NULL
    AND email IS NOT NULL
    AND lower(email) = lower(p_email)
  ORDER BY created_at
  LIMIT 1;

  IF v_ghost_id IS NOT NULL THEN
    -- Mint a BH-ID only when the ghost never had one.
    IF EXISTS (SELECT 1 FROM profiles WHERE id = v_ghost_id AND slug_id IS NULL) THEN
      SELECT COALESCE(MAX(CAST(SPLIT_PART(slug_id, '-', 3) AS integer)), 0) + 1
      INTO v_next_num
      FROM profiles
      WHERE slug_id LIKE 'BH-' || v_year || '-%';

      v_bh_id := 'BH-' || v_year || '-' || LPAD(v_next_num::text, 3, '0');
    END IF;

    UPDATE profiles
    SET auth0_user_id = p_auth0_user_id,
        email = lower(p_email),
        full_name = CASE
          WHEN p_full_name IS NULL OR btrim(p_full_name) = '' THEN full_name
          ELSE btrim(p_full_name)
        END,
        -- Never downgrade a privileged ghost row to the bootstrap role; a
        -- ghost is normally 'hacker', in which case the caller's role wins.
        role = CASE WHEN v_ghost_role = 'hacker' THEN p_role ELSE v_ghost_role END,
        is_claimed = true,
        slug_id = COALESCE(slug_id, v_bh_id),
        bh_id = COALESCE(bh_id, v_bh_id)
    WHERE id = v_ghost_id;

    RETURN jsonb_build_object(
      'id', v_ghost_id,
      'bh_id', (SELECT COALESCE(bh_id, v_bh_id) FROM profiles WHERE id = v_ghost_id)
    );
  END IF;

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
  'Atomically generates a sequential BH-ID (BH-YY-NNN) and inserts a new profile, or claims an existing identity-less (ghost) row on the same email. Uses pg_advisory_xact_lock to prevent race conditions during concurrent signups.';
