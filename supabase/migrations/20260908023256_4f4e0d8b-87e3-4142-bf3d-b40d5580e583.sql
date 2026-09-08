CREATE OR REPLACE FUNCTION public.get_order_by_token(_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'public_token', o.public_token,
    'reference', o.reference,
    'status', o.status,
    'store_name', s.name,
    'store_slug', s.slug,
    'store_location', s.location,
    'pickup_info', s.pickup_info,
    'hours', s.hours,
    'customer_name', o.customer_name,
    'customer_email', o.customer_email,
    'fulfilment', o.fulfilment,
    'delivery_address', o.delivery_address,
    'currency', o.currency,
    'subtotal_cents', o.subtotal_cents,
    'delivery_fee_cents', o.delivery_fee_cents,
    'service_fee_cents', o.service_fee_cents,
    'customer_fee_cents', o.customer_fee_cents,
    'tip_cents', o.tip_cents,
    'tip_paid_at', o.tip_paid_at,
    'tip_eligible', (
      o.paid_at IS NOT NULL
      AND o.tip_paid_at IS NULL
      AND o.status IN ('ready', 'out_for_delivery', 'completed')
      AND o.paid_at > now() - interval '24 hours'
    ),
    'tax_cents', o.tax_cents,
    'total_cents', o.total_cents,
    'paid_at', o.paid_at,
    'created_at', o.created_at,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', i.name,
        'quantity', i.quantity,
        'unit_price_cents', i.unit_price_cents,
        'line_total_cents', i.line_total_cents
      ) ORDER BY i.created_at)
      FROM public.order_items i WHERE i.order_id = o.id
    ), '[]'::jsonb)
  )
  INTO result
  FROM public.orders o
  JOIN public.merchant_storefronts s ON s.id = o.storefront_id
  WHERE o.public_token = _token;

  RETURN result;
END;
$function$;