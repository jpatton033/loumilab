-- Merchants may only move an order through fulfilment statuses; payment fields are set only by the server.
CREATE OR REPLACE FUNCTION public.guard_merchant_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at') THEN
    RAISE EXCEPTION 'Only the order status can be changed';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('pending','paid','failed','refunded') THEN
      RAISE EXCEPTION 'This status is set automatically by payments';
    END IF;
    IF OLD.paid_at IS NULL AND NEW.status <> 'cancelled' THEN
      RAISE EXCEPTION 'Unpaid orders can only be cancelled';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_merchant_order_update ON public.orders;
CREATE TRIGGER guard_merchant_order_update BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_merchant_order_update();

-- Invoices and deposit requests require the matching paid-plan feature.
CREATE OR REPLACE FUNCTION public.guard_merchant_invoice_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ent jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  SELECT p.entitlements INTO ent FROM public.merchants m
    LEFT JOIN public.orders_plans p ON p.slug = m.plan_slug AND p.is_active = true
    WHERE m.id = NEW.merchant_id;
  IF NEW.kind = 'deposit' THEN
    IF NOT COALESCE((ent ->> 'deposits.enabled')::boolean, false) THEN
      RAISE EXCEPTION 'Deposits require a paid plan';
    END IF;
  ELSIF NOT COALESCE((ent ->> 'invoicing.enabled')::boolean, false) THEN
    RAISE EXCEPTION 'Invoicing requires a paid plan';
  END IF;
  IF NEW.paid_at IS NOT NULL OR NEW.status NOT IN ('draft','sent') THEN
    RAISE EXCEPTION 'New invoices must be unpaid';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_merchant_invoice_insert ON public.merchant_invoices;
CREATE TRIGGER guard_merchant_invoice_insert BEFORE INSERT ON public.merchant_invoices
  FOR EACH ROW EXECUTE FUNCTION public.guard_merchant_invoice_insert();