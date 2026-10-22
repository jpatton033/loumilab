CREATE TABLE public.orders_fee_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version serial NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  tiers jsonb NOT NULL,
  effective_at timestamptz,
  notes text,
  created_by uuid,
  activated_by uuid,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders_fee_schedules TO authenticated;
GRANT ALL ON public.orders_fee_schedules TO service_role;
ALTER TABLE public.orders_fee_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read fee schedules" ON public.orders_fee_schedules FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance insert fee schedules" ON public.orders_fee_schedules FOR INSERT TO authenticated WITH CHECK (public.is_finance_admin(auth.uid()));
CREATE POLICY "Finance update fee schedules" ON public.orders_fee_schedules FOR UPDATE TO authenticated USING (public.is_finance_admin(auth.uid())) WITH CHECK (public.is_finance_admin(auth.uid()));
CREATE TRIGGER orders_fee_schedules_updated BEFORE UPDATE ON public.orders_fee_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Once activated, a schedule's tiers and effective date are frozen.
CREATE OR REPLACE FUNCTION public.guard_fee_schedule() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status <> 'draft' AND (NEW.tiers IS DISTINCT FROM OLD.tiers OR NEW.effective_at IS DISTINCT FROM OLD.effective_at) THEN
    RAISE EXCEPTION 'Activated fee schedules cannot be edited; create a new version';
  END IF;
  IF OLD.status = 'retired' AND NEW.status <> 'retired' THEN
    RAISE EXCEPTION 'Retired fee schedules cannot be reactivated; create a new version';
  END IF;
  IF NEW.status = 'active' AND NEW.effective_at IS NULL THEN
    RAISE EXCEPTION 'An effective date is required to activate';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_fee_schedules_guard BEFORE UPDATE ON public.orders_fee_schedules FOR EACH ROW EXECUTE FUNCTION public.guard_fee_schedule();

CREATE TABLE public.orders_fee_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.orders_fee_reservations TO service_role;
ALTER TABLE public.orders_fee_reservations ENABLE ROW LEVEL SECURITY;
CREATE INDEX orders_fee_reservations_merchant_idx ON public.orders_fee_reservations (merchant_id, created_at);

ALTER TABLE public.orders
  ADD COLUMN fee_schedule_id uuid,
  ADD COLUMN fee_volume_start_cents integer,
  ADD COLUMN fee_breakdown jsonb,
  ADD COLUMN fee_refunded_cents integer NOT NULL DEFAULT 0;
ALTER TABLE public.merchant_invoices
  ADD COLUMN platform_fee_bps integer,
  ADD COLUMN fee_schedule_id uuid,
  ADD COLUMN fee_volume_start_cents integer,
  ADD COLUMN fee_breakdown jsonb,
  ADD COLUMN fee_refunded_cents integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS orders_merchant_paid_idx ON public.orders (merchant_id, paid_at);

-- Start of the current billing month (calendar month, US Eastern).
CREATE OR REPLACE FUNCTION public.fee_period_start(_at timestamptz DEFAULT now()) RETURNS timestamptz
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (date_trunc('month', _at AT TIME ZONE 'America/New_York')) AT TIME ZONE 'America/New_York'
$$;

-- Paid merchandise volume this period, net of refunds/chargebacks.
CREATE OR REPLACE FUNCTION public.merchant_fee_paid_volume(_merchant_id uuid, _from timestamptz) RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT SUM(GREATEST(subtotal_cents - fee_refunded_cents, 0)) FROM public.orders
     WHERE merchant_id = _merchant_id AND paid_at >= _from AND status NOT IN ('pending','failed','cancelled')), 0)
   + COALESCE((SELECT SUM(GREATEST(amount_cents - fee_refunded_cents, 0)) FROM public.merchant_invoices
     WHERE merchant_id = _merchant_id AND status = 'paid' AND paid_at >= _from), 0)
$$;
REVOKE ALL ON FUNCTION public.merchant_fee_paid_volume(uuid, timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.active_fee_schedule() RETURNS public.orders_fee_schedules
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.orders_fee_schedules WHERE status = 'active' AND effective_at <= now()
  ORDER BY effective_at DESC, version DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.active_fee_schedule() FROM PUBLIC, anon, authenticated;

-- Serialised per merchant: returns the volume this order starts at (paid +
-- in-flight checkouts) and holds the order's amount for two minutes so a
-- concurrent checkout cannot claim the same room in a tier.
CREATE OR REPLACE FUNCTION public.reserve_fee_volume(_merchant_id uuid, _cents integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _from timestamptz := public.fee_period_start(); _vol bigint; _res uuid; _sched public.orders_fee_schedules;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('fee_volume:' || _merchant_id::text));
  DELETE FROM public.orders_fee_reservations WHERE created_at < now() - interval '2 minutes';
  _vol := public.merchant_fee_paid_volume(_merchant_id, _from)
    + COALESCE((SELECT SUM(subtotal_cents) FROM public.orders WHERE merchant_id = _merchant_id AND status = 'pending'
         AND created_at >= GREATEST(_from, now() - interval '30 minutes')), 0)
    + COALESCE((SELECT SUM(cents) FROM public.orders_fee_reservations WHERE merchant_id = _merchant_id), 0);
  INSERT INTO public.orders_fee_reservations (merchant_id, cents) VALUES (_merchant_id, GREATEST(_cents, 0)) RETURNING id INTO _res;
  _sched := public.active_fee_schedule();
  RETURN jsonb_build_object('volume_start_cents', _vol, 'reservation_id', _res,
    'schedule', CASE WHEN _sched.id IS NULL THEN NULL ELSE jsonb_build_object('id', _sched.id, 'version', _sched.version, 'tiers', _sched.tiers) END);
END $$;
REVOKE ALL ON FUNCTION public.reserve_fee_volume(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_fee_volume(uuid, integer) TO service_role;

-- Public: the live schedule and any announced future one (tiers only).
CREATE OR REPLACE FUNCTION public.get_fee_schedule() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'active', (SELECT jsonb_build_object('version', version, 'tiers', tiers, 'effective_at', effective_at)
               FROM public.orders_fee_schedules WHERE status='active' AND effective_at <= now() ORDER BY effective_at DESC, version DESC LIMIT 1),
    'upcoming', (SELECT jsonb_build_object('version', version, 'tiers', tiers, 'effective_at', effective_at)
               FROM public.orders_fee_schedules WHERE status='active' AND effective_at > now() ORDER BY effective_at ASC LIMIT 1))
$$;
GRANT EXECUTE ON FUNCTION public.get_fee_schedule() TO anon, authenticated;

-- Signed-in merchant's progress this period.
CREATE OR REPLACE FUNCTION public.merchant_fee_progress() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _m public.merchants; _from timestamptz := public.fee_period_start(); _plan text; _flat int;
BEGIN
  SELECT * INTO _m FROM public.merchants WHERE user_id = auth.uid() LIMIT 1;
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
END $$;
REVOKE ALL ON FUNCTION public.merchant_fee_progress() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merchant_fee_progress() TO authenticated;

-- Staff: this period's totals.
CREATE OR REPLACE FUNCTION public.admin_fee_summary() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _from timestamptz := public.fee_period_start();
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN (SELECT jsonb_build_object(
    'period_start', _from,
    'merchants', COUNT(DISTINCT merchant_id),
    'volume_cents', COALESCE(SUM(GREATEST(subtotal_cents - fee_refunded_cents,0)),0),
    'fees_cents', COALESCE(SUM(platform_fee_cents),0),
    'progressive_orders', COUNT(*) FILTER (WHERE fee_schedule_id IS NOT NULL),
    'flat_equivalent_cents', COALESCE(SUM(ROUND(subtotal_cents * COALESCE((SELECT platform_fee_bps FROM public.orders_plans p JOIN public.merchants m ON m.plan_slug=p.slug WHERE m.id=o.merchant_id),500) / 10000.0)) FILTER (WHERE fee_schedule_id IS NOT NULL),0))
    FROM public.orders o WHERE paid_at >= _from AND status NOT IN ('pending','failed','cancelled'));
END $$;
REVOKE ALL ON FUNCTION public.admin_fee_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_fee_summary() TO authenticated;