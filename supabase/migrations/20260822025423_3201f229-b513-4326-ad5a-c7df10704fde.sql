DO $$ BEGIN
  CREATE TYPE public.kc_article_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.kc_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kc_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kc_sections TO authenticated;
GRANT ALL ON public.kc_sections TO service_role;
ALTER TABLE public.kc_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view visible sections" ON public.kc_sections FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admins can view all sections" ON public.kc_sections FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert sections" ON public.kc_sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update sections" ON public.kc_sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete sections" ON public.kc_sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_kc_sections_updated_at BEFORE UPDATE ON public.kc_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.kc_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kc_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kc_tags TO authenticated;
GRANT ALL ON public.kc_tags TO service_role;
ALTER TABLE public.kc_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view tags" ON public.kc_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert tags" ON public.kc_tags FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update tags" ON public.kc_tags FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete tags" ON public.kc_tags FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.kc_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.kc_sections(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  body text NOT NULL DEFAULT '',
  hero_image_url text,
  author text,
  read_minutes integer NOT NULL DEFAULT 3,
  seo_title text,
  seo_description text,
  is_featured boolean NOT NULL DEFAULT false,
  status public.kc_article_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  document_url text,
  related_link_label text,
  related_link_href text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kc_articles_section_idx ON public.kc_articles (section_id);
CREATE INDEX kc_articles_status_idx ON public.kc_articles (status, published_at DESC);
GRANT SELECT ON public.kc_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kc_articles TO authenticated;
GRANT ALL ON public.kc_articles TO service_role;
ALTER TABLE public.kc_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published articles" ON public.kc_articles FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins can view all articles" ON public.kc_articles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert articles" ON public.kc_articles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update articles" ON public.kc_articles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete articles" ON public.kc_articles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_kc_articles_updated_at BEFORE UPDATE ON public.kc_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.kc_article_tags (
  article_id uuid NOT NULL REFERENCES public.kc_articles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.kc_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
GRANT SELECT ON public.kc_article_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kc_article_tags TO authenticated;
GRANT ALL ON public.kc_article_tags TO service_role;
ALTER TABLE public.kc_article_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view tags of published articles" ON public.kc_article_tags FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.kc_articles a WHERE a.id = article_id AND a.status = 'published'));
CREATE POLICY "Admins can view all article tags" ON public.kc_article_tags FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert article tags" ON public.kc_article_tags FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete article tags" ON public.kc_article_tags FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.kc_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.kc_articles(id) ON DELETE CASCADE,
  label text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kc_attachments_article_idx ON public.kc_attachments (article_id);
GRANT SELECT ON public.kc_attachments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kc_attachments TO authenticated;
GRANT ALL ON public.kc_attachments TO service_role;
ALTER TABLE public.kc_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view attachments of published articles" ON public.kc_attachments FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.kc_articles a WHERE a.id = article_id AND a.status = 'published'));
CREATE POLICY "Admins can view all attachments" ON public.kc_attachments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert attachments" ON public.kc_attachments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update attachments" ON public.kc_attachments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete attachments" ON public.kc_attachments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.kc_article_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.kc_articles(id) ON DELETE CASCADE,
  viewer_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kc_article_views_article_idx ON public.kc_article_views (article_id, created_at DESC);
GRANT ALL ON public.kc_article_views TO service_role;
GRANT SELECT ON public.kc_article_views TO authenticated;
ALTER TABLE public.kc_article_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view article views" ON public.kc_article_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.newsletter_subscribers TO service_role;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.kc_increment_view(_slug text, _viewer_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _article_id uuid;
BEGIN
  SELECT id INTO _article_id FROM public.kc_articles WHERE slug = _slug AND status = 'published';
  IF _article_id IS NULL THEN
    RETURN;
  END IF;

  IF _viewer_hash IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.kc_article_views
    WHERE article_id = _article_id
      AND viewer_hash = _viewer_hash
      AND created_at > now() - interval '6 hours'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.kc_article_views (article_id, viewer_hash)
  VALUES (_article_id, left(coalesce(_viewer_hash,''), 64));

  UPDATE public.kc_articles SET view_count = view_count + 1 WHERE id = _article_id;
END;
$$;
REVOKE ALL ON FUNCTION public.kc_increment_view(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kc_increment_view(text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.newsletter_subscribe(_email text, _source text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email text;
  throttled boolean;
BEGIN
  clean_email := lower(btrim(coalesce(_email, '')));

  IF clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(clean_email) > 255 THEN
    RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
  END IF;

  throttled := public.check_and_increment_rate_limit('newsletter:global', 60, 3600);
  IF throttled THEN
    RAISE EXCEPTION 'Too many signups right now. Please try again later.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.newsletter_subscribers (email, source)
  VALUES (clean_email, left(coalesce(_source, 'resources'), 64))
  ON CONFLICT (email) DO NOTHING;

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.newsletter_subscribe(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.newsletter_subscribe(text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.kc_section_counts()
RETURNS TABLE (section_slug text, published_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.slug, count(a.id)
  FROM public.kc_sections s
  LEFT JOIN public.kc_articles a ON a.section_id = s.id AND a.status = 'published'
  WHERE s.is_visible = true
  GROUP BY s.slug;
$$;
REVOKE ALL ON FUNCTION public.kc_section_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kc_section_counts() TO anon, authenticated, service_role;

CREATE POLICY "Public can read kc media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'kc-media');
CREATE POLICY "Admins can upload kc media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kc-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update kc media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'kc-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete kc media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'kc-media' AND public.has_role(auth.uid(),'admin'));