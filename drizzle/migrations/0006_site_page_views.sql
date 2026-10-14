CREATE TABLE public.site_page_views (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  path text NOT NULL,
  referrer_source text NOT NULL DEFAULT 'direct',
  session_id text NOT NULL,
  device text NOT NULL DEFAULT 'desktop'
);
GRANT SELECT ON public.site_page_views TO authenticated;
GRANT ALL ON public.site_page_views TO service_role;
ALTER TABLE public.site_page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read page views" ON public.site_page_views FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX site_page_views_created_idx ON public.site_page_views (created_at);

CREATE OR REPLACE FUNCTION public.record_page_view(_path text, _referrer text, _session text, _device text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _path IS NULL OR _path !~ '^/' OR _path ~ '^/(admin|login)' OR length(_path) > 200 THEN RETURN; END IF;
  IF _session IS NULL OR length(_session) < 8 OR length(_session) > 64 THEN RETURN; END IF;
  IF NOT public.check_and_increment_rate_limit('pv:' || _session, 300, 3600) THEN RETURN; END IF;
  INSERT INTO public.site_page_views(path, referrer_source, session_id, device)
  VALUES (_path, left(coalesce(nullif(_referrer,''),'direct'),40), _session,
          CASE WHEN _device = 'mobile' THEN 'mobile' ELSE 'desktop' END);
END $$;
REVOKE ALL ON FUNCTION public.record_page_view(text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_page_view(text,text,text,text) TO anon, authenticated;