CREATE TABLE public.domain_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  op text NOT NULL,
  ok boolean NOT NULL,
  http_status int,
  error text,
  surface text,
  result_count int
);
GRANT SELECT ON public.domain_provider_events TO authenticated;
GRANT ALL ON public.domain_provider_events TO service_role;
ALTER TABLE public.domain_provider_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read domain events" ON public.domain_provider_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX ON public.domain_provider_events (created_at DESC);

CREATE TABLE public.domain_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  searches_per_hour int NOT NULL DEFAULT 20,
  checks_per_hour int NOT NULL DEFAULT 40,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.domain_settings TO authenticated;
GRANT ALL ON public.domain_settings TO service_role;
ALTER TABLE public.domain_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read domain settings" ON public.domain_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff update domain settings" ON public.domain_settings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()) AND searches_per_hour BETWEEN 1 AND 500 AND checks_per_hour BETWEEN 1 AND 500);
INSERT INTO public.domain_settings (id) VALUES (1);

CREATE TABLE public.spaces_custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.spaces_apps(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE CHECK (hostname ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$' AND hostname NOT LIKE '%loumilab.com'),
  verification_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  status text NOT NULL DEFAULT 'pending_dns' CHECK (status IN ('pending_dns','verified','active','failed')),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.spaces_custom_domains TO authenticated;
GRANT ALL ON public.spaces_custom_domains TO service_role;
ALTER TABLE public.spaces_custom_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "viewers read custom domains" ON public.spaces_custom_domains FOR SELECT TO authenticated USING (public.spaces_can_view_app(app_id, auth.uid()) OR public.is_staff(auth.uid()));
CREATE POLICY "managers add custom domains" ON public.spaces_custom_domains FOR INSERT TO authenticated WITH CHECK (public.spaces_can_manage_app(app_id, auth.uid()) AND created_by = auth.uid() AND status = 'pending_dns');
CREATE POLICY "managers remove custom domains" ON public.spaces_custom_domains FOR DELETE TO authenticated USING (public.spaces_can_manage_app(app_id, auth.uid()));