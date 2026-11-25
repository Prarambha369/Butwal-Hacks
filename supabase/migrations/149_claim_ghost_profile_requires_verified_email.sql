-- 149_claim_ghost_profile_requires_verified_email.sql
--
-- create_profile_with_bh_id (migration 142) attaches a new Auth0 identity to
-- an identity-less "ghost" profile whose email matches, and keeps the ghost's
-- role when it is privileged. It trusted p_email unconditionally, so anyone
-- who signed up with someone else's address and never verified it could take
-- over that pre-existing row (and an organizer role seeded on it).
--
-- The claim now requires the caller to vouch that the address is verified
-- (p_email_verified). Callers that cannot vouch get the old insert, which
-- collides with UNIQUE(profiles.email) on a ghost address and returns 23505;
-- every caller already handles that as "email belongs to another profile".
--
-- The parameter defaults to false, so a 4-argument call from code deployed
-- before this migration fails closed (no claim) rather than open.
--
-- Adding a parameter creates a new overload, so the 4-argument version is
-- dropped first, and the 117 EXECUTE restriction is re-applied to the new
-- signature (CREATE does not inherit the old function's ACL).

DROP FUNCTION IF EXISTS public.create_profile_with_bh_id(text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_profile_with_bh_id(
  p_auth0_user_id text,
  p_email text,
  p_full_name text DEFAULT 'New Hacker',
  p_role text DEFAULT 'hacker',
  p_email_verified boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

  -- Serialises BH-ID minting for this year (42 = "BH-ID sequence").
  PERFORM pg_advisory_xact_lock(42, v_year::int);

  IF p_email_verified IS TRUE THEN
    SELECT id, role
    INTO v_ghost_id, v_ghost_role
    FROM profiles
    WHERE auth0_user_id IS NULL
      AND email IS NOT NULL
      AND lower(email) = lower(p_email)
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF v_ghost_id IS NOT NULL THEN
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

REVOKE ALL ON FUNCTION public.create_profile_with_bh_id(text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_with_bh_id(text, text, text, text, boolean) TO service_role;

COMMENT ON FUNCTION public.create_profile_with_bh_id(text, text, text, text, boolean) IS
  'Atomically generates a sequential BH-ID (BH-YY-NNN) and inserts a new profile. Claims an identity-less (ghost) row on the same email only when p_email_verified is true. Uses pg_advisory_xact_lock to serialise concurrent signups.';
