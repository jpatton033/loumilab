CREATE TABLE public.storefront_designs (
  storefront_id uuid PRIMARY KEY REFERENCES public.merchant_storefronts(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  template_key text NOT NULL DEFAULT 'minimal',
  schema_version integer NOT NULL DEFAULT 1,
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  published jsonb,
  published_version integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.storefront_designs TO authenticated;
GRANT ALL ON public.storefront_designs TO service_role;
ALTER TABLE public.storefront_designs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.storefront_design_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id uuid NOT NULL REFERENCES public.storefront_designs(storefront_id) ON DELETE CASCADE,
  version integer NOT NULL,
  design jsonb NOT NULL,
  published_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storefront_id, version)
);
GRANT SELECT ON public.storefront_design_versions TO authenticated;
GRANT ALL ON public.storefront_design_versions TO service_role;
ALTER TABLE public.storefront_design_versions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_storefront(_storefront uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.merchant_storefronts s JOIN public.merchants m ON m.id = s.merchant_id
                 WHERE s.id = _storefront AND m.owner_id = auth.uid())
$$;
REVOKE EXECUTE ON FUNCTION public.owns_storefront(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_storefront(uuid) TO authenticated;

CREATE POLICY "owner reads design" ON public.storefront_designs FOR SELECT TO authenticated
  USING (public.owns_storefront(storefront_id) OR public.is_staff(auth.uid()));
CREATE POLICY "owner creates design" ON public.storefront_designs FOR INSERT TO authenticated
  WITH CHECK (public.owns_storefront(storefront_id) AND published IS NULL AND published_version = 0
    AND merchant_id = (SELECT merchant_id FROM public.merchant_storefronts WHERE id = storefront_id));
CREATE POLICY "owner edits draft" ON public.storefront_designs FOR UPDATE TO authenticated
  USING (public.owns_storefront(storefront_id)) WITH CHECK (public.owns_storefront(storefront_id));
CREATE POLICY "owner reads versions" ON public.storefront_design_versions FOR SELECT TO authenticated
  USING (public.owns_storefront(storefront_id) OR public.is_staff(auth.uid()));

-- Clients may only change the draft; published state moves only through the RPCs below.
CREATE OR REPLACE FUNCTION public.storefront_design_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('app.design_publish', true) = 'on' THEN NEW.updated_at := now(); RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.published IS DISTINCT FROM OLD.published OR NEW.published_version <> OLD.published_version
       OR NEW.published_at IS DISTINCT FROM OLD.published_at OR NEW.merchant_id <> OLD.merchant_id
       OR NEW.storefront_id <> OLD.storefront_id THEN
      RAISE EXCEPTION 'Published designs change only through Publish';
    END IF;
  END IF;
  IF octet_length(NEW.draft::text) > 200000 THEN RAISE EXCEPTION 'Design is too large'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER storefront_design_guard BEFORE INSERT OR UPDATE ON public.storefront_designs
  FOR EACH ROW EXECUTE FUNCTION public.storefront_design_guard();

CREATE OR REPLACE FUNCTION public.validate_storefront_design(_d jsonb)
RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE s jsonb; allowed text[] := ARRAY['header','hero','about','products','services','featured','gallery','promo','testimonials','faq','contact','hours','footer'];
BEGIN
  IF jsonb_typeof(_d) <> 'object' OR jsonb_typeof(_d->'sections') <> 'array' OR jsonb_typeof(_d->'theme') <> 'object' THEN
    RAISE EXCEPTION 'Design is not valid'; END IF;
  IF jsonb_array_length(_d->'sections') > 40 THEN RAISE EXCEPTION 'Too many sections'; END IF;
  IF octet_length(_d::text) > 200000 THEN RAISE EXCEPTION 'Design is too large'; END IF;
  IF _d::text ~* '(<\s*script|javascript:|data:text/html|on[a-z]+\s*=)' THEN RAISE EXCEPTION 'Design contains disallowed content'; END IF;
  FOR s IN SELECT * FROM jsonb_array_elements(_d->'sections') LOOP
    IF NOT ((s->>'type') = ANY(allowed)) THEN RAISE EXCEPTION 'Unknown section type'; END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_d->'sections') x WHERE x->>'type' = 'products' AND coalesce((x->>'hidden')::boolean, false) = false) THEN
    RAISE EXCEPTION 'Your website needs a visible products section so customers can order'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.publish_storefront_design(_storefront uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.storefront_designs; v integer;
BEGIN
  IF NOT public.owns_storefront(_storefront) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  SELECT * INTO d FROM public.storefront_designs WHERE storefront_id = _storefront FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No design saved yet'; END IF;
  PERFORM public.validate_storefront_design(d.draft);
  v := d.published_version + 1;
  PERFORM set_config('app.design_publish', 'on', true);
  UPDATE public.storefront_designs SET published = d.draft, published_version = v, published_at = now() WHERE storefront_id = _storefront;
  PERFORM set_config('app.design_publish', 'off', true);
  INSERT INTO public.storefront_design_versions (storefront_id, version, design, published_by) VALUES (_storefront, v, d.draft, auth.uid());
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION public.restore_storefront_design(_storefront uuid, _version integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE old jsonb; v integer;
BEGIN
  IF NOT public.owns_storefront(_storefront) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  SELECT design INTO old FROM public.storefront_design_versions WHERE storefront_id = _storefront AND version = _version;
  IF old IS NULL THEN RAISE EXCEPTION 'Version not found'; END IF;
  SELECT published_version + 1 INTO v FROM public.storefront_designs WHERE storefront_id = _storefront FOR UPDATE;
  PERFORM set_config('app.design_publish', 'on', true);
  UPDATE public.storefront_designs SET draft = old, published = old, published_version = v, published_at = now() WHERE storefront_id = _storefront;
  PERFORM set_config('app.design_publish', 'off', true);
  INSERT INTO public.storefront_design_versions (storefront_id, version, design, published_by) VALUES (_storefront, v, old, auth.uid());
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION public.get_public_storefront_design(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.published FROM public.storefront_designs d JOIN public.merchant_storefronts s ON s.id = d.storefront_id
  WHERE s.slug = _slug AND d.published IS NOT NULL
    AND (s.is_published OR s.status IN ('published','paused') OR public.owns_storefront(s.id))
$$;

REVOKE EXECUTE ON FUNCTION public.publish_storefront_design(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_storefront_design(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_storefront_design(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_storefront_design(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_storefront_design(text) TO anon, authenticated;