
-- Fix 1: Add explicit DELETE deny policy on profiles
CREATE POLICY "Profiles cannot be deleted"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- Fix 2: Harden has_role to prevent cross-user role enumeration
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own roles unless caller is admin
  IF _user_id != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;
