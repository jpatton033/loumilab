CREATE OR REPLACE FUNCTION public.local_profile_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    -- Ownerless listings have no merchants row, so prefer display_name first.
    IF NEW.merchant_id IS NULL THEN
      base := nullif(NEW.display_name, '');
    ELSE
      SELECT coalesce(nullif(NEW.display_name,''), m.business_name) INTO base FROM public.merchants m WHERE m.id = NEW.merchant_id;
    END IF;
    base := trim(both '-' from regexp_replace(lower(coalesce(base,'business')), '[^a-z0-9]+', '-', 'g'));
    IF base = '' THEN base := 'business'; END IF;
    cand := left(base, 60);
    WHILE EXISTS (SELECT 1 FROM public.merchant_local_profiles WHERE slug = cand AND id <> NEW.id) LOOP
      n := n + 1; cand := left(base, 56) || '-' || n;
    END LOOP;
    NEW.slug := cand;
  END IF;
  RETURN NEW;
END $function$;

-- Repair existing generic slugs for unclaimed listings that have a real name.
WITH bad AS (
  SELECT id, display_name
  FROM public.merchant_local_profiles
  WHERE slug ~ '^business(-[0-9]+)?$'
    AND coalesce(btrim(display_name), '') <> ''
), ranked AS (
  SELECT id,
    trim(both '-' from regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g')) AS base,
    row_number() OVER (PARTITION BY trim(both '-' from regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g')) ORDER BY id) - 1 AS dup
  FROM bad
), proposed AS (
  SELECT id,
    CASE WHEN dup = 0 THEN left(base, 60) ELSE left(base, 56) || '-' || dup END AS cand
  FROM ranked
  WHERE base <> ''
), final AS (
  -- avoid collisions with existing slugs not being renamed
  SELECT p.id,
    CASE WHEN EXISTS (SELECT 1 FROM public.merchant_local_profiles e WHERE e.slug = p.cand AND e.id <> p.id AND e.slug !~ '^business(-[0-9]+)?$')
      THEN p.cand || '-' || substr(p.id::text, 1, 4)
      ELSE p.cand
    END AS new_slug
  FROM proposed p
)
UPDATE public.merchant_local_profiles t
SET slug = f.new_slug
FROM final f
WHERE t.id = f.id;