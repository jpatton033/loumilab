DROP FUNCTION IF EXISTS public.merchant_support_activity();
CREATE FUNCTION public.merchant_support_activity()
RETURNS TABLE(created_at timestamptz, action text, by_merchant boolean, old_value jsonb, new_value jsonb, reason text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.created_at, a.action, (a.actor_role = 'merchant'), a.old_value, a.new_value, a.reason
  FROM public.audit_logs a
  WHERE a.target_type = 'merchant'
    AND a.action LIKE 'support.%'
    AND a.target_id IN (SELECT m.id::text FROM public.merchants m WHERE m.owner_id = auth.uid())
  ORDER BY a.created_at DESC
  LIMIT 100
$$;
REVOKE EXECUTE ON FUNCTION public.merchant_support_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merchant_support_activity() TO authenticated;