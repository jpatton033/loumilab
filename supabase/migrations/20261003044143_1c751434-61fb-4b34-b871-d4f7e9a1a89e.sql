-- ===== Canonical listing: allow unclaimed (ownerless) listings =====
ALTER TABLE public.merchant_local_profiles
  ALTER COLUMN merchant_id DROP NOT NULL,
  ADD COLUMN ownership_status text NOT NULL DEFAULT 'claimed' CHECK (ownership_status IN ('claimed','unclaimed')),
  ADD COLUMN source_kind text NOT NULL DEFAULT 'merchant' CHECK (source_kind IN ('merchant','import','manual')),
  ADD COLUMN last_checked_at timestamptz,
  ADD COLUMN is_sample boolean NOT NULL DEFAULT false,
  ADD COLUMN website_domain text,
  ADD COLUMN phone_norm text,
  ADD COLUMN name_key text,
  ADD COLUMN hours_text text CHECK (hours_text IS NULL OR char_length(hours_text) <= 400);

-- Normalizers
CREATE OR REPLACE FUNCTION public.local_norm_domain(_url text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT nullif(regexp_replace(lower(substring(coalesce(_url,'') from '^(?:[a-zA-Z]+://)?(?:[^@/]*@)?([^/:?#]+)')), '^www\.', ''), '')
$$;
CREATE OR REPLACE FUNCTION public.local_norm_phone(_p text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN length(d) >= 10 THEN right(d, 10) END FROM (SELECT regexp_replace(coalesce(_p,''), '[^0-9]', '', 'g') d) x
$$;
CREATE OR REPLACE FUNCTION public.local_name_key(_name text, _city text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT nullif(regexp_replace(lower(coalesce(_name,'')), '[^a-z0-9]+', '', 'g'), '') || '|' || regexp_replace(lower(coalesce(_city,'')), '[^a-z0-9]+', '', 'g')
$$;

-- Owners may not change ownership/moderation fields
CREATE OR REPLACE FUNCTION public.guard_local_featured() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_staff(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_featured := false; NEW.featured_rank := 0;
      NEW.ownership_status := 'claimed'; NEW.source_kind := 'merchant'; NEW.is_sample := false;
    ELSE
      NEW.is_featured := OLD.is_featured; NEW.featured_rank := OLD.featured_rank;
      NEW.ownership_status := OLD.ownership_status; NEW.source_kind := OLD.source_kind;
      NEW.is_sample := OLD.is_sample; NEW.merchant_id := OLD.merchant_id; NEW.last_checked_at := OLD.last_checked_at;
    END IF;
  END IF;
  NEW.website_domain := public.local_norm_domain(NEW.website_url);
  NEW.phone_norm := public.local_norm_phone(NEW.public_phone);
  NEW.name_key := public.local_name_key(coalesce(NEW.display_name, (SELECT business_name FROM public.merchants WHERE id = NEW.merchant_id)), NEW.city);
  NEW.updated_at := now();
  RETURN NEW;
END $$;
UPDATE public.merchant_local_profiles SET updated_at = now();

-- ===== Importer tables =====
CREATE TABLE public.local_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, name text NOT NULL, state text NOT NULL DEFAULT 'MD',
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.local_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  source_type text NOT NULL DEFAULT 'official_website' CHECK (source_type IN ('official_website','merchant_submission','licensed_provider','government','organization','directory','social')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','blocked','paused')),
  allowed_paths text[] NOT NULL DEFAULT '{}', excluded_paths text[] NOT NULL DEFAULT '{}',
  permitted_fields text[] NOT NULL DEFAULT '{}', usage_evidence text, notes text,
  min_delay_seconds integer NOT NULL DEFAULT 3,
  reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.local_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('csv','manual','urls')),
  filename text, file_hash text UNIQUE, row_count integer NOT NULL DEFAULT 0,
  market_id uuid REFERENCES public.local_markets(id),
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.local_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.local_import_batches(id) ON DELETE SET NULL,
  market_id uuid REFERENCES public.local_markets(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','needs_extraction','published','rejected','suppressed','merged')),
  business_name text CHECK (business_name IS NULL OR char_length(business_name) <= 120),
  category text, cuisines text[] NOT NULL DEFAULT '{}',
  city text, region text, postal_code text, service_area text,
  website_url text, public_phone text, public_email text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  hours_text text, offers_pickup boolean, offers_delivery boolean,
  description text CHECK (description IS NULL OR char_length(description) <= 220),
  source_url text, source_type text, observed_at timestamptz,
  website_domain text, phone_norm text, name_key text,
  idempotency_key text UNIQUE,
  match_kind text CHECK (match_kind IN ('exact','probable','suppressed')),
  match_profile_id uuid REFERENCES public.merchant_local_profiles(id) ON DELETE SET NULL,
  match_candidate_id uuid REFERENCES public.local_candidates(id) ON DELETE SET NULL,
  dup_decision text CHECK (dup_decision IN ('distinct','link')),
  review_notes text, is_sample boolean NOT NULL DEFAULT false,
  published_profile_id uuid REFERENCES public.merchant_local_profiles(id) ON DELETE SET NULL,
  reviewed_by uuid, reviewed_at timestamptz,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.local_candidates (status);
CREATE INDEX ON public.local_candidates (name_key);
CREATE INDEX ON public.local_candidates (website_domain);
CREATE INDEX ON public.local_candidates (phone_norm);
CREATE TABLE public.local_field_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.local_candidates(id) ON DELETE CASCADE,
  field text NOT NULL, value text, source_url text, retrieved_at timestamptz NOT NULL DEFAULT now(),
  excerpt text CHECK (excerpt IS NULL OR char_length(excerpt) <= 500),
  method text NOT NULL DEFAULT 'csv', quality text NOT NULL DEFAULT 'ok' CHECK (quality IN ('ok','weak','conflict')),
  expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.local_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.local_import_batches(id) ON DELETE SET NULL,
  candidate_id uuid REFERENCES public.local_candidates(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'extract' CHECK (kind IN ('extract','discover','refresh')),
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','running','done','failed','cancelled','paused','waiting_config')),
  attempts integer NOT NULL DEFAULT 0, max_pages integer NOT NULL DEFAULT 4,
  lease_until timestamptz, next_attempt_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text UNIQUE, last_error text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.local_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.merchant_local_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, user_email text,
  contact_name text NOT NULL CHECK (char_length(contact_name) BETWEEN 1 AND 120),
  role text CHECK (role IS NULL OR char_length(role) <= 80),
  evidence text CHECK (evidence IS NULL OR char_length(evidence) <= 1500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by uuid, decided_at timestamptz, decision_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.local_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.merchant_local_profiles(id) ON DELETE SET NULL,
  profile_slug text,
  kind text NOT NULL CHECK (kind IN ('correction','removal')),
  name text CHECK (name IS NULL OR char_length(name) <= 120),
  email text NOT NULL CHECK (char_length(email) <= 160),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by uuid, decided_at timestamptz, decision_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.local_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('domain','phone','name_city')),
  key text NOT NULL, reason text, created_by uuid, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, key)
);
CREATE TABLE public.local_importer_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  kill_switch boolean NOT NULL DEFAULT false,
  dispatch_paused boolean NOT NULL DEFAULT false,
  max_domains_per_batch integer NOT NULL DEFAULT 25,
  max_pages_per_domain integer NOT NULL DEFAULT 4,
  min_delay_seconds integer NOT NULL DEFAULT 3,
  daily_page_limit integer NOT NULL DEFAULT 100,
  pages_used_today integer NOT NULL DEFAULT 0,
  usage_date date NOT NULL DEFAULT current_date,
  recrawl_cooldown_days integer NOT NULL DEFAULT 7,
  evidence_retention_days integer NOT NULL DEFAULT 90,
  provider_retention_days integer NOT NULL DEFAULT 7,
  freshness_days integer NOT NULL DEFAULT 90,
  freshness_enabled boolean NOT NULL DEFAULT false,
  csv_max_rows integer NOT NULL DEFAULT 250,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.local_markets, public.local_sources, public.local_import_batches,
  public.local_candidates, public.local_field_evidence, public.local_jobs, public.local_claims, public.local_requests,
  public.local_suppressions, public.local_importer_settings TO authenticated;
GRANT ALL ON public.local_markets, public.local_sources, public.local_import_batches, public.local_candidates,
  public.local_field_evidence, public.local_jobs, public.local_claims, public.local_requests,
  public.local_suppressions, public.local_importer_settings TO service_role;

-- RLS: staff only (claims also readable by their submitter)
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['local_markets','local_sources','local_import_batches','local_candidates','local_field_evidence',
    'local_jobs','local_claims','local_requests','local_suppressions','local_importer_settings'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Staff manage %s" ON public.%I FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t, t);
  END LOOP;
END $$;
CREATE POLICY "Users view own claims" ON public.local_claims FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Seeds
INSERT INTO public.local_markets (slug, name) VALUES ('baltimore-city','Baltimore City'), ('baltimore-county','Baltimore County');
INSERT INTO public.local_importer_settings (id) VALUES (1);
INSERT INTO public.local_sources (domain, source_type, status, notes) VALUES
  ('yelp.com','directory','blocked','Blocked by default: third-party directory'),
  ('google.com','directory','blocked','Blocked by default: includes Google Maps'),
  ('maps.google.com','directory','blocked','Blocked by default'),
  ('doordash.com','directory','blocked','Blocked by default: delivery marketplace'),
  ('ubereats.com','directory','blocked','Blocked by default: delivery marketplace'),
  ('grubhub.com','directory','blocked','Blocked by default: delivery marketplace'),
  ('facebook.com','social','blocked','Blocked by default: social platform'),
  ('instagram.com','social','blocked','Blocked by default: social platform'),
  ('tiktok.com','social','blocked','Blocked by default: social platform'),
  ('x.com','social','blocked','Blocked by default: social platform'),
  ('tripadvisor.com','directory','blocked','Blocked by default: third-party directory');

-- ===== Candidate normalization + duplicate/suppression detection =====
CREATE OR REPLACE FUNCTION public.local_candidate_prepare() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p_id uuid; c_id uuid; kind text;
BEGIN
  NEW.website_domain := public.local_norm_domain(NEW.website_url);
  NEW.phone_norm := public.local_norm_phone(NEW.public_phone);
  NEW.name_key := CASE WHEN NEW.business_name IS NOT NULL THEN public.local_name_key(NEW.business_name, NEW.city) END;
  NEW.updated_at := now();
  IF NEW.status IN ('published','rejected','merged') THEN RETURN NEW; END IF;

  NEW.match_kind := NULL; NEW.match_profile_id := NULL; NEW.match_candidate_id := NULL;
  IF EXISTS (SELECT 1 FROM public.local_suppressions s WHERE
      (s.kind='domain' AND s.key = NEW.website_domain) OR (s.kind='phone' AND s.key = NEW.phone_norm) OR (s.kind='name_city' AND s.key = NEW.name_key)) THEN
    NEW.match_kind := 'suppressed'; NEW.status := 'suppressed'; RETURN NEW;
  END IF;
  -- exact: same name+city plus same domain or phone (or name+city alone with no domain/phone on either)
  SELECT id INTO p_id FROM public.merchant_local_profiles p WHERE p.name_key = NEW.name_key AND
    ((NEW.website_domain IS NOT NULL AND p.website_domain = NEW.website_domain) OR (NEW.phone_norm IS NOT NULL AND p.phone_norm = NEW.phone_norm)) LIMIT 1;
  IF p_id IS NOT NULL THEN NEW.match_kind := 'exact'; NEW.match_profile_id := p_id; RETURN NEW; END IF;
  SELECT id INTO p_id FROM public.merchant_local_profiles p WHERE p.name_key = NEW.name_key
     OR (NEW.website_domain IS NOT NULL AND p.website_domain = NEW.website_domain)
     OR (NEW.phone_norm IS NOT NULL AND p.phone_norm = NEW.phone_norm) LIMIT 1;
  IF p_id IS NOT NULL THEN NEW.match_kind := 'probable'; NEW.match_profile_id := p_id; RETURN NEW; END IF;
  SELECT id INTO c_id FROM public.local_candidates c WHERE c.id <> NEW.id AND c.status IN ('draft','needs_extraction') AND (
     c.name_key = NEW.name_key OR (NEW.website_domain IS NOT NULL AND c.website_domain = NEW.website_domain)
     OR (NEW.phone_norm IS NOT NULL AND c.phone_norm = NEW.phone_norm)) ORDER BY c.created_at LIMIT 1;
  IF c_id IS NOT NULL THEN NEW.match_kind := 'probable'; NEW.match_candidate_id := c_id; END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.local_candidate_prepare() FROM public, anon, authenticated;
CREATE TRIGGER local_candidates_prepare BEFORE INSERT OR UPDATE ON public.local_candidates
  FOR EACH ROW EXECUTE FUNCTION public.local_candidate_prepare();

-- ===== Publish (staff) =====
CREATE OR REPLACE FUNCTION public.publish_local_candidate(_id uuid, _notes text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.local_candidates; pid uuid; dup uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('local_publish'));
  SELECT * INTO c FROM public.local_candidates WHERE id = _id FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Candidate not found'; END IF;
  IF c.status = 'published' THEN RETURN c.published_profile_id; END IF;
  IF c.status NOT IN ('draft') THEN RAISE EXCEPTION 'Only drafts can be published (status: %)', c.status; END IF;
  IF coalesce(btrim(c.business_name),'') = '' THEN RAISE EXCEPTION 'Business name is required'; END IF;
  IF coalesce(btrim(c.city),'') = '' AND coalesce(btrim(c.service_area),'') = '' THEN RAISE EXCEPTION 'City or service area is required'; END IF;
  IF coalesce(btrim(c.source_url),'') = '' THEN RAISE EXCEPTION 'A source reference is required'; END IF;
  IF c.is_sample THEN RAISE EXCEPTION 'Sample records cannot be published'; END IF;
  IF EXISTS (SELECT 1 FROM public.local_suppressions s WHERE
      (s.kind='domain' AND s.key = c.website_domain) OR (s.kind='phone' AND s.key = c.phone_norm) OR (s.kind='name_city' AND s.key = c.name_key)) THEN
    UPDATE public.local_candidates SET status='suppressed' WHERE id=_id; RAISE EXCEPTION 'This business is on the removal list';
  END IF;
  IF coalesce(c.dup_decision,'') <> 'distinct' THEN
    SELECT id INTO dup FROM public.merchant_local_profiles p WHERE p.name_key = c.name_key
      OR (c.website_domain IS NOT NULL AND p.website_domain = c.website_domain AND p.name_key = c.name_key)
      OR (c.phone_norm IS NOT NULL AND p.phone_norm = c.phone_norm) LIMIT 1;
    IF dup IS NOT NULL THEN RAISE EXCEPTION 'Possible duplicate of an existing listing — mark it as a distinct branch or link it first'; END IF;
  END IF;
  INSERT INTO public.merchant_local_profiles (merchant_id, is_listed, ownership_status, source_kind, display_name, category, cuisines,
    tagline, city, region, postal_code, service_area_label, website_url, public_phone, public_email, social_links,
    hours_text, offers_pickup, offers_delivery, last_checked_at)
  VALUES (NULL, true, 'unclaimed', CASE WHEN c.batch_id IS NULL THEN 'manual' ELSE 'import' END, c.business_name, c.category, c.cuisines,
    c.description, c.city, c.region, CASE WHEN c.postal_code ~ '^[0-9]{5}$' THEN c.postal_code END, c.service_area, c.website_url,
    c.public_phone, c.public_email, c.social_links, c.hours_text, c.offers_pickup, c.offers_delivery, coalesce(c.observed_at, now()))
  RETURNING id INTO pid;
  UPDATE public.local_candidates SET status='published', published_profile_id=pid, reviewed_by=auth.uid(), reviewed_at=now(),
    review_notes=coalesce(_notes, review_notes) WHERE id=_id;
  INSERT INTO public.audit_logs (action, actor_id, target_id, new_value, reason)
    VALUES ('local.candidate_published', auth.uid(), pid, jsonb_build_object('candidate', _id, 'name', c.business_name), _notes);
  RETURN pid;
END $$;

-- ===== Suppress a listing (staff) =====
CREATE OR REPLACE FUNCTION public.suppress_local_profile(_profile_id uuid, _reason text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.merchant_local_profiles;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT * INTO p FROM public.merchant_local_profiles WHERE id = _profile_id;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  UPDATE public.merchant_local_profiles SET is_listed = false WHERE id = _profile_id;
  IF p.website_domain IS NOT NULL THEN INSERT INTO public.local_suppressions (kind,key,reason,created_by) VALUES ('domain',p.website_domain,_reason,auth.uid()) ON CONFLICT DO NOTHING; END IF;
  IF p.phone_norm IS NOT NULL THEN INSERT INTO public.local_suppressions (kind,key,reason,created_by) VALUES ('phone',p.phone_norm,_reason,auth.uid()) ON CONFLICT DO NOTHING; END IF;
  IF p.name_key IS NOT NULL THEN INSERT INTO public.local_suppressions (kind,key,reason,created_by) VALUES ('name_city',p.name_key,_reason,auth.uid()) ON CONFLICT DO NOTHING; END IF;
  INSERT INTO public.audit_logs (action, actor_id, target_id, reason) VALUES ('local.listing_suppressed', auth.uid(), _profile_id, _reason);
END $$;

-- ===== Public: claim + correction/removal requests =====
CREATE OR REPLACE FUNCTION public.submit_local_claim(_slug text, _contact_name text, _role text, _evidence text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid; cid uuid; em text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in to claim this business'; END IF;
  IF public.check_and_increment_rate_limit('local_claim:' || auth.uid()::text, 5, 86400) THEN RAISE EXCEPTION 'Too many claim requests — try again tomorrow'; END IF;
  SELECT id INTO pid FROM public.merchant_local_profiles WHERE slug = _slug AND is_listed AND ownership_status = 'unclaimed';
  IF pid IS NULL THEN RAISE EXCEPTION 'This listing can''t be claimed'; END IF;
  IF EXISTS (SELECT 1 FROM public.local_claims WHERE profile_id = pid AND user_id = auth.uid() AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have a pending claim for this business'; END IF;
  SELECT email INTO em FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.local_claims (profile_id, user_id, user_email, contact_name, role, evidence)
    VALUES (pid, auth.uid(), em, btrim(_contact_name), nullif(btrim(_role),''), nullif(btrim(_evidence),'')) RETURNING id INTO cid;
  RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.submit_local_claim(text,text,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.submit_local_claim(text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_local_request(_slug text, _kind text, _name text, _email text, _message text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid; e text := lower(btrim(coalesce(_email,'')));
BEGIN
  IF _kind NOT IN ('correction','removal') THEN RAISE EXCEPTION 'Invalid request'; END IF;
  IF e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Please enter a valid email'; END IF;
  IF coalesce(btrim(_message),'') = '' THEN RAISE EXCEPTION 'Please add a short message'; END IF;
  IF public.check_and_increment_rate_limit('local_request:' || e, 5, 3600) OR public.check_and_increment_rate_limit('local_request:all', 200, 3600) THEN
    RAISE EXCEPTION 'Too many requests — please try again later'; END IF;
  SELECT id INTO pid FROM public.merchant_local_profiles WHERE slug = _slug;
  IF pid IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  INSERT INTO public.local_requests (profile_id, profile_slug, kind, name, email, message)
    VALUES (pid, _slug, _kind, nullif(left(btrim(_name),120),''), e, left(btrim(_message),2000));
END $$;
REVOKE ALL ON FUNCTION public.submit_local_request(text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_local_request(text,text,text,text,text) TO anon, authenticated;

-- ===== Staff decisions =====
CREATE OR REPLACE FUNCTION public.decide_local_claim(_claim_id uuid, _approve boolean, _notes text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cl public.local_claims; p public.merchant_local_profiles; mid uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT * INTO cl FROM public.local_claims WHERE id = _claim_id FOR UPDATE;
  IF cl.id IS NULL OR cl.status <> 'pending' THEN RAISE EXCEPTION 'Claim is not pending'; END IF;
  IF NOT _approve THEN
    UPDATE public.local_claims SET status='rejected', decided_by=auth.uid(), decided_at=now(), decision_notes=_notes WHERE id=_claim_id;
    INSERT INTO public.audit_logs (action, actor_id, target_id, reason) VALUES ('local.claim_rejected', auth.uid(), cl.profile_id, _notes);
    RETURN;
  END IF;
  SELECT * INTO p FROM public.merchant_local_profiles WHERE id = cl.profile_id FOR UPDATE;
  IF p.merchant_id IS NOT NULL OR p.ownership_status = 'claimed' THEN RAISE EXCEPTION 'This listing already has an owner'; END IF;
  SELECT id INTO mid FROM public.merchants WHERE owner_id = cl.user_id ORDER BY created_at LIMIT 1;
  IF mid IS NOT NULL AND EXISTS (SELECT 1 FROM public.merchant_local_profiles WHERE merchant_id = mid) THEN
    RAISE EXCEPTION 'This person already manages a Local listing'; END IF;
  IF mid IS NULL THEN
    INSERT INTO public.merchants (owner_id, business_name, contact_email, plan_slug, accepting_orders)
      VALUES (cl.user_id, coalesce(p.display_name,'My business'), coalesce(cl.user_email, p.public_email, ''), 'launch', false) RETURNING id INTO mid;
  END IF;
  UPDATE public.merchant_local_profiles SET merchant_id = mid, ownership_status = 'claimed' WHERE id = p.id;
  UPDATE public.local_claims SET status='approved', decided_by=auth.uid(), decided_at=now(), decision_notes=_notes WHERE id=_claim_id;
  UPDATE public.local_claims SET status='rejected', decided_by=auth.uid(), decided_at=now(), decision_notes='Another claim was approved'
    WHERE profile_id = p.id AND status = 'pending' AND id <> _claim_id;
  INSERT INTO public.audit_logs (action, actor_id, target_id, new_value, reason)
    VALUES ('local.claim_approved', auth.uid(), p.id, jsonb_build_object('owner', cl.user_id, 'merchant', mid), _notes);
END $$;

CREATE OR REPLACE FUNCTION public.decide_local_request(_request_id uuid, _approve boolean, _notes text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.local_requests;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT * INTO r FROM public.local_requests WHERE id = _request_id FOR UPDATE;
  IF r.id IS NULL OR r.status <> 'pending' THEN RAISE EXCEPTION 'Request is not pending'; END IF;
  IF _approve AND r.kind = 'removal' AND r.profile_id IS NOT NULL THEN
    PERFORM public.suppress_local_profile(r.profile_id, coalesce(_notes, 'Removal request approved'));
  END IF;
  UPDATE public.local_requests SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    decided_by=auth.uid(), decided_at=now(), decision_notes=_notes WHERE id=_request_id;
  INSERT INTO public.audit_logs (action, actor_id, target_id, reason)
    VALUES ('local.request_' || CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, auth.uid(), r.profile_id, _notes);
END $$;

REVOKE ALL ON FUNCTION public.publish_local_candidate(uuid,text), public.suppress_local_profile(uuid,text),
  public.decide_local_claim(uuid,boolean,text), public.decide_local_request(uuid,boolean,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.publish_local_candidate(uuid,text), public.suppress_local_profile(uuid,text),
  public.decide_local_claim(uuid,boolean,text), public.decide_local_request(uuid,boolean,text) TO authenticated;

-- ===== Public read RPCs: support ownerless listings =====
DROP FUNCTION public.search_local_businesses(text,text,integer,text,boolean,boolean,boolean,boolean,integer);
CREATE FUNCTION public.search_local_businesses(
  _q text DEFAULT NULL, _place text DEFAULT NULL, _radius_miles integer DEFAULT 25,
  _category text DEFAULT NULL, _pickup boolean DEFAULT false, _delivery boolean DEFAULT false,
  _accepting boolean DEFAULT false, _featured_only boolean DEFAULT false, _limit integer DEFAULT 48)
RETURNS TABLE (slug text, store_slug text, name text, logo_url text, image_url text, description text, category text,
  cuisines text[], area text, pickup boolean, delivery boolean, accepting boolean, is_featured boolean, distance_miles double precision,
  ownership_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH origin AS (
    SELECT z.lat, z.lng FROM public.zip_centroids z WHERE z.zip = substring(coalesce(_place,'') from '^\s*([0-9]{5})')
  ), base AS (
    SELECT p.slug, CASE WHEN p.ownership_status = 'claimed' AND s.is_published THEN s.slug END AS store_slug,
      coalesce(nullif(p.display_name,''), s.name, m.business_name) AS name,
      coalesce(p.logo_url, s.logo_url) AS logo_url,
      coalesce(p.featured_image_url, p.gallery_urls[1], s.hero_image_url) AS image_url,
      coalesce(nullif(p.tagline,''), s.description) AS description,
      p.category, p.cuisines,
      coalesce(nullif(p.service_area_label,''), nullif(concat_ws(', ', coalesce(p.city, m.city), coalesce(p.region, m.region)),''), s.location) AS area,
      coalesce(p.offers_pickup, s.pickup_enabled, false) AS pickup,
      coalesce(p.offers_delivery, s.delivery_enabled, false) AS delivery,
      coalesce(p.ownership_status = 'claimed' AND m.accepting_orders AND s.status = 'published' AND s.is_published, false) AS accepting,
      p.is_featured, p.featured_rank, p.created_at, p.ownership_status,
      coalesce(p.city, m.city) AS city, s.location, s.id AS storefront_id,
      zc.lat, zc.lng
    FROM public.merchant_local_profiles p
    LEFT JOIN public.merchants m ON m.id = p.merchant_id
    LEFT JOIN public.merchant_storefronts s ON s.merchant_id = m.id
    LEFT JOIN public.zip_centroids zc ON zc.zip = coalesce(p.postal_code, m.postal_code)
    WHERE p.is_listed AND NOT p.is_sample AND p.slug IS NOT NULL AND (s.id IS NULL OR s.is_published)
  )
  SELECT b.slug, b.store_slug, b.name, b.logo_url, b.image_url, left(b.description, 220), b.category, b.cuisines, b.area,
    b.pickup, b.delivery, b.accepting, b.is_featured,
    CASE WHEN o.lat IS NOT NULL AND b.lat IS NOT NULL THEN
      3958.8 * 2 * asin(sqrt(power(sin(radians(b.lat - o.lat)/2),2) + cos(radians(o.lat))*cos(radians(b.lat))*power(sin(radians(b.lng - o.lng)/2),2)))
    END AS distance_miles, b.ownership_status
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

DROP FUNCTION public.get_local_business(text);
CREATE FUNCTION public.get_local_business(_slug text)
RETURNS TABLE (slug text, store_slug text, name text, logo_url text, image_url text, gallery_urls text[], description text,
  category text, cuisines text[], area text, pickup boolean, delivery boolean, accepting boolean,
  website_url text, social_links jsonb, public_phone text, public_email text,
  ownership_status text, last_checked_at timestamptz, hours_text text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.slug, CASE WHEN p.ownership_status = 'claimed' AND s.is_published THEN s.slug END,
    coalesce(nullif(p.display_name,''), s.name, m.business_name),
    coalesce(p.logo_url, s.logo_url),
    coalesce(p.featured_image_url, p.gallery_urls[1], s.hero_image_url),
    p.gallery_urls,
    coalesce(nullif(p.tagline,''), s.description),
    p.category, p.cuisines,
    coalesce(nullif(p.service_area_label,''), nullif(concat_ws(', ', coalesce(p.city, m.city), coalesce(p.region, m.region)),''), s.location),
    coalesce(p.offers_pickup, s.pickup_enabled, false),
    coalesce(p.offers_delivery, s.delivery_enabled, false),
    coalesce(p.ownership_status = 'claimed' AND m.accepting_orders AND s.status = 'published' AND s.is_published, false),
    p.website_url, p.social_links, p.public_phone, p.public_email,
    p.ownership_status, p.last_checked_at, p.hours_text
  FROM public.merchant_local_profiles p
  LEFT JOIN public.merchants m ON m.id = p.merchant_id
  LEFT JOIN public.merchant_storefronts s ON s.merchant_id = m.id
  WHERE p.slug = _slug AND p.is_listed AND NOT p.is_sample AND (s.id IS NULL OR s.is_published)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_local_business(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_local_business(text) TO anon, authenticated;