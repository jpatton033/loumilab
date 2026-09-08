ALTER TABLE public.merchant_storefronts
  ADD COLUMN IF NOT EXISTS service_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_fee_label text NOT NULL DEFAULT 'Service fee',
  ADD COLUMN IF NOT EXISTS delivery_tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS customer_fee_share_bps integer NOT NULL DEFAULT 0;

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS fee_share_override_bps integer;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS service_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS merchant_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tip_paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS tip_stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS tip_stripe_checkout_session_id text;

CREATE OR REPLACE FUNCTION public.validate_storefront_fee_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.service_fee_cents < 0 OR NEW.service_fee_cents > 100000 THEN
    RAISE EXCEPTION 'Service fee must be between 0 and 100000 cents';
  END IF;
  IF NEW.customer_fee_share_bps < 0 OR NEW.customer_fee_share_bps > 10000 THEN
    RAISE EXCEPTION 'Customer fee share must be between 0 and 10000 basis points';
  END IF;
  IF jsonb_typeof(NEW.delivery_tiers) <> 'array' THEN
    RAISE EXCEPTION 'Delivery tiers must be an array';
  END IF;
  IF jsonb_array_length(NEW.delivery_tiers) > 8 THEN
    RAISE EXCEPTION 'At most 8 delivery tiers are allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_storefront_fee_settings ON public.merchant_storefronts;
CREATE TRIGGER validate_storefront_fee_settings
  BEFORE INSERT OR UPDATE ON public.merchant_storefronts
  FOR EACH ROW EXECUTE FUNCTION public.validate_storefront_fee_settings();

CREATE OR REPLACE FUNCTION public.get_order_tip_context(_token uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'order_id', o.id,
    'status', o.status,
    'currency', o.currency,
    'subtotal_cents', o.subtotal_cents,
    'tip_cents', o.tip_cents,
    'tip_paid_at', o.tip_paid_at,
    'business_name', m.business_name,
    'paid_at', o.paid_at,
    'tip_eligible', (
      o.paid_at IS NOT NULL
      AND o.tip_paid_at IS NULL
      AND o.status IN ('completed', 'out_for_delivery', 'ready')
      AND o.paid_at > now() - interval '24 hours'
    )
  )
  FROM public.orders o
  JOIN public.merchants m ON m.id = o.merchant_id
  WHERE o.public_token = _token
$$;

REVOKE ALL ON FUNCTION public.get_order_tip_context(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_tip_context(uuid) TO anon, authenticated;