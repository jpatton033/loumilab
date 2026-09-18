UPDATE public.orders_plans
SET entitlements = jsonb_set(coalesce(entitlements, '{}'::jsonb), '{messaging.enabled}', 'true'::jsonb, true),
    updated_at = now()
WHERE slug = 'custom';