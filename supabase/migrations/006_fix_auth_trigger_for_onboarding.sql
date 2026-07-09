-- Day 24 Final: Update trigger to force onboarding flow
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ 
BEGIN 
    -- Simply create the profile with is_claimed = false.
    -- We no longer generate the BH-ID here; it happens during the onboarding reveal.
    INSERT INTO public.profiles (id, email, role, is_claimed) 
    VALUES (new.id, new.email, 'hacker', false); 
    RETURN new; 
END; 
$$;

-- Re-apply trigger to ensure it's using the new logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
