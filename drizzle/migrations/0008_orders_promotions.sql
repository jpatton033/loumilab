CREATE TABLE public.orders_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  terms text NOT NULL DEFAULT '',
  fee_bps integer NOT NULL DEFAULT 0 CHECK (fee_bps BETWEEN 0 AND 1000),
  duration_days integer NOT NULL DEFAULT 14 CHECK (duration_days BETWEEN 1 AND 365),
  starts_at timestamptz NOT NULL DEFAULT now(),
  signup_deadline timestamptz,
  start_trigger text NOT NULL DEFAULT 'publish' CHECK (start_trigger IN ('signup','publish','first_paid_order')),
  eligibility text NOT NULL DEFAULT 'new' CHECK (eligibility IN ('new','existing','selected')),
  selected_merchant_ids uuid[] NOT NULL DEFAULT '{}',
  show_homepage boolean NOT NULL DEFAULT true,
  show_builder boolean NOT NULL DEFAULT true,
  show_onboarding boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT active_needs_deadline CHECK (status <> 'active' OR signup_deadline IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders_promotions TO authenticated;
GRANT ALL ON public.orders_promotions TO service_role;
ALTER TABLE public.orders_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage promotions" ON public.orders_promotions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER orders_promotions_updated BEFORE UPDATE ON public.orders_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.merchant_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  promotion_id uuid NOT NULL REFERENCES public.orders_promotions(id),
  status text NOT NULL DEFAULT 'qualified' CHECK (status IN ('qualified','active','expired','ended')),
  qualified_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  expires_at timestamptz,
  duration_days integer NOT NULL,
  start_trigger text NOT NULL,
  promo_fee_bps integer NOT NULL CHECK (promo_fee_bps BETWEEN 0 AND 1000),
  normal_fee_bps integer NOT NULL CHECK (normal_fee_bps BETWEEN 0 AND 1000),
  eligible_volume_cents bigint NOT NULL DEFAULT 0,
  fees_waived_cents bigint NOT NULL DEFAULT 0,
  ended_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX merchant_promotions_promotion_idx ON public.merchant_promotions(promotion_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_promotions TO authenticated;
GRANT ALL ON public.merchant_promotions TO service_role;
ALTER TABLE public.merchant_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage merchant promotions" ON public.merchant_promotions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Merchants read own promotion" ON public.merchant_promotions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS merchant_promotion_id uuid REFERENCES public.merchant_promotions(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_waived_cents integer NOT NULL DEFAULT 0;

-- Qualify / activate a merchant for a promotion. Never raises.
CREATE OR REPLACE FUNCTION public.promo_qualify(_merchant_id uuid, _event text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  mp public.merchant_promotions;
  p public.orders_promotions;
  m public.merchants;
  plan_bps integer;
BEGIN
  SELECT * INTO mp FROM public.merchant_promotions WHERE merchant_id = _merchant_id;
  IF FOUND THEN
    IF mp.status = 'qualified' AND mp.start_trigger = _event THEN
      UPDATE public.merchant_promotions
         SET status = 'active', activated_at = now(), expires_at = now() + make_interval(days => mp.duration_days)
       WHERE id = mp.id;
    END IF;
    RETURN;
  END IF;

  SELECT * INTO m FROM public.merchants WHERE id = _merchant_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT * INTO p FROM public.orders_promotions op
   WHERE op.status = 'active' AND now() >= op.starts_at AND now() <= op.signup_deadline
     AND (
       (op.eligibility = 'new' AND m.created_at >= op.starts_at)
       OR (op.eligibility = 'existing' AND m.created_at < op.starts_at)
       OR (op.eligibility = 'selected' AND _merchant_id = ANY(op.selected_merchant_ids))
     )
   ORDER BY op.fee_bps ASC, op.created_at ASC LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT platform_fee_bps INTO plan_bps FROM public.orders_plans WHERE slug = m.plan_slug;
  plan_bps := LEAST(GREATEST(COALESCE(plan_bps, 500), 0), 1000);

  INSERT INTO public.merchant_promotions
    (merchant_id, promotion_id, status, duration_days, start_trigger, promo_fee_bps, normal_fee_bps, activated_at, expires_at)
  VALUES (
    _merchant_id, p.id,
    CASE WHEN p.start_trigger = _event THEN 'active' ELSE 'qualified' END,
    p.duration_days, p.start_trigger, LEAST(p.fee_bps, plan_bps), plan_bps,
    CASE WHEN p.start_trigger = _event THEN now() END,
    CASE WHEN p.start_trigger = _event THEN now() + make_interval(days => p.duration_days) END
  ) ON CONFLICT (merchant_id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'promo_qualify failed: %', SQLERRM;
END $$;
REVOKE EXECUTE ON FUNCTION public.promo_qualify(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.promo_on_merchant_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.promo_qualify(NEW.id, 'signup'); RETURN NEW; END $$;
CREATE TRIGGER promo_merchant_signup AFTER INSERT ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.promo_on_merchant_insert();

CREATE OR REPLACE FUNCTION public.promo_on_storefront_publish() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_published AND (TG_OP = 'INSERT' OR NOT COALESCE(OLD.is_published, false)) THEN
    PERFORM public.promo_qualify(NEW.merchant_id, 'publish');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER promo_storefront_publish AFTER INSERT OR UPDATE OF is_published ON public.merchant_storefronts
  FOR EACH ROW EXECUTE FUNCTION public.promo_on_storefront_publish();

CREATE OR REPLACE FUNCTION public.promo_on_order_paid() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL THEN
    BEGIN
      IF NEW.merchant_promotion_id IS NOT NULL THEN
        UPDATE public.merchant_promotions
           SET eligible_volume_cents = eligible_volume_cents + COALESCE(NEW.subtotal_cents, 0),
               fees_waived_cents = fees_waived_cents + GREATEST(COALESCE(NEW.promo_waived_cents, 0), 0)
         WHERE id = NEW.merchant_promotion_id;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.merchant_id = NEW.merchant_id AND o.id <> NEW.id AND o.paid_at IS NOT NULL) THEN
        PERFORM public.promo_qualify(NEW.merchant_id, 'first_paid_order');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'promo_on_order_paid failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER promo_order_paid AFTER UPDATE OF paid_at ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.promo_on_order_paid();

-- Public display fields of the live campaign for a surface.
CREATE OR REPLACE FUNCTION public.get_active_promotion(_surface text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('id', id, 'name', name, 'message', message, 'description', description,
    'terms', terms, 'fee_bps', fee_bps, 'duration_days', duration_days, 'signup_deadline', signup_deadline,
    'start_trigger', start_trigger)
  FROM public.orders_promotions
  WHERE status = 'active' AND eligibility = 'new' AND now() BETWEEN starts_at AND signup_deadline
    AND CASE _surface WHEN 'homepage' THEN show_homepage WHEN 'builder' THEN show_builder
                      WHEN 'onboarding' THEN show_onboarding ELSE false END
  ORDER BY fee_bps ASC, created_at ASC LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_active_promotion(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.expire_merchant_promotions() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.merchant_promotions SET status = 'expired'
   WHERE status = 'active' AND expires_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.expire_merchant_promotions() FROM PUBLIC, anon, authenticated;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('expire-merchant-promotions', '15 * * * *', 'select public.expire_merchant_promotions()');
  END IF;
END $$;