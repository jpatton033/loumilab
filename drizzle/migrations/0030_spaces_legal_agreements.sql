CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read legal documents" ON public.legal_documents FOR SELECT USING (true);

CREATE TABLE public.legal_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.legal_documents(id),
  version text NOT NULL,
  content text NOT NULL,
  content_hash text NOT NULL DEFAULT '',
  effective_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  requires_reacceptance boolean NOT NULL DEFAULT true,
  approved_by uuid,
  approval_note text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version)
);
GRANT SELECT ON public.legal_document_versions TO anon, authenticated;
GRANT ALL ON public.legal_document_versions TO service_role;
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published versions are public, drafts staff-only" ON public.legal_document_versions FOR SELECT
  USING (status <> 'draft' OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.legal_version_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' THEN RAISE EXCEPTION 'Published legal versions cannot be deleted'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> 'draft' THEN
    IF NEW.content IS DISTINCT FROM OLD.content OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.document_id IS DISTINCT FROM OLD.document_id OR NEW.effective_date IS DISTINCT FROM OLD.effective_date
       OR NEW.requires_reacceptance IS DISTINCT FROM OLD.requires_reacceptance
       OR NEW.published_at IS DISTINCT FROM OLD.published_at OR NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
      RAISE EXCEPTION 'Published legal versions are immutable; create a new version';
    END IF;
    IF NOT (NEW.status = OLD.status OR (OLD.status = 'published' AND NEW.status = 'retired')) THEN
      RAISE EXCEPTION 'Invalid legal version status change';
    END IF;
  END IF;
  NEW.content_hash := encode(sha256(convert_to(NEW.content, 'UTF8')), 'hex');
  RETURN NEW;
END $$;
CREATE TRIGGER legal_version_guard BEFORE INSERT OR UPDATE OR DELETE ON public.legal_document_versions
  FOR EACH ROW EXECUTE FUNCTION public.legal_version_guard();

CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.legal_documents(id),
  version_id uuid NOT NULL REFERENCES public.legal_document_versions(id),
  content_hash text NOT NULL,
  method text NOT NULL CHECK (method IN ('signup_checkbox','acceptance_prompt')),
  workspace_id uuid,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, version_id)
);
GRANT SELECT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own acceptances; staff read all" ON public.legal_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.legal_acceptance_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Acceptance records are immutable'; END $$;
CREATE TRIGGER legal_acceptance_immutable BEFORE UPDATE OR DELETE ON public.legal_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.legal_acceptance_immutable();

CREATE OR REPLACE FUNCTION public.legal_current_version(_slug text)
RETURNS TABLE(id uuid, document_id uuid, title text, version text, content text, content_hash text, effective_date date, published_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, d.id, d.title, v.version, v.content, v.content_hash, v.effective_date, v.published_at
  FROM legal_document_versions v JOIN legal_documents d ON d.id = v.document_id
  WHERE d.slug = _slug AND v.status = 'published' AND v.effective_date <= (now() AT TIME ZONE 'America/New_York')::date
  ORDER BY v.published_at DESC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.legal_needs_acceptance(_slug text, _uid uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := coalesce(_uid, auth.uid()); req record;
BEGIN
  IF auth.uid() IS NOT NULL AND u <> auth.uid() AND NOT public.is_staff(auth.uid()) THEN u := auth.uid(); END IF;
  IF u IS NULL THEN RETURN false; END IF;
  SELECT v.id, v.published_at, v.document_id INTO req
  FROM legal_document_versions v JOIN legal_documents d ON d.id = v.document_id
  WHERE d.slug = _slug AND v.status = 'published' AND v.effective_date <= (now() AT TIME ZONE 'America/New_York')::date
    AND (v.requires_reacceptance OR NOT EXISTS (
      SELECT 1 FROM legal_document_versions p WHERE p.document_id = v.document_id AND p.status <> 'draft' AND p.published_at < v.published_at))
  ORDER BY v.published_at DESC LIMIT 1;
  IF req.id IS NULL THEN RETURN false; END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM legal_acceptances a JOIN legal_document_versions v ON v.id = a.version_id
    WHERE a.user_id = u AND a.document_id = req.document_id AND v.published_at >= req.published_at);
END $$;

CREATE OR REPLACE FUNCTION public.legal_accept(_version uuid, _hash text, _method text, _workspace uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur record; d record; rid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF _method NOT IN ('signup_checkbox','acceptance_prompt') THEN RAISE EXCEPTION 'Invalid acceptance method'; END IF;
  SELECT v.document_id, d2.slug INTO d FROM legal_document_versions v JOIN legal_documents d2 ON d2.id = v.document_id WHERE v.id = _version;
  IF d.slug IS NULL THEN RAISE EXCEPTION 'Unknown agreement'; END IF;
  SELECT * INTO cur FROM public.legal_current_version(d.slug);
  IF cur.id IS NULL OR cur.id <> _version OR cur.content_hash <> _hash THEN
    RAISE EXCEPTION 'This agreement has been updated. Please review the current version.' USING ERRCODE = 'P0001';
  END IF;
  IF _workspace IS NOT NULL AND NOT EXISTS (SELECT 1 FROM spaces_members WHERE workspace_id = _workspace AND user_id = auth.uid()) THEN
    _workspace := NULL;
  END IF;
  INSERT INTO legal_acceptances(user_id, document_id, version_id, content_hash, method, workspace_id)
  VALUES (auth.uid(), cur.document_id, cur.id, cur.content_hash, _method, _workspace)
  ON CONFLICT (user_id, version_id) DO NOTHING RETURNING id INTO rid;
  RETURN rid;
END $$;

CREATE OR REPLACE FUNCTION public.legal_my_acceptances(_slug text)
RETURNS TABLE(version_id uuid, version text, content text, content_hash text, effective_date date, accepted_at timestamptz, method text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.version, v.content, a.content_hash, v.effective_date, a.accepted_at, a.method
  FROM legal_acceptances a JOIN legal_document_versions v ON v.id = a.version_id JOIN legal_documents d ON d.id = a.document_id
  WHERE d.slug = _slug AND a.user_id = auth.uid() ORDER BY a.accepted_at DESC
$$;

CREATE OR REPLACE FUNCTION public.legal_create_draft(_slug text, _version text, _content text, _reaccept boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE did uuid; vid uuid;
BEGIN
  IF NOT public.spaces_is_super(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT id INTO did FROM legal_documents WHERE slug = _slug;
  IF did IS NULL THEN RAISE EXCEPTION 'Unknown document'; END IF;
  INSERT INTO legal_document_versions(document_id, version, content, requires_reacceptance)
  VALUES (did, trim(_version), _content, _reaccept) RETURNING id INTO vid;
  RETURN vid;
END $$;

CREATE OR REPLACE FUNCTION public.legal_update_draft(_version uuid, _content text, _reaccept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.spaces_is_super(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE legal_document_versions SET content = _content, requires_reacceptance = _reaccept WHERE id = _version AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION 'Only drafts can be edited'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.legal_publish_version(_version uuid, _effective date, _hash text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v record;
BEGIN
  IF NOT public.spaces_is_super(auth.uid()) THEN RAISE EXCEPTION 'Only super admins can publish legal documents'; END IF;
  SELECT * INTO v FROM legal_document_versions WHERE id = _version FOR UPDATE;
  IF v.id IS NULL OR v.status <> 'draft' THEN RAISE EXCEPTION 'Only drafts can be published'; END IF;
  IF v.content_hash <> _hash THEN RAISE EXCEPTION 'The draft changed since you reviewed it'; END IF;
  IF _effective IS NULL THEN RAISE EXCEPTION 'Effective date required'; END IF;
  UPDATE legal_document_versions SET status = 'published', effective_date = _effective, published_at = now(),
    approved_by = auth.uid(), approval_note = nullif(trim(_note), '') WHERE id = _version;
END $$;

CREATE OR REPLACE FUNCTION public.legal_admin_overview(_slug text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT jsonb_build_object(
    'versions', coalesce((SELECT jsonb_agg(jsonb_build_object('id', v.id, 'version', v.version, 'status', v.status,
        'content', v.content, 'content_hash', v.content_hash, 'effective_date', v.effective_date, 'published_at', v.published_at,
        'requires_reacceptance', v.requires_reacceptance, 'approval_note', v.approval_note, 'created_at', v.created_at,
        'acceptances', (SELECT count(*) FROM legal_acceptances a WHERE a.version_id = v.id)) ORDER BY v.created_at DESC)
      FROM legal_document_versions v JOIN legal_documents d ON d.id = v.document_id WHERE d.slug = _slug), '[]'::jsonb),
    'customers', (SELECT count(DISTINCT user_id) FROM spaces_members),
    'pending', coalesce((SELECT jsonb_agg(jsonb_build_object('user_id', m.user_id, 'email', u.email))
      FROM (SELECT DISTINCT user_id FROM spaces_members) m JOIN auth.users u ON u.id = m.user_id
      WHERE public.legal_needs_acceptance(_slug, m.user_id)), '[]'::jsonb)
  ) INTO r;
  RETURN r;
END $$;

REVOKE EXECUTE ON FUNCTION public.legal_needs_acceptance(text, uuid), public.legal_accept(uuid, text, text, uuid),
  public.legal_my_acceptances(text), public.legal_create_draft(text, text, text, boolean), public.legal_update_draft(uuid, text, boolean),
  public.legal_publish_version(uuid, date, text, text), public.legal_admin_overview(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.legal_current_version(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.legal_needs_acceptance(text, uuid), public.legal_accept(uuid, text, text, uuid),
  public.legal_my_acceptances(text), public.legal_create_draft(text, text, text, boolean), public.legal_update_draft(uuid, text, boolean),
  public.legal_publish_version(uuid, date, text, text), public.legal_admin_overview(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.legal_needs_acceptance(text, uuid) TO service_role;

INSERT INTO public.legal_documents(slug, title) VALUES ('spaces-hosting', 'Loumilab Spaces Hosting & Acceptable Use Agreement');