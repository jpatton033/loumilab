CREATE OR REPLACE FUNCTION public.merchant_fee_progress()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _m public.merchants; _from timestamptz := public.fee_period_start(); _plan text; _flat int;
BEGIN
  SELECT * INTO _m FROM public.merchants WHERE owner_id = auth.uid() LIMIT 1;
  IF _m.id IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE((SELECT plan_slug FROM public.merchant_subscriptions WHERE merchant_id = _m.id AND status IN ('active','trialing','past_due')), _m.plan_slug, 'starter') INTO _plan;
  SELECT platform_fee_bps INTO _flat FROM public.orders_plans WHERE slug = _plan;
  RETURN jsonb_build_object(
    'plan_slug', _plan,
    'flat_bps', COALESCE(_flat, 500),
    'period_start', _from,
    'volume_cents', public.merchant_fee_paid_volume(_m.id, _from),
    'fees_cents', COALESCE((SELECT SUM(platform_fee_cents) FROM public.orders WHERE merchant_id=_m.id AND paid_at >= _from AND status NOT IN ('pending','failed','cancelled')),0)
                + COALESCE((SELECT SUM(platform_fee_cents) FROM public.merchant_invoices WHERE merchant_id=_m.id AND status='paid' AND paid_at >= _from),0),
    'schedule', (SELECT jsonb_build_object('version', s.version, 'tiers', s.tiers) FROM public.active_fee_schedule() s WHERE s.id IS NOT NULL));
END $function$;