CREATE OR REPLACE FUNCTION public.record_page_view(_path text, _referrer text, _session text, _device text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _path IS NULL OR _path !~ '^/' OR _path ~ '^/(admin|login)' OR length(_path) > 200 THEN RETURN; END IF;
  IF _session IS NULL OR length(_session) < 8 OR length(_session) > 64 THEN RETURN; END IF;
  IF public.check_and_increment_rate_limit('pv:' || _session, 300, 3600) THEN RETURN; END IF;
  INSERT INTO public.site_page_views(path, referrer_source, session_id, device)
  VALUES (_path, left(coalesce(nullif(_referrer,''),'direct'),40), _session,
          CASE WHEN _device = 'mobile' THEN 'mobile' ELSE 'desktop' END);
END $$;