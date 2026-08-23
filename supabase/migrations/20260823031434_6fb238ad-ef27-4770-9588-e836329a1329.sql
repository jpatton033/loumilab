DROP FUNCTION IF EXISTS public.kc_section_counts();

CREATE FUNCTION public.kc_section_counts()
RETURNS TABLE(section_slug text, published_count bigint)
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

REVOKE ALL ON FUNCTION public.kc_section_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kc_section_counts() TO anon, authenticated;