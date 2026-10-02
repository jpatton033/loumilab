ALTER TABLE public.merchant_local_profiles
  ADD COLUMN slug text UNIQUE,
  ADD COLUMN display_name text CHECK (display_name IS NULL OR char_length(display_name) <= 80),
  ADD COLUMN logo_url text,
  ADD COLUMN gallery_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN offers_pickup boolean,
  ADD COLUMN offers_delivery boolean,
  ADD COLUMN website_url text,
  ADD COLUMN social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN public_phone text CHECK (public_phone IS NULL OR char_length(public_phone) <= 30),
  ADD COLUMN public_email text CHECK (public_email IS NULL OR char_length(public_email) <= 160),
  ADD COLUMN city text CHECK (city IS NULL OR char_length(city) <= 80),
  ADD COLUMN region text CHECK (region IS NULL OR char_length(region) <= 40);

CREATE OR REPLACE FUNCTION public.local_profile_defaults() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text; cand text; n int := 0; k text;
BEGIN
  IF coalesce(array_length(NEW.gallery_urls,1),0) > 6 THEN NEW.gallery_urls := NEW.gallery_urls[1:6]; END IF;
  IF NEW.website_url IS NOT NULL AND NEW.website_url !~* '^https?://' THEN RAISE EXCEPTION 'Website must start with http:// or https://'; END IF;
  FOR k IN SELECT jsonb_object_keys(NEW.social_links) LOOP
    IF k NOT IN ('instagram','facebook','tiktok','x') OR (NEW.social_links->>k) !~* '^https?://' THEN
      RAISE EXCEPTION 'Invalid social link'; END IF;
  END LOOP;
  IF NEW.public_email IS NOT NULL AND NEW.public_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Invalid email'; END IF;
  IF NEW.slug IS NULL THEN
    SELECT coalesce(nullif(NEW.display_name,''), m.business_name) INTO base FROM public.merchants m WHERE m.id = NEW.merchant_id;
    base := trim(both '-' from regexp_replace(lower(coalesce(base,'business')), '[^a-z0-9]+', '-', 'g'));
    IF base = '' THEN base := 'business'; END IF;
    cand := left(base, 60);
    WHILE EXISTS (SELECT 1 FROM public.merchant_local_profiles WHERE slug = cand AND id <> NEW.id) LOOP
      n := n + 1; cand := left(base, 56) || '-' || n;
    END LOOP;
    NEW.slug := cand;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.local_profile_defaults() FROM public, anon, authenticated;
CREATE TRIGGER merchant_local_profiles_defaults BEFORE INSERT OR UPDATE ON public.merchant_local_profiles
  FOR EACH ROW EXECUTE FUNCTION public.local_profile_defaults();
UPDATE public.merchant_local_profiles SET slug = NULL WHERE slug IS NULL;

DROP FUNCTION public.search_local_businesses(text,text,integer,text,boolean,boolean,boolean,boolean,integer);
CREATE FUNCTION public.search_local_businesses(
  _q text DEFAULT NULL, _place text DEFAULT NULL, _radius_miles integer DEFAULT 25,
  _category text DEFAULT NULL, _pickup boolean DEFAULT false, _delivery boolean DEFAULT false,
  _accepting boolean DEFAULT false, _featured_only boolean DEFAULT false, _limit integer DEFAULT 48)
RETURNS TABLE (slug text, store_slug text, name text, logo_url text, image_url text, description text, category text,
  cuisines text[], area text, pickup boolean, delivery boolean, accepting boolean, is_featured boolean, distance_miles double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH origin AS (
    SELECT z.lat, z.lng FROM public.zip_centroids z WHERE z.zip = substring(coalesce(_place,'') from '^\s*([0-9]{5})')
  ), base AS (
    SELECT p.slug, CASE WHEN s.is_published THEN s.slug END AS store_slug,
      coalesce(nullif(p.display_name,''), s.name, m.business_name) AS name,
      coalesce(p.logo_url, s.logo_url) AS logo_url,
      coalesce(p.featured_image_url, p.gallery_urls[1], s.hero_image_url) AS image_url,
      coalesce(nullif(p.tagline,''), s.description) AS description,
      p.category, p.cuisines,
      coalesce(nullif(p.service_area_label,''), nullif(concat_ws(', ', coalesce(p.city, m.city), coalesce(p.region, m.region)),''), s.location) AS area,
      coalesce(p.offers_pickup, s.pickup_enabled, false) AS pickup,
      coalesce(p.offers_delivery, s.delivery_enabled, false) AS delivery,
      coalesce(m.accepting_orders AND s.status = 'published' AND s.is_published, false) AS accepting,
      p.is_featured, p.featured_rank, p.created_at,
      coalesce(p.city, m.city) AS city, s.location, s.id AS storefront_id,
      zc.lat, zc.lng
    FROM public.merchant_local_profiles p
    JOIN public.merchants m ON m.id = p.merchant_id
    LEFT JOIN public.merchant_storefronts s ON s.merchant_id = m.id
    LEFT JOIN public.zip_centroids zc ON zc.zip = coalesce(p.postal_code, m.postal_code)
    WHERE p.is_listed AND p.slug IS NOT NULL AND (s.id IS NULL OR s.is_published)
  )
  SELECT b.slug, b.store_slug, b.name, b.logo_url, b.image_url, left(b.description, 220), b.category, b.cuisines, b.area,
    b.pickup, b.delivery, b.accepting, b.is_featured,
    CASE WHEN o.lat IS NOT NULL AND b.lat IS NOT NULL THEN
      3958.8 * 2 * asin(sqrt(power(sin(radians(b.lat - o.lat)/2),2) + cos(radians(o.lat))*cos(radians(b.lat))*power(sin(radians(b.lng - o.lng)/2),2)))
    END AS distance_miles
  FROM base b LEFT JOIN origin o ON true
  WHERE (_q IS NULL OR _q = '' OR b.name ILIKE '%'||_q||'%' OR b.description ILIKE '%'||_q||'%'
         OR b.category ILIKE '%'||_q||'%' OR array_to_string(b.cuisines,' ') ILIKE '%'||_q||'%'
         OR EXISTS (SELECT 1 FROM public.merchant_products pr WHERE pr.storefront_id = b.storefront_id AND pr.name ILIKE '%'||_q||'%'))
    AND (_category IS NULL OR _category = '' OR b.category = _category)
    AND (NOT _pickup OR b.pickup) AND (NOT _delivery OR b.delivery) AND (NOT _accepting OR b.accepting)
    AND (NOT _featured_only OR b.is_featured)
    AND (_place IS NULL OR btrim(_place) = '' OR
         CASE WHEN o.lat IS NOT NULL THEN b.lat IS NOT NULL AND
           3958.8 * 2 * asin(sqrt(power(sin(radians(b.lat - o.lat)/2),2) + cos(radians(o.lat))*cos(radians(b.lat))*power(sin(radians(b.lng - o.lng)/2),2))) <= greatest(1, least(coalesce(_radius_miles,25), 100))
         ELSE (b.city ILIKE '%'||btrim(_place)||'%' OR b.location ILIKE '%'||btrim(_place)||'%' OR b.area ILIKE '%'||btrim(_place)||'%') END)
  ORDER BY CASE WHEN _featured_only THEN b.featured_rank END, b.accepting DESC, 14 ASC NULLS LAST, b.created_at DESC
  LIMIT least(greatest(coalesce(_limit,48),1),60);
$$;
REVOKE ALL ON FUNCTION public.search_local_businesses(text,text,integer,text,boolean,boolean,boolean,boolean,integer) FROM public;
GRANT EXECUTE ON FUNCTION public.search_local_businesses(text,text,integer,text,boolean,boolean,boolean,boolean,integer) TO anon, authenticated;

CREATE FUNCTION public.get_local_business(_slug text)
RETURNS TABLE (slug text, store_slug text, name text, logo_url text, image_url text, gallery_urls text[], description text,
  category text, cuisines text[], area text, pickup boolean, delivery boolean, accepting boolean,
  website_url text, social_links jsonb, public_phone text, public_email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.slug, CASE WHEN s.is_published THEN s.slug END,
    coalesce(nullif(p.display_name,''), s.name, m.business_name),
    coalesce(p.logo_url, s.logo_url),
    coalesce(p.featured_image_url, p.gallery_urls[1], s.hero_image_url),
    p.gallery_urls,
    coalesce(nullif(p.tagline,''), s.description),
    p.category, p.cuisines,
    coalesce(nullif(p.service_area_label,''), nullif(concat_ws(', ', coalesce(p.city, m.city), coalesce(p.region, m.region)),''), s.location),
    coalesce(p.offers_pickup, s.pickup_enabled, false),
    coalesce(p.offers_delivery, s.delivery_enabled, false),
    coalesce(m.accepting_orders AND s.status = 'published' AND s.is_published, false),
    p.website_url, p.social_links, p.public_phone, p.public_email
  FROM public.merchant_local_profiles p
  JOIN public.merchants m ON m.id = p.merchant_id
  LEFT JOIN public.merchant_storefronts s ON s.merchant_id = m.id
  WHERE p.slug = _slug AND p.is_listed AND (s.id IS NULL OR s.is_published)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_local_business(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_local_business(text) TO anon, authenticated;