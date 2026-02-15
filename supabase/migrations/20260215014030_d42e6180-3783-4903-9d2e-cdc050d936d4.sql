
-- Remove email column from profiles table to avoid duplicating sensitive data from auth.users
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update handle_new_user trigger function to stop inserting email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;
