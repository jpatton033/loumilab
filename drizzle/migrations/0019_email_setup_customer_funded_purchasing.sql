ALTER TABLE public.email_setup_requests
  ADD COLUMN purchase_mode text NOT NULL DEFAULT 'customer_direct' CHECK (purchase_mode IN ('customer_direct','loumilab_purchase')),
  ADD COLUMN third_party_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN third_party_budget_cents integer NOT NULL DEFAULT 0 CHECK (third_party_budget_cents >= 0),
  ADD COLUMN purchase_auth jsonb,
  ADD COLUMN purchase_auth_at timestamptz,
  ADD COLUMN fulfillment_stage text NOT NULL DEFAULT 'submitted' CHECK (fulfillment_stage IN ('submitted','payment_confirmed','purchasing','domain','email','testing','handoff','completed')),
  ADD COLUMN handoff jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN handoff_manual_review boolean NOT NULL DEFAULT false,
  ADD COLUMN handoff_customer_actions text,
  ADD COLUMN management_plan text CHECK (management_plan IN ('essential','business')),
  ADD COLUMN management_status text NOT NULL DEFAULT 'none' CHECK (management_status IN ('none','pending','active','past_due','canceling','canceled')),
  ADD COLUMN management_subscription_id text,
  ADD COLUMN management_consent_at timestamptz,
  ADD COLUMN stripe_customer_id text;

ALTER TABLE public.email_setup_change_sets ADD COLUMN third_party_delta_cents integer NOT NULL DEFAULT 0;

-- Completion needs the ownership/billing handoff, even for direct admin updates.
CREATE OR REPLACE FUNCTION public.email_setup_guard_completion()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE req text[]; k text;
BEGIN
  IF (NEW.service_status = 'completed' OR NEW.fulfillment_stage = 'completed')
     AND (OLD.service_status IS DISTINCT FROM NEW.service_status OR OLD.fulfillment_stage IS DISTINCT FROM NEW.fulfillment_stage) THEN
    IF NEW.handoff_manual_review THEN RAISE EXCEPTION 'Billing handoff is flagged for manual review'; END IF;
    req := CASE WHEN NEW.purchase_mode = 'loumilab_purchase'
      THEN ARRAY['domain_owner','registrar_access','email_owner','credentials','domain_billing','email_billing','loumilab_card_removed','renewals_documented','mailbox_tested','handoff_email']
      ELSE ARRAY['domain_owner','registrar_access','email_owner','credentials','mailbox_tested','handoff_email'] END;
    FOREACH k IN ARRAY req LOOP
      IF COALESCE((NEW.handoff ->> k)::boolean, false) IS NOT TRUE THEN
        RAISE EXCEPTION 'Complete the ownership and billing handoff checklist first';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER email_setup_guard_completion BEFORE UPDATE ON public.email_setup_requests
  FOR EACH ROW EXECUTE FUNCTION public.email_setup_guard_completion();

-- Actual third-party purchases made by Loumilab. Immutable; corrections are new entries.
CREATE TABLE public.email_setup_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.email_setup_requests(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('domain','email_hosting','other','correction')),
  vendor text NOT NULL CHECK (length(vendor) BETWEEN 1 AND 120),
  description text,
  amount_cents integer NOT NULL CHECK (amount_cents <> 0),
  purchased_on date NOT NULL,
  reference text,
  commitment text,
  renews_on date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_setup_purchases TO authenticated;
GRANT ALL ON public.email_setup_purchases TO service_role;
ALTER TABLE public.email_setup_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read purchases" ON public.email_setup_purchases FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX email_setup_purchases_request_idx ON public.email_setup_purchases(request_id);

-- Manual management checks (no automated monitoring is claimed).
CREATE TABLE public.email_setup_mgmt_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.email_setup_requests(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('monthly_dns','expiration_reminder','security_review','quarterly_review','support_request','other')),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_setup_mgmt_checks TO authenticated;
GRANT ALL ON public.email_setup_mgmt_checks TO service_role;
ALTER TABLE public.email_setup_mgmt_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read mgmt checks" ON public.email_setup_mgmt_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

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
    'purchase_mode', r.purchase_mode, 'third_party_lines', r.third_party_lines, 'third_party_budget_cents', r.third_party_budget_cents,
    'purchase_auth_at', r.purchase_auth_at, 'fulfillment_stage', r.fulfillment_stage,
    'handoff_customer_actions', r.handoff_customer_actions,
    'renewals', COALESCE((SELECT jsonb_agg(jsonb_build_object('vendor', p.vendor, 'kind', p.kind, 'commitment', p.commitment, 'renews_on', p.renews_on) ORDER BY p.purchased_on)
       FROM public.email_setup_purchases p WHERE p.request_id = r.id AND p.kind IN ('domain','email_hosting')), '[]'::jsonb),
    'management_plan', r.management_plan, 'management_status', r.management_status,
    'customer_action_message', CASE WHEN r.service_status = 'awaiting_customer' THEN r.customer_action_message END,
    'completed_at', r.completed_at, 'created_at', r.created_at,
    'payments', COALESCE((SELECT jsonb_agg(jsonb_build_object('kind', p.kind, 'amount_cents', p.amount_cents, 'at', p.created_at) ORDER BY p.created_at)
       FROM public.email_setup_payments p WHERE p.request_id = r.id), '[]'::jsonb),
    'change_sets', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'status', c.status, 'customer_reason', c.customer_reason, 'package_from', c.package_from, 'package_to', c.package_to,
        'total_before_cents', c.total_before_cents, 'total_after_cents', c.total_after_cents, 'paid_before_cents', c.paid_before_cents,
        'amount_due_cents', c.amount_due_cents, 'credit_cents', c.credit_cents, 'third_party_delta_cents', c.third_party_delta_cents, 'created_at', c.created_at,
        'lines', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', a.label, 'quantity', a.quantity, 'unit_cents', a.unit_cents, 'amount_cents', a.amount_cents, 'note', a.customer_note) ORDER BY a.created_at)
           FROM public.email_setup_adjustments a WHERE a.change_set_id = c.id), '[]'::jsonb)) ORDER BY c.created_at DESC)
       FROM public.email_setup_change_sets c WHERE c.request_id = r.id AND c.status <> 'canceled'), '[]'::jsonb),
    'updates', COALESCE((SELECT jsonb_agg(jsonb_build_object('kind', e.kind, 'detail', e.detail, 'at', e.created_at) ORDER BY e.created_at DESC)
       FROM public.email_setup_events e WHERE e.request_id = r.id AND e.visible_to_customer), '[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.email_setup_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_setup_status(text) TO anon, authenticated;