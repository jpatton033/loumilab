ALTER TABLE public.email_setup_requests DROP CONSTRAINT IF EXISTS email_setup_requests_service_status_check;
ALTER TABLE public.email_setup_requests DROP CONSTRAINT IF EXISTS email_setup_requests_payment_status_check;
UPDATE public.email_setup_requests SET service_status = 'ready_for_setup' WHERE service_status = 'paid_awaiting_setup';
ALTER TABLE public.email_setup_requests ADD CONSTRAINT email_setup_requests_service_status_check CHECK (service_status IN ('new_request','awaiting_review','awaiting_quote','awaiting_approval','awaiting_payment','ready_for_setup','in_progress','awaiting_customer','testing','completed','canceled'));
ALTER TABLE public.email_setup_requests ADD CONSTRAINT email_setup_requests_payment_status_check CHECK (payment_status IN ('unpaid','pending','paid','partially_paid','additional_payment_required','refunded','partially_refunded','failed','expired','not_required'));
ALTER TABLE public.email_setup_requests ADD COLUMN IF NOT EXISTS third_party_snapshot jsonb, ADD COLUMN IF NOT EXISTS third_party_ack_at timestamptz, ADD COLUMN IF NOT EXISTS provider_plan text;

CREATE TABLE public.email_provider_prices (
  key text PRIMARY KEY,
  provider text NOT NULL,
  plan_name text NOT NULL,
  monthly_cents integer NOT NULL CHECK (monthly_cents >= 0),
  per_user boolean NOT NULL DEFAULT true,
  billing_note text NOT NULL DEFAULT '',
  monthly_available boolean NOT NULL DEFAULT false,
  url text NOT NULL,
  checked_on date NOT NULL DEFAULT current_date,
  sort integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.email_provider_prices TO authenticated;
GRANT ALL ON public.email_provider_prices TO service_role;
ALTER TABLE public.email_provider_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage provider prices" ON public.email_provider_prices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER email_provider_prices_updated BEFORE UPDATE ON public.email_provider_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_email_provider_prices()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(p) - 'updated_at' ORDER BY p.sort), '[]'::jsonb) FROM public.email_provider_prices p WHERE p.active;
$$;
GRANT EXECUTE ON FUNCTION public.get_email_provider_prices() TO anon, authenticated;

CREATE TABLE public.email_setup_change_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.email_setup_requests(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','declined','paid','canceled')),
  customer_reason text NOT NULL,
  internal_note text,
  package_from text NOT NULL,
  package_to text NOT NULL,
  mailboxes_to integer,
  devices_to integer,
  total_before_cents integer NOT NULL,
  total_after_cents integer NOT NULL,
  paid_before_cents integer NOT NULL,
  amount_due_cents integer NOT NULL,
  credit_cents integer NOT NULL DEFAULT 0,
  stripe_session_id text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_count integer NOT NULL DEFAULT 1,
  decided_at timestamptz,
  paid_at timestamptz,
  canceled_at timestamptz
);
CREATE UNIQUE INDEX email_setup_one_open_change ON public.email_setup_change_sets(request_id) WHERE status IN ('proposed','approved');
GRANT SELECT ON public.email_setup_change_sets TO authenticated;
GRANT ALL ON public.email_setup_change_sets TO service_role;
ALTER TABLE public.email_setup_change_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read change sets" ON public.email_setup_change_sets FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.email_setup_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.email_setup_requests(id) ON DELETE CASCADE,
  change_set_id uuid NOT NULL REFERENCES public.email_setup_change_sets(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('package_change','addon','custom','discount','credit')),
  label text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cents integer NOT NULL,
  amount_cents integer NOT NULL,
  reason text NOT NULL,
  customer_note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_setup_adjustments TO authenticated;
GRANT ALL ON public.email_setup_adjustments TO service_role;
ALTER TABLE public.email_setup_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read adjustments" ON public.email_setup_adjustments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.email_setup_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.email_setup_requests(id) ON DELETE CASCADE,
  change_set_id uuid REFERENCES public.email_setup_change_sets(id),
  kind text NOT NULL CHECK (kind IN ('charge','refund')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  stripe_ref text NOT NULL UNIQUE,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_setup_payments TO authenticated;
GRANT ALL ON public.email_setup_payments TO service_role;
ALTER TABLE public.email_setup_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read payments" ON public.email_setup_payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.email_setup_payments (request_id, kind, amount_cents, stripe_ref, stripe_payment_intent_id, created_at)
SELECT id, 'charge', paid_cents, COALESCE(stripe_session_id, 'legacy:' || id::text), stripe_payment_intent_id, COALESCE(paid_at, now())
FROM public.email_setup_requests WHERE payment_status = 'paid' AND paid_cents > 0
ON CONFLICT (stripe_ref) DO NOTHING;

CREATE OR REPLACE FUNCTION public.email_setup_status(_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r public.email_setup_requests;
BEGIN
  IF _token IS NULL OR length(_token) < 32 THEN RETURN NULL; END IF;
  SELECT * INTO r FROM public.email_setup_requests
   WHERE access_token_hash = encode(extensions.digest(_token, 'sha256'), 'hex');
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'request_number', r.request_number, 'package', r.package, 'business_name', r.business_name,
    'first_name', split_part(r.full_name, ' ', 1), 'provider', r.provider, 'primary_address', r.primary_address,
    'mailboxes', r.mailboxes, 'extra_devices', r.extra_devices, 'needs_review', r.needs_review,
    'price_lines', r.price_lines, 'total_cents', r.total_cents, 'quote_cents', r.quote_cents, 'quote_note', r.quote_note,
    'service_status', r.service_status, 'payment_status', r.payment_status, 'paid_at', r.paid_at,
    'third_party', r.third_party_snapshot,
    'customer_action_message', CASE WHEN r.service_status = 'awaiting_customer' THEN r.customer_action_message END,
    'completed_at', r.completed_at, 'created_at', r.created_at,
    'payments', COALESCE((SELECT jsonb_agg(jsonb_build_object('kind', p.kind, 'amount_cents', p.amount_cents, 'at', p.created_at) ORDER BY p.created_at)
       FROM public.email_setup_payments p WHERE p.request_id = r.id), '[]'::jsonb),
    'change_sets', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'status', c.status, 'customer_reason', c.customer_reason, 'package_from', c.package_from, 'package_to', c.package_to,
        'total_before_cents', c.total_before_cents, 'total_after_cents', c.total_after_cents, 'paid_before_cents', c.paid_before_cents,
        'amount_due_cents', c.amount_due_cents, 'credit_cents', c.credit_cents, 'created_at', c.created_at,
        'lines', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', a.label, 'quantity', a.quantity, 'unit_cents', a.unit_cents, 'amount_cents', a.amount_cents, 'note', a.customer_note) ORDER BY a.created_at)
           FROM public.email_setup_adjustments a WHERE a.change_set_id = c.id), '[]'::jsonb)) ORDER BY c.created_at DESC)
       FROM public.email_setup_change_sets c WHERE c.request_id = r.id AND c.status <> 'canceled'), '[]'::jsonb),
    'updates', COALESCE((SELECT jsonb_agg(jsonb_build_object('kind', e.kind, 'detail', e.detail, 'at', e.created_at) ORDER BY e.created_at DESC)
       FROM public.email_setup_events e WHERE e.request_id = r.id AND e.visible_to_customer), '[]'::jsonb));
END $$;