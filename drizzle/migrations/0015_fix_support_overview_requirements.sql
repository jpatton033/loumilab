CREATE OR REPLACE FUNCTION public.support_merchant_overview(_merchant uuid, _view_as boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r jsonb;
BEGIN
  IF public.support_level(auth.uid()) < 1 THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT jsonb_build_object(
    'merchant', (SELECT jsonb_build_object('id',m.id,'business_name',m.business_name,'contact_email',m.contact_email,'industry_slug',m.industry_slug,
        'plan_slug',m.plan_slug,'accepting_orders',m.accepting_orders,'created_at',m.created_at,
        'email_confirmed', (SELECT u.email_confirmed_at IS NOT NULL FROM auth.users u WHERE u.id=m.owner_id),
        'last_sign_in_at', (SELECT u.last_sign_in_at FROM auth.users u WHERE u.id=m.owner_id)) FROM public.merchants m WHERE m.id=_merchant),
    'storefront', (SELECT jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug,'status',s.status,'is_published',s.is_published,'location',s.location,
        'description',s.description,'hours',s.hours,'pickup_enabled',s.pickup_enabled,'pickup_info',s.pickup_info,'delivery_enabled',s.delivery_enabled,
        'delivery_fee_cents',s.delivery_fee_cents,'delivery_minimum_cents',s.delivery_minimum_cents,'logo_url',s.logo_url)
        FROM public.merchant_storefronts s WHERE s.merchant_id=_merchant ORDER BY s.created_at LIMIT 1),
    'products', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'description',p.description,'price_cents',p.price_cents,'availability',p.availability,'is_active',p.is_active) ORDER BY p.display_order)
        FROM public.merchant_products p WHERE p.merchant_id=_merchant), '[]'),
    'payouts', (SELECT jsonb_build_object('payout_status',a.payout_status,'details_submitted',a.details_submitted,'charges_enabled',a.charges_enabled,'payouts_enabled',a.payouts_enabled,'has_requirements', COALESCE(jsonb_typeof(a.requirements_due)='array' AND jsonb_array_length(a.requirements_due)>0, false))
        FROM public.merchant_stripe_accounts a WHERE a.merchant_id=_merchant LIMIT 1),
    'local', (SELECT jsonb_build_object('is_listed',l.is_listed,'display_name',l.display_name,'tagline',l.tagline,'category',l.category,'hours_text',l.hours_text,'slug',l.slug)
        FROM public.merchant_local_profiles l WHERE l.merchant_id=_merchant LIMIT 1),
    'calendar', (SELECT jsonb_build_object('provider',c.provider,'connected',c.calendar_id IS NOT NULL,'reconnect_required',c.reconnect_required) FROM public.merchant_calendar_links c WHERE c.merchant_id=_merchant),
    'orders', jsonb_build_object('total',(SELECT count(*) FROM public.orders o WHERE o.merchant_id=_merchant),
        'last_order_at',(SELECT max(created_at) FROM public.orders o WHERE o.merchant_id=_merchant)),
    'grants', COALESCE((SELECT jsonb_agg(to_jsonb(g) ORDER BY g.created_at DESC) FROM public.support_access_grants g WHERE g.merchant_id=_merchant), '[]')
  ) INTO _r;
  IF _r->'merchant' IS NULL OR _r->'merchant' = 'null'::jsonb THEN RAISE EXCEPTION 'Not found'; END IF;
  PERFORM public.support_audit(CASE WHEN _view_as THEN 'support.view_as_merchant' ELSE 'support.view_merchant' END, _merchant, NULL, NULL, NULL, NULL);
  RETURN _r;
END $$;