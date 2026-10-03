ALTER TABLE public.local_candidates
  ADD COLUMN IF NOT EXISTS submitter_affiliation text CHECK (submitter_affiliation IS NULL OR submitter_affiliation IN ('owner','manager','family','customer','other')),
  ADD COLUMN IF NOT EXISTS submitter_name text CHECK (submitter_name IS NULL OR char_length(submitter_name) <= 120),
  ADD COLUMN IF NOT EXISTS submitter_email text CHECK (submitter_email IS NULL OR char_length(submitter_email) <= 160),
  ADD COLUMN IF NOT EXISTS affiliation_note text CHECK (affiliation_note IS NULL OR char_length(affiliation_note) <= 200);

CREATE OR REPLACE FUNCTION public.submit_local_listing(
  _affiliation text, _affiliation_note text, _submitter_name text, _submitter_email text,
  _business_name text, _category text, _cuisines text[], _city text, _region text, _postal_code text,
  _service_area text, _description text, _website_url text, _social_links jsonb,
  _offers_pickup boolean, _offers_delivery boolean, _public_phone text, _public_email text, _trap text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e text := lower(btrim(coalesce(_submitter_email,''))); n text := btrim(coalesce(_business_name,''));
  w text := nullif(btrim(coalesce(_website_url,'')),''); s jsonb := '{}'::jsonb; k text;
BEGIN
  IF coalesce(_trap,'') <> '' THEN RETURN; END IF;
  IF _affiliation NOT IN ('owner','manager','family','customer','other') THEN RAISE EXCEPTION 'Please choose your connection to this business'; END IF;
  IF char_length(n) < 2 OR char_length(n) > 120 THEN RAISE EXCEPTION 'Please enter the business name'; END IF;
  IF e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(e) > 160 THEN RAISE EXCEPTION 'Please enter a valid email'; END IF;
  IF coalesce(btrim(_submitter_name),'') = '' THEN RAISE EXCEPTION 'Please enter your name'; END IF;
  IF coalesce(btrim(_city),'') = '' AND coalesce(btrim(_service_area),'') = '' THEN RAISE EXCEPTION 'Please enter a city or service area'; END IF;
  IF _postal_code IS NOT NULL AND btrim(_postal_code) <> '' AND btrim(_postal_code) !~ '^\d{5}$' THEN RAISE EXCEPTION 'ZIP code must be 5 digits'; END IF;
  IF w IS NOT NULL AND (w !~* '^https?://' OR char_length(w) > 300) THEN RAISE EXCEPTION 'Website must start with http:// or https://'; END IF;
  IF _social_links IS NOT NULL AND jsonb_typeof(_social_links) = 'object' THEN
    FOR k IN SELECT jsonb_object_keys(_social_links) LOOP
      IF k IN ('instagram','facebook','tiktok','x') AND (_social_links->>k) ~* '^https?://' AND char_length(_social_links->>k) <= 300 THEN
        s := s || jsonb_build_object(k, _social_links->>k); END IF;
    END LOOP;
  END IF;
  IF public.check_and_increment_rate_limit('local_listing:' || e, 3, 3600) OR public.check_and_increment_rate_limit('local_listing:all', 100, 3600) THEN
    RAISE EXCEPTION 'Too many submissions — please try again later'; END IF;
  INSERT INTO public.local_candidates (status, business_name, category, cuisines, city, region, postal_code, service_area,
    description, website_url, social_links, offers_pickup, offers_delivery, public_phone, public_email,
    source_type, source_url, observed_at, submitter_affiliation, affiliation_note, submitter_name, submitter_email, created_by)
  VALUES ('draft', n, nullif(left(btrim(coalesce(_category,'')),40),''),
    coalesce((SELECT array_agg(left(btrim(c),40)) FROM unnest(coalesce(_cuisines,'{}')) c WHERE btrim(c) <> '' LIMIT 6),'{}'),
    nullif(left(btrim(coalesce(_city,'')),80),''), nullif(left(btrim(coalesce(_region,'')),40),''), nullif(btrim(coalesce(_postal_code,'')),''),
    nullif(left(btrim(coalesce(_service_area,'')),80),''), nullif(left(btrim(coalesce(_description,'')),220),''),
    w, s, _offers_pickup, _offers_delivery, nullif(left(btrim(coalesce(_public_phone,'')),30),''), nullif(left(lower(btrim(coalesce(_public_email,''))),160),''),
    'visitor', w, now(), _affiliation, nullif(left(btrim(coalesce(_affiliation_note,'')),200),''), left(btrim(_submitter_name),120), e, auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.submit_local_listing(text,text,text,text,text,text,text[],text,text,text,text,text,text,jsonb,boolean,boolean,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_local_listing(text,text,text,text,text,text,text[],text,text,text,text,text,text,jsonb,boolean,boolean,text,text,text) TO anon, authenticated;