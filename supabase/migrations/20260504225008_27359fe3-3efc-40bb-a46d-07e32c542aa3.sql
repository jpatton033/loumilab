-- 1. Add explicit deny policy on rate_limits (RLS enabled, no policy = no client access already, but make it explicit)
CREATE POLICY "No client access to rate_limits"
ON public.rate_limits
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2. Revoke EXECUTE on SECURITY DEFINER functions from public roles
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- has_role is used in RLS policies for authenticated users; keep grant for authenticated only
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;