
CREATE TABLE public.spaces_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.spaces_members (
  workspace_id uuid NOT NULL REFERENCES public.spaces_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','admin','developer','viewer')),
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE TABLE public.spaces_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.spaces_workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','developer','viewer')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.spaces_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.spaces_workspaces(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description text CHECK (char_length(description) <= 500),
  built_with text NOT NULL DEFAULT 'unspecified' CHECK (built_with IN ('traditional','ai-assisted','hybrid','open-source','unspecified')),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','workspace','link')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  tags text[] NOT NULL DEFAULT '{}',
  folder text CHECK (char_length(folder) <= 60),
  current_version_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.spaces_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.spaces_apps(id) ON DELETE CASCADE,
  number integer NOT NULL,
  status text NOT NULL CHECK (status IN ('ready','failed')),
  file_count integer NOT NULL DEFAULT 0,
  total_bytes bigint NOT NULL DEFAULT 0,
  manifest jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_id, number)
);
ALTER TABLE public.spaces_apps ADD CONSTRAINT spaces_apps_current_fk FOREIGN KEY (current_version_id) REFERENCES public.spaces_versions(id) ON DELETE SET NULL;
CREATE TABLE public.spaces_passport_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.spaces_apps(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  kind text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.spaces_passport_events(app_id, created_at DESC);
CREATE TABLE public.spaces_favorites (
  user_id uuid NOT NULL,
  app_id uuid NOT NULL REFERENCES public.spaces_apps(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, app_id)
);

GRANT SELECT ON public.spaces_workspaces, public.spaces_members, public.spaces_invites, public.spaces_versions, public.spaces_passport_events TO authenticated;
GRANT SELECT, UPDATE ON public.spaces_workspaces TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.spaces_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spaces_apps TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.spaces_favorites TO authenticated;
GRANT ALL ON public.spaces_workspaces, public.spaces_members, public.spaces_invites, public.spaces_apps, public.spaces_versions, public.spaces_passport_events, public.spaces_favorites TO service_role;

ALTER TABLE public.spaces_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces_passport_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces_favorites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.spaces_rank(_role text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _role WHEN 'owner' THEN 4 WHEN 'admin' THEN 3 WHEN 'developer' THEN 2 WHEN 'viewer' THEN 1 ELSE 0 END $$;

CREATE OR REPLACE FUNCTION public.spaces_role_rank(_ws uuid, _uid uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT public.spaces_rank(role) FROM public.spaces_members WHERE workspace_id = _ws AND user_id = _uid), 0) $$;

-- Can open/use the app (Library visibility)
CREATE OR REPLACE FUNCTION public.spaces_can_view_app(_app uuid, _uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.spaces_apps a WHERE a.id = _app AND (
    public.spaces_role_rank(a.workspace_id, _uid) >= 3
    OR a.created_by = _uid AND public.spaces_role_rank(a.workspace_id, _uid) >= 1
    OR (a.visibility IN ('workspace','link') AND public.spaces_role_rank(a.workspace_id, _uid) >= 1))) $$;

-- Can update/export/configure
CREATE OR REPLACE FUNCTION public.spaces_can_manage_app(_app uuid, _uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.spaces_apps a WHERE a.id = _app AND (
    public.spaces_role_rank(a.workspace_id, _uid) >= 3
    OR (public.spaces_role_rank(a.workspace_id, _uid) = 2 AND (a.created_by = _uid OR a.visibility <> 'private')))) $$;

CREATE POLICY ws_select ON public.spaces_workspaces FOR SELECT TO authenticated USING (public.spaces_role_rank(id, auth.uid()) >= 1);
CREATE POLICY ws_update ON public.spaces_workspaces FOR UPDATE TO authenticated USING (public.spaces_role_rank(id, auth.uid()) >= 3) WITH CHECK (public.spaces_role_rank(id, auth.uid()) >= 3);

CREATE POLICY mem_select ON public.spaces_members FOR SELECT TO authenticated USING (public.spaces_role_rank(workspace_id, auth.uid()) >= 1);
CREATE POLICY mem_update ON public.spaces_members FOR UPDATE TO authenticated
  USING (public.spaces_role_rank(workspace_id, auth.uid()) >= 3 AND role <> 'owner')
  WITH CHECK (role <> 'owner' AND public.spaces_rank(role) < public.spaces_role_rank(workspace_id, auth.uid()) + CASE WHEN public.spaces_role_rank(workspace_id, auth.uid()) = 4 THEN 1 ELSE 0 END);
CREATE POLICY mem_delete ON public.spaces_members FOR DELETE TO authenticated
  USING (role <> 'owner' AND (user_id = auth.uid() OR public.spaces_role_rank(workspace_id, auth.uid()) >= 3));

CREATE POLICY inv_select ON public.spaces_invites FOR SELECT TO authenticated USING (public.spaces_role_rank(workspace_id, auth.uid()) >= 3);

CREATE POLICY app_select ON public.spaces_apps FOR SELECT TO authenticated USING (public.spaces_can_view_app(id, auth.uid()));
CREATE POLICY app_insert ON public.spaces_apps FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.spaces_role_rank(workspace_id, auth.uid()) >= 2 AND current_version_id IS NULL);
CREATE POLICY app_update ON public.spaces_apps FOR UPDATE TO authenticated USING (public.spaces_can_manage_app(id, auth.uid())) WITH CHECK (public.spaces_role_rank(workspace_id, auth.uid()) >= 2);
CREATE POLICY app_delete ON public.spaces_apps FOR DELETE TO authenticated USING (public.spaces_role_rank(workspace_id, auth.uid()) >= 3);

CREATE POLICY ver_select ON public.spaces_versions FOR SELECT TO authenticated USING (public.spaces_can_view_app(app_id, auth.uid()));
CREATE POLICY pass_select ON public.spaces_passport_events FOR SELECT TO authenticated USING (public.spaces_can_view_app(app_id, auth.uid()));
CREATE POLICY fav_all ON public.spaces_favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.spaces_can_view_app(app_id, auth.uid()));

-- Guard app updates: only the deploy function may change identity/version pointers; workspace can't move.
CREATE OR REPLACE FUNCTION public.spaces_app_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id <> OLD.id OR NEW.workspace_id <> OLD.workspace_id OR NEW.created_by <> OLD.created_by OR NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Immutable app fields'; END IF;
    IF NEW.current_version_id IS DISTINCT FROM OLD.current_version_id AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'Versions change only through deploy'; END IF;
    IF NEW.slug <> OLD.slug AND OLD.current_version_id IS NOT NULL AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'Address cannot change after the first deploy'; END IF;
    NEW.updated_at := now();
    INSERT INTO public.spaces_passport_events(app_id, workspace_id, kind, detail, actor_id)
    VALUES (NEW.id, NEW.workspace_id, 'updated', jsonb_build_object(
      'name', CASE WHEN NEW.name <> OLD.name THEN NEW.name END,
      'visibility', CASE WHEN NEW.visibility <> OLD.visibility THEN NEW.visibility END,
      'status', CASE WHEN NEW.status <> OLD.status THEN NEW.status END,
      'version', CASE WHEN NEW.current_version_id IS DISTINCT FROM OLD.current_version_id THEN NEW.current_version_id END), auth.uid());
  ELSE
    INSERT INTO public.spaces_passport_events(app_id, workspace_id, kind, detail, actor_id)
    VALUES (NEW.id, NEW.workspace_id, 'created', jsonb_build_object('name', NEW.name, 'slug', NEW.slug, 'built_with', NEW.built_with), auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER spaces_app_guard_upd BEFORE UPDATE ON public.spaces_apps FOR EACH ROW EXECUTE FUNCTION public.spaces_app_guard();
CREATE TRIGGER spaces_app_guard_ins AFTER INSERT ON public.spaces_apps FOR EACH ROW EXECUTE FUNCTION public.spaces_app_guard();

CREATE OR REPLACE FUNCTION public.spaces_create_workspace(_name text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF (SELECT count(*) FROM public.spaces_workspaces WHERE owner_id = _uid) >= 10 THEN RAISE EXCEPTION 'Workspace limit reached'; END IF;
  INSERT INTO public.spaces_workspaces(name, owner_id) VALUES (left(trim(_name), 80), _uid) RETURNING id INTO _id;
  INSERT INTO public.spaces_members(workspace_id, user_id, role, email) VALUES (_id, _uid, 'owner', (SELECT email FROM auth.users WHERE id = _uid));
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.spaces_create_invite(_ws uuid, _email text, _role text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _token text := encode(extensions.gen_random_bytes(24), 'hex');
BEGIN
  IF public.spaces_role_rank(_ws, auth.uid()) < 3 THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _role NOT IN ('admin','developer','viewer') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF _role = 'admin' AND public.spaces_role_rank(_ws, auth.uid()) < 4 THEN RAISE EXCEPTION 'Only the owner can invite admins'; END IF;
  IF _email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Invalid email'; END IF;
  INSERT INTO public.spaces_invites(workspace_id, email, role, token_hash, invited_by)
  VALUES (_ws, lower(trim(_email)), _role, encode(extensions.digest(_token, 'sha256'), 'hex'), auth.uid());
  RETURN _token;
END $$;

CREATE OR REPLACE FUNCTION public.spaces_accept_invite(_token text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _inv public.spaces_invites; _email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO _inv FROM public.spaces_invites WHERE token_hash = encode(extensions.digest(_token, 'sha256'), 'hex') FOR UPDATE;
  IF _inv.id IS NULL OR _inv.accepted_at IS NOT NULL OR _inv.expires_at < now() THEN RAISE EXCEPTION 'This invite is no longer valid'; END IF;
  SELECT lower(email) INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email <> _inv.email THEN RAISE EXCEPTION 'This invite was sent to a different email address'; END IF;
  INSERT INTO public.spaces_members(workspace_id, user_id, role, email) VALUES (_inv.workspace_id, auth.uid(), _inv.role, _email)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  UPDATE public.spaces_invites SET accepted_at = now() WHERE id = _inv.id;
  RETURN _inv.workspace_id;
END $$;

REVOKE ALL ON FUNCTION public.spaces_create_workspace(text), public.spaces_create_invite(uuid,text,text), public.spaces_accept_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spaces_create_workspace(text), public.spaces_create_invite(uuid,text,text), public.spaces_accept_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spaces_role_rank(uuid,uuid), public.spaces_can_view_app(uuid,uuid), public.spaces_can_manage_app(uuid,uuid), public.spaces_rank(text) TO authenticated, service_role;

-- Storage: developers may upload ZIPs only into uploads/<app_id>/ for apps they manage.
CREATE POLICY spaces_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'spaces-artifacts' AND (storage.foldername(name))[1] = 'uploads'
    AND public.spaces_can_manage_app(((storage.foldername(name))[2])::uuid, auth.uid()));
