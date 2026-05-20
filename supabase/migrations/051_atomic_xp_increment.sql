-- 051_atomic_xp_increment.sql
-- Atomic XP increment to prevent TOCTOU race conditions.
-- ponytail: Replaces select-then-update with a single SQL statement.

CREATE OR REPLACE FUNCTION increment_xp(p_profile_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_xp integer;
BEGIN
  UPDATE profiles
  SET xp = xp + p_amount
  WHERE id = p_profile_id
  RETURNING xp INTO new_xp;

  IF new_xp IS NULL THEN
    RAISE EXCEPTION 'Profile not found: %', p_profile_id;
  END IF;

  RETURN new_xp;
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION increment_xp(uuid, integer) TO authenticated;
