CREATE SEQUENCE IF NOT EXISTS public.email_setup_request_seq START 1001;

CREATE TABLE public.email_setup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE DEFAULT ('ES-' || nextval('public.email_setup_request_seq')::text),
  access_token_hash text NOT NULL UNIQUE,
  package text NOT NULL CHECK (package IN ('email','email_domain')),
  full_name text NOT NULL,
  business_name text NOT NULL,
  contact_email text NOT NULL,
  phone text,
  provider text NOT NULL,
  primary_address text,
  mailboxes integer NOT NULL DEFAULT 1,
  extra_devices integer NOT NULL DEFAULT 0,
  standalone_domain boolean NOT NULL DEFAULT false,
  intake jsonb NOT NULL DEFAULT '{}'::jsonb,
  needs_review boolean NOT NULL DEFAULT false,
  review_reasons text[] NOT NULL DEFAULT '{}',
  price_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents integer NOT NULL DEFAULT 0,
  quote_cents integer,
  quote_note text,
  service_status text NOT NULL DEFAULT 'new_request' CHECK (service_status IN ('new_request','awaiting_quote','awaiting_payment','paid_awaiting_setup','in_progress','awaiting_customer','testing','completed','canceled')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending','paid','failed','expired','refunded','not_required')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  paid_cents integer,
  paid_at timestamptz,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_action_message text,
  completed_at timestamptz,
  completion_record jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.email_setup_requests TO authenticated;
GRANT ALL ON public.email_setup_requests TO service_role;
GRANT USAGE ON SEQUENCE public.email_setup_request_seq TO service_role;
ALTER TABLE public.email_setup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read email setup requests" ON public.email_setup_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update checklist" ON public.email_setup_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER email_setup_requests_updated BEFORE UPDATE ON public.email_setup_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_setup_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.email_setup_requests(id) ON DELETE CASCADE,
  author_id uuid,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.email_setup_notes TO authenticated;
GRANT ALL ON public.email_setup_notes TO service_role;
ALTER TABLE public.email_setup_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read notes" ON public.email_setup_notes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add notes" ON public.email_setup_notes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND author_id = auth.uid());

CREATE TABLE public.email_setup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.email_setup_requests(id) ON DELETE CASCADE,
  kind text NOT NULL,
  detail text,
  visible_to_customer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_setup_events TO authenticated;
GRANT ALL ON public.email_setup_events TO service_role;
ALTER TABLE public.email_setup_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read events" ON public.email_setup_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.email_setup_notifications (
  request_id uuid NOT NULL REFERENCES public.email_setup_requests(id) ON DELETE CASCADE,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, kind)
);
GRANT ALL ON public.email_setup_notifications TO service_role;
ALTER TABLE public.email_setup_notifications ENABLE ROW LEVEL SECURITY;

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
    'customer_action_message', CASE WHEN r.service_status = 'awaiting_customer' THEN r.customer_action_message END,
    'completed_at', r.completed_at, 'created_at', r.created_at,
    'updates', COALESCE((SELECT jsonb_agg(jsonb_build_object('kind', e.kind, 'detail', e.detail, 'at', e.created_at) ORDER BY e.created_at DESC)
       FROM public.email_setup_events e WHERE e.request_id = r.id AND e.visible_to_customer), '[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.email_setup_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_setup_status(text) TO anon, authenticated;