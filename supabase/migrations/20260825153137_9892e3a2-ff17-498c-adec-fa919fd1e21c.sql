-- ============ merchant subscriptions ============
CREATE TABLE public.merchant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  plan_slug text NOT NULL,
  interval text NOT NULL DEFAULT 'month',
  status text NOT NULL DEFAULT 'incomplete',
  platform_fee_bps integer,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  livemode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX merchant_subscriptions_merchant_key ON public.merchant_subscriptions(merchant_id);
CREATE INDEX merchant_subscriptions_stripe_idx ON public.merchant_subscriptions(stripe_subscription_id);

GRANT SELECT ON public.merchant_subscriptions TO authenticated;
GRANT ALL ON public.merchant_subscriptions TO service_role;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view their subscription"
  ON public.merchant_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE POLICY "Staff view all subscriptions"
  ON public.merchant_subscriptions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_merchant_subscriptions_updated_at
  BEFORE UPDATE ON public.merchant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ public quote lookup ============
CREATE OR REPLACE FUNCTION public.get_quote_by_token(_token uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', q.id,
    'public_token', q.public_token,
    'status', q.status,
    'title', q.title,
    'message', q.message,
    'line_items', q.line_items,
    'subtotal_cents', q.subtotal_cents,
    'deposit_cents', q.deposit_cents,
    'expires_at', q.expires_at,
    'sent_at', q.sent_at,
    'approved_at', q.approved_at,
    'created_at', q.created_at,
    'business_name', m.business_name,
    'business_email', m.contact_email,
    'job_title', j.title,
    'customer_name', j.customer_name
  )
  FROM public.merchant_quotes q
  JOIN public.merchants m ON m.id = q.merchant_id
  LEFT JOIN public.merchant_jobs j ON j.id = q.job_id
  WHERE q.public_token = _token;
$$;

REVOKE EXECUTE ON FUNCTION public.get_quote_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quote_by_token(uuid) TO anon, authenticated, service_role;

-- ============ public invoice lookup ============
CREATE OR REPLACE FUNCTION public.get_invoice_by_token(_token uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', i.id,
    'public_token', i.public_token,
    'kind', i.kind,
    'status', i.status,
    'amount_cents', i.amount_cents,
    'due_at', i.due_at,
    'paid_at', i.paid_at,
    'created_at', i.created_at,
    'business_name', m.business_name,
    'business_email', m.contact_email,
    'job_title', j.title,
    'customer_name', j.customer_name,
    'customer_email', j.customer_email
  )
  FROM public.merchant_invoices i
  JOIN public.merchants m ON m.id = i.merchant_id
  LEFT JOIN public.merchant_jobs j ON j.id = i.job_id
  WHERE i.public_token = _token;
$$;

REVOKE EXECUTE ON FUNCTION public.get_invoice_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invoice_by_token(uuid) TO anon, authenticated, service_role;

-- ============ customer responds to a quote ============
CREATE OR REPLACE FUNCTION public.respond_to_quote(_token uuid, _approve boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.merchant_quotes;
  invoice_token uuid;
  amount int;
  invoice_kind text;
BEGIN
  IF public.check_and_increment_rate_limit('quote_respond:' || _token::text, 20, 3600) THEN
    RAISE EXCEPTION 'Too many attempts. Please try again later.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO q FROM public.merchant_quotes WHERE public_token = _token;
  IF q.id IS NULL THEN
    RAISE EXCEPTION 'This estimate could not be found.' USING ERRCODE = '22023';
  END IF;

  IF q.status NOT IN ('sent', 'draft') THEN
    RAISE EXCEPTION 'This estimate has already been answered.' USING ERRCODE = '22023';
  END IF;

  IF q.expires_at IS NOT NULL AND q.expires_at < now() THEN
    UPDATE public.merchant_quotes SET status = 'expired' WHERE id = q.id;
    RAISE EXCEPTION 'This estimate has expired. Please ask for a new one.' USING ERRCODE = '22023';
  END IF;

  IF NOT _approve THEN
    UPDATE public.merchant_quotes
      SET status = 'declined', declined_at = now()
      WHERE id = q.id;
    RETURN jsonb_build_object('status', 'declined');
  END IF;

  UPDATE public.merchant_quotes
    SET status = 'approved', approved_at = now()
    WHERE id = q.id;

  IF q.job_id IS NOT NULL THEN
    UPDATE public.merchant_jobs
      SET status = CASE WHEN q.deposit_cents > 0 THEN 'deposit'::job_status ELSE 'approved'::job_status END,
          total_cents = q.subtotal_cents
      WHERE id = q.job_id;
  END IF;

  IF q.deposit_cents > 0 THEN
    amount := q.deposit_cents;
    invoice_kind := 'deposit';
  ELSE
    amount := q.subtotal_cents;
    invoice_kind := 'balance';
  END IF;

  INSERT INTO public.merchant_invoices (merchant_id, job_id, quote_id, kind, status, amount_cents)
  VALUES (q.merchant_id, q.job_id, q.id, invoice_kind, 'sent', amount)
  RETURNING public_token INTO invoice_token;

  RETURN jsonb_build_object('status', 'approved', 'invoice_token', invoice_token, 'amount_cents', amount);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_to_quote(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_quote(uuid, boolean) TO anon, authenticated, service_role;