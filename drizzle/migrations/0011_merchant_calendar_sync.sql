CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.merchant_calendar_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google','microsoft')),
  calendar_id text,
  calendar_name text,
  account_email text,
  reconnect_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.merchant_calendar_links TO authenticated;
GRANT ALL ON public.merchant_calendar_links TO service_role;
ALTER TABLE public.merchant_calendar_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant reads own calendar link" ON public.merchant_calendar_links
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE TABLE public.merchant_job_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.merchant_jobs(id) ON DELETE CASCADE,
  provider text NOT NULL,
  external_event_id text,
  sync_status text NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','failed','removed')),
  last_error text,
  attempts integer NOT NULL DEFAULT 0,
  synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, provider)
);
GRANT SELECT ON public.merchant_job_calendar_events TO authenticated;
GRANT ALL ON public.merchant_job_calendar_events TO service_role;
ALTER TABLE public.merchant_job_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant reads own job calendar events" ON public.merchant_job_calendar_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

UPDATE public.orders_plans
  SET entitlements = COALESCE(entitlements, '{}'::jsonb) || '{"calendar.sync": true}'::jsonb
  WHERE slug IN ('starter','business');