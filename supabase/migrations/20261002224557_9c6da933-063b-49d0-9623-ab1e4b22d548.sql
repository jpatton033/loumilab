CREATE TABLE public.zip_centroids (zip text PRIMARY KEY, lat double precision NOT NULL, lng double precision NOT NULL);
GRANT SELECT ON public.zip_centroids TO anon, authenticated;
GRANT ALL ON public.zip_centroids TO service_role;
ALTER TABLE public.zip_centroids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read zip centroids" ON public.zip_centroids FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.merchant_local_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  is_listed boolean NOT NULL DEFAULT false,
  category text,
  cuisines text[] NOT NULL DEFAULT '{}',
  tagline text CHECK (tagline IS NULL OR char_length(tagline) <= 160),
  service_area_label text CHECK (service_area_label IS NULL OR char_length(service_area_label) <= 80),
  featured_image_url text,
  postal_code text CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{5}$'),
  is_featured boolean NOT NULL DEFAULT false,
  featured_rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_local_profiles TO authenticated;
GRANT ALL ON public.merchant_local_profiles TO service_role;
ALTER TABLE public.merchant_local_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own local profile" ON public.merchant_local_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));
CREATE POLICY "Staff manage local profiles" ON public.merchant_local_profiles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_local_featured() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_staff(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN NEW.is_featured := false; NEW.featured_rank := 0;
    ELSE NEW.is_featured := OLD.is_featured; NEW.featured_rank := OLD.featured_rank; END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER merchant_local_profiles_guard BEFORE INSERT OR UPDATE ON public.merchant_local_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_local_featured();

CREATE OR REPLACE FUNCTION public.search_local_businesses(
  _q text DEFAULT NULL, _place text DEFAULT NULL, _radius_miles integer DEFAULT 25,
  _category text DEFAULT NULL, _pickup boolean DEFAULT false, _delivery boolean DEFAULT false,
  _accepting boolean DEFAULT false, _featured_only boolean DEFAULT false, _limit integer DEFAULT 48)
RETURNS TABLE (slug text, name text, logo_url text, image_url text, description text, category text,
  cuisines text[], area text, pickup boolean, delivery boolean, accepting boolean, is_featured boolean, distance_miles double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH origin AS (
    SELECT z.lat, z.lng FROM public.zip_centroids z WHERE z.zip = substring(coalesce(_place,'') from '^\s*([0-9]{5})')
  ), base AS (
    SELECT s.slug, s.name, s.logo_url,
      coalesce(p.featured_image_url, s.hero_image_url) AS image_url,
      coalesce(nullif(p.tagline,''), s.description) AS description,
      p.category, p.cuisines,
      coalesce(nullif(p.service_area_label,''), nullif(concat_ws(', ', m.city, m.region),''), s.location) AS area,
      s.pickup_enabled AS pickup, s.delivery_enabled AS delivery,
      (m.accepting_orders AND s.status = 'published') AS accepting,
      p.is_featured, p.featured_rank, p.created_at,
      m.city, s.location,
      zc.lat, zc.lng
    FROM public.merchant_local_profiles p
    JOIN public.merchants m ON m.id = p.merchant_id
    JOIN public.merchant_storefronts s ON s.merchant_id = m.id
    LEFT JOIN public.zip_centroids zc ON zc.zip = coalesce(p.postal_code, m.postal_code)
    WHERE p.is_listed AND s.is_published
  )
  SELECT b.slug, b.name, b.logo_url, b.image_url, left(b.description, 220), b.category, b.cuisines, b.area,
    b.pickup, b.delivery, b.accepting, b.is_featured,
    CASE WHEN o.lat IS NOT NULL AND b.lat IS NOT NULL THEN
      3958.8 * 2 * asin(sqrt(power(sin(radians(b.lat - o.lat)/2),2) + cos(radians(o.lat))*cos(radians(b.lat))*power(sin(radians(b.lng - o.lng)/2),2)))
    END AS distance_miles
  FROM base b LEFT JOIN origin o ON true
  WHERE (_q IS NULL OR _q = '' OR b.name ILIKE '%'||_q||'%' OR b.description ILIKE '%'||_q||'%'
         OR b.category ILIKE '%'||_q||'%' OR array_to_string(b.cuisines,' ') ILIKE '%'||_q||'%'
         OR EXISTS (SELECT 1 FROM public.merchant_products pr JOIN public.merchant_storefronts s2 ON s2.id = pr.storefront_id
                    WHERE s2.slug = b.slug AND pr.name ILIKE '%'||_q||'%'))
    AND (_category IS NULL OR _category = '' OR b.category = _category)
    AND (NOT _pickup OR b.pickup) AND (NOT _delivery OR b.delivery) AND (NOT _accepting OR b.accepting)
    AND (NOT _featured_only OR b.is_featured)
    AND (_place IS NULL OR btrim(_place) = '' OR
         CASE WHEN o.lat IS NOT NULL THEN b.lat IS NOT NULL AND
           3958.8 * 2 * asin(sqrt(power(sin(radians(b.lat - o.lat)/2),2) + cos(radians(o.lat))*cos(radians(b.lat))*power(sin(radians(b.lng - o.lng)/2),2))) <= greatest(1, least(coalesce(_radius_miles,25), 100))
         ELSE (b.city ILIKE '%'||btrim(_place)||'%' OR b.location ILIKE '%'||btrim(_place)||'%' OR b.area ILIKE '%'||btrim(_place)||'%') END)
  ORDER BY CASE WHEN _featured_only THEN b.featured_rank END, b.accepting DESC, 13 ASC NULLS LAST, b.created_at DESC
  LIMIT least(greatest(coalesce(_limit,48),1),60);
$$;
REVOKE ALL ON FUNCTION public.search_local_businesses(text,text,integer,text,boolean,boolean,boolean,boolean,integer) FROM public;
GRANT EXECUTE ON FUNCTION public.search_local_businesses(text,text,integer,text,boolean,boolean,boolean,boolean,integer) TO anon, authenticated;