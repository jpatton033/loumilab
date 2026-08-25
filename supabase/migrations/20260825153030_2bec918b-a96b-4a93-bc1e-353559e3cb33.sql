-- ============ order status enum ============
CREATE TYPE public.order_status AS ENUM (
  'pending','paid','failed','cancelled','preparing','ready','out_for_delivery','completed','refunded'
);

CREATE TYPE public.fulfilment_type AS ENUM ('pickup','delivery');

-- ============ storefronts ============
CREATE TABLE public.merchant_storefronts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  location text,
  description text,
  monogram text,
  logo_url text,
  hero_image_url text,
  hours text,
  pickup_enabled boolean NOT NULL DEFAULT true,
  pickup_info text,
  delivery_enabled boolean NOT NULL DEFAULT false,
  delivery_fee_cents integer NOT NULL DEFAULT 0,
  delivery_radius_miles integer,
  delivery_minimum_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX merchant_storefronts_merchant_key ON public.merchant_storefronts(merchant_id);

GRANT SELECT ON public.merchant_storefronts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_storefronts TO authenticated;
GRANT ALL ON public.merchant_storefronts TO service_role;
ALTER TABLE public.merchant_storefronts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published storefronts are public"
  ON public.merchant_storefronts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Owners manage their storefront"
  ON public.merchant_storefronts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE POLICY "Staff view all storefronts"
  ON public.merchant_storefronts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_merchant_storefronts_updated_at
  BEFORE UPDATE ON public.merchant_storefronts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ products ============
CREATE TABLE public.merchant_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  storefront_id uuid NOT NULL REFERENCES public.merchant_storefronts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  image_url text,
  category text,
  availability text NOT NULL DEFAULT 'available',
  tax_code text NOT NULL DEFAULT 'txcd_99999999',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX merchant_products_storefront_idx ON public.merchant_products(storefront_id);

GRANT SELECT ON public.merchant_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_products TO authenticated;
GRANT ALL ON public.merchant_products TO service_role;
ALTER TABLE public.merchant_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products of published storefronts are public"
  ON public.merchant_products FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.merchant_storefronts s
    WHERE s.id = storefront_id AND s.is_published = true
  ));

CREATE POLICY "Owners manage their products"
  ON public.merchant_products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE POLICY "Staff view all products"
  ON public.merchant_products FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_merchant_products_updated_at
  BEFORE UPDATE ON public.merchant_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ orders ============
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  storefront_id uuid NOT NULL REFERENCES public.merchant_storefronts(id) ON DELETE CASCADE,
  public_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  reference text,
  customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  fulfilment public.fulfilment_type NOT NULL DEFAULT 'pickup',
  delivery_address text,
  customer_notes text,
  status public.order_status NOT NULL DEFAULT 'pending',
  currency text NOT NULL DEFAULT 'usd',
  subtotal_cents integer NOT NULL DEFAULT 0,
  delivery_fee_cents integer NOT NULL DEFAULT 0,
  tip_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  platform_fee_bps integer NOT NULL DEFAULT 0,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_account_id text,
  livemode boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_merchant_idx ON public.orders(merchant_id, created_at DESC);
CREATE INDEX orders_session_idx ON public.orders(stripe_checkout_session_id);

GRANT SELECT ON public.orders TO authenticated;
GRANT UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view their orders"
  ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE POLICY "Merchants update their orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE POLICY "Customers view their own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (customer_user_id = auth.uid());

CREATE POLICY "Staff view all orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ order items ============
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.merchant_products(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price_cents integer NOT NULL,
  quantity integer NOT NULL,
  line_total_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);

GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items follow order visibility"
  ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (
        o.customer_user_id = auth.uid()
        OR public.is_staff(auth.uid())
        OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = o.merchant_id AND m.owner_id = auth.uid())
      )
  ));

-- ============ public receipt lookup by secret token ============
CREATE OR REPLACE FUNCTION public.get_order_by_token(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    'tip_cents', o.tip_cents,
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
$$;

REVOKE EXECUTE ON FUNCTION public.get_order_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_token(uuid) TO anon, authenticated, service_role;