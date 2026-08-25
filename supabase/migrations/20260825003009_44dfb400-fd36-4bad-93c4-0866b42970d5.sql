-- =========================================
-- Daily Operations Brief infrastructure
-- =========================================

CREATE TYPE public.ops_delivery_status AS ENUM ('generated', 'queued', 'sent', 'failed', 'retrying');
CREATE TYPE public.ops_alert_severity AS ENUM ('critical', 'important', 'review', 'normal');

-- ---------- settings (single row) ----------
CREATE TABLE public.ops_brief_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  delivery_hour integer NOT NULL DEFAULT 8,
  delivery_minute integer NOT NULL DEFAULT 0,
  timezone text NOT NULL DEFAULT 'America/New_York',
  recipients text[] NOT NULL DEFAULT ARRAY['hello@loumilab.com']::text[],
  reporting_window text NOT NULL DEFAULT 'previous_24h',
  custom_window_hours integer NOT NULL DEFAULT 24,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  thresholds jsonb NOT NULL DEFAULT '{}'::jsonb,
  immediate_alerts jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_brief_settings_singleton UNIQUE (singleton),
  CONSTRAINT ops_brief_settings_hour CHECK (delivery_hour BETWEEN 0 AND 23),
  CONSTRAINT ops_brief_settings_minute CHECK (delivery_minute BETWEEN 0 AND 59),
  CONSTRAINT ops_brief_settings_window CHECK (reporting_window IN ('previous_24h', 'previous_calendar_day', 'custom')),
  CONSTRAINT ops_brief_settings_custom_hours CHECK (custom_window_hours BETWEEN 1 AND 720)
);

GRANT SELECT, INSERT, UPDATE ON public.ops_brief_settings TO authenticated;
GRANT ALL ON public.ops_brief_settings TO service_role;
ALTER TABLE public.ops_brief_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read brief settings" ON public.ops_brief_settings
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can create brief settings" ON public.ops_brief_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update brief settings" ON public.ops_brief_settings
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER update_ops_brief_settings_updated_at
  BEFORE UPDATE ON public.ops_brief_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- reports ----------
CREATE TABLE public.ops_brief_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  window_label text NOT NULL DEFAULT 'previous_24h',
  subject text NOT NULL,
  summary text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  html text,
  critical_count integer NOT NULL DEFAULT 0,
  important_count integer NOT NULL DEFAULT 0,
  action_count integer NOT NULL DEFAULT 0,
  recipients text[] NOT NULL DEFAULT ARRAY[]::text[],
  generated_by text NOT NULL DEFAULT 'schedule',
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ops_brief_reports_scheduled_day
  ON public.ops_brief_reports (report_date)
  WHERE generated_by = 'schedule' AND is_test = false;
CREATE INDEX ops_brief_reports_created_idx ON public.ops_brief_reports (created_at DESC);

GRANT SELECT ON public.ops_brief_reports TO authenticated;
GRANT ALL ON public.ops_brief_reports TO service_role;
ALTER TABLE public.ops_brief_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read brief reports" ON public.ops_brief_reports
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ---------- deliveries ----------
CREATE TABLE public.ops_brief_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.ops_brief_reports(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  status public.ops_delivery_status NOT NULL DEFAULT 'generated',
  attempts integer NOT NULL DEFAULT 0,
  error text,
  queued_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_brief_deliveries_unique UNIQUE (report_id, recipient)
);

CREATE INDEX ops_brief_deliveries_status_idx ON public.ops_brief_deliveries (status, created_at DESC);

GRANT SELECT ON public.ops_brief_deliveries TO authenticated;
GRANT ALL ON public.ops_brief_deliveries TO service_role;
ALTER TABLE public.ops_brief_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read brief deliveries" ON public.ops_brief_deliveries
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_ops_brief_deliveries_updated_at
  BEFORE UPDATE ON public.ops_brief_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- immediate alerts ----------
CREATE TABLE public.ops_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  severity public.ops_alert_severity NOT NULL DEFAULT 'important',
  title text NOT NULL,
  detail text,
  affected_system text,
  recommended_action text,
  link_path text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ops_alerts_detected_idx ON public.ops_alerts (detected_at DESC);
CREATE INDEX ops_alerts_open_idx ON public.ops_alerts (category, detected_at DESC) WHERE resolved_at IS NULL;

GRANT SELECT, UPDATE ON public.ops_alerts TO authenticated;
GRANT ALL ON public.ops_alerts TO service_role;
ALTER TABLE public.ops_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read alerts" ON public.ops_alerts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can resolve alerts" ON public.ops_alerts
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER update_ops_alerts_updated_at
  BEFORE UPDATE ON public.ops_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- job runs (single-flight lease + health signal) ----------
CREATE TABLE public.ops_job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  lease_until timestamptz,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_job_runs_status CHECK (status IN ('running', 'success', 'failed', 'skipped'))
);

CREATE INDEX ops_job_runs_job_idx ON public.ops_job_runs (job, started_at DESC);

GRANT SELECT ON public.ops_job_runs TO authenticated;
GRANT ALL ON public.ops_job_runs TO service_role;
ALTER TABLE public.ops_job_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read job runs" ON public.ops_job_runs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ---------- single-flight lease helper ----------
CREATE OR REPLACE FUNCTION public.ops_acquire_job_lease(_job text, _lease_seconds integer DEFAULT 600)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- A run still holding a valid lease blocks a second concurrent run.
  IF EXISTS (
    SELECT 1 FROM public.ops_job_runs
    WHERE job = _job AND status = 'running' AND lease_until > now()
  ) THEN
    RETURN NULL;
  END IF;

  -- Expire abandoned runs so a crashed invocation cannot block forever.
  UPDATE public.ops_job_runs
    SET status = 'failed', finished_at = now(), error = coalesce(error, 'Lease expired')
    WHERE job = _job AND status = 'running' AND lease_until <= now();

  INSERT INTO public.ops_job_runs (job, status, lease_until)
  VALUES (_job, 'running', now() + (_lease_seconds || ' seconds')::interval)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ops_acquire_job_lease(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ops_acquire_job_lease(text, integer) TO service_role;

-- ---------- seed the settings row ----------
INSERT INTO public.ops_brief_settings (enabled, sections, modules, thresholds, immediate_alerts)
VALUES (
  true,
  '{"executive":true,"actions":true,"changes":true,"orders":true,"merchants":true,"revenue":true,"payments":true,"payouts":true,"refunds":true,"disputes":true,"subscriptions":true,"leads":true,"knowledge":true,"website":true,"seo":true,"security":true,"system":true,"development":true,"admin":true,"audit":true,"watch":true}'::jsonb,
  '{"website":true,"consulting":true,"knowledge":true,"orders":true}'::jsonb,
  '{"payment_failure_rate_pct":5,"refund_rate_pct":8,"dispute_count":1,"traffic_decline_pct":40,"order_decline_pct":40,"revenue_decline_pct":40,"payout_failures":0,"webhook_failures":0,"lead_uncontacted_hours":48,"inquiry_unread_hours":48}'::jsonb,
  '{"website_outage":true,"stripe_outage":true,"payment_failures":true,"security_incident":true,"database_failure":true,"payout_failures":true,"webhook_failures":true}'::jsonb
);