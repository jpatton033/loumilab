DROP FUNCTION IF EXISTS public.kc_section_counts();

CREATE FUNCTION public.kc_section_counts()
RETURNS TABLE(slug text, count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.slug, count(a.id)
  FROM public.kc_sections s
  LEFT JOIN public.kc_articles a ON a.section_id = s.id AND a.status = 'published'
  WHERE s.is_visible = true
  GROUP BY s.slug;
$$;

CREATE OR REPLACE FUNCTION public.kc_increment_view(_slug text, _viewer_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _article_id uuid;
  _clean_slug text;
  _clean_hash text;
BEGIN
  _clean_slug := btrim(coalesce(_slug, ''));
  IF _clean_slug = '' OR length(_clean_slug) > 200 OR _clean_slug !~ '^[a-z0-9-]+$' THEN
    RETURN;
  END IF;

  _clean_hash := left(regexp_replace(coalesce(_viewer_hash, ''), '[^a-zA-Z0-9]', '', 'g'), 64);

  IF public.check_and_increment_rate_limit('kc_view:' || _clean_slug, 500, 3600) THEN
    RETURN;
  END IF;

  SELECT id INTO _article_id FROM public.kc_articles WHERE slug = _clean_slug AND status = 'published';
  IF _article_id IS NULL THEN
    RETURN;
  END IF;

  IF _clean_hash <> '' AND EXISTS (
    SELECT 1 FROM public.kc_article_views
    WHERE article_id = _article_id
      AND viewer_hash = _clean_hash
      AND created_at > now() - interval '6 hours'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.kc_article_views (article_id, viewer_hash)
  VALUES (_article_id, _clean_hash);

  UPDATE public.kc_articles SET view_count = view_count + 1 WHERE id = _article_id;
END;
$$;

REVOKE ALL ON FUNCTION public.kc_section_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kc_increment_view(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.newsletter_subscribe(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.kc_section_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kc_increment_view(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.newsletter_subscribe(text, text) TO anon, authenticated;