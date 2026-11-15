CREATE OR REPLACE FUNCTION public.spaces_is_super(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_admin_role(_uid,'super_admin') OR public.has_role(_uid,'admin')
$$;
GRANT EXECUTE ON FUNCTION public.spaces_is_super(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.spaces_can_verify(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.spaces_is_super(_uid) OR EXISTS (SELECT 1 FROM public.spaces_verifier_grants WHERE user_id = _uid)
$$;

DROP POLICY verifier_grants_read ON public.spaces_verifier_grants;
CREATE POLICY verifier_grants_read ON public.spaces_verifier_grants FOR SELECT TO authenticated
  USING (public.spaces_is_super(auth.uid()) OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.spaces_set_verifier(_user_email text, _allow boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); target uuid;
BEGIN
  IF NOT public.spaces_is_super(uid) THEN RAISE EXCEPTION 'Only super admins can change verifiers'; END IF;
  SELECT id INTO target FROM auth.users WHERE lower(email)=lower(trim(_user_email));
  IF target IS NULL THEN RAISE EXCEPTION 'No account with that email'; END IF;
  IF _allow THEN INSERT INTO spaces_verifier_grants(user_id,granted_by) VALUES (target,uid) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM spaces_verifier_grants WHERE user_id=target; END IF;
  INSERT INTO audit_logs(actor_id,action,target_type,target_id,new_value) VALUES (uid, CASE WHEN _allow THEN 'spaces.verifier.add' ELSE 'spaces.verifier.remove' END,'user',target::text,jsonb_build_object('email',_user_email));
END $$;

CREATE OR REPLACE FUNCTION public.spaces_list_verifiers()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.user_id, u.email::text, g.created_at FROM spaces_verifier_grants g JOIN auth.users u ON u.id=g.user_id
  WHERE public.spaces_is_super(auth.uid()) ORDER BY g.created_at
$$;

CREATE OR REPLACE FUNCTION public.spaces_approve_reserved_name(_slug text, _app_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); ws uuid;
BEGIN
  IF NOT public.spaces_is_super(uid) THEN RAISE EXCEPTION 'Only super admins can approve reserved names'; END IF;
  SELECT workspace_id INTO ws FROM spaces_apps WHERE id=_app_id;
  IF ws IS NULL THEN RAISE EXCEPTION 'App not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM spaces_official_designations WHERE app_id=_app_id AND revoked_at IS NULL) THEN RAISE EXCEPTION 'Only official projects can use reserved names'; END IF;
  INSERT INTO spaces_reserved_name_approvals(slug,workspace_id,approved_by) VALUES (lower(trim(_slug)),ws,uid)
  ON CONFLICT (slug) DO UPDATE SET workspace_id=excluded.workspace_id, approved_by=uid, created_at=now();
  INSERT INTO spaces_designation_events(app_id,action,actor_id,details) VALUES (_app_id,'name_approved',uid,jsonb_build_object('slug',_slug));
  INSERT INTO audit_logs(actor_id,action,target_type,target_id,new_value) VALUES (uid,'spaces.reserved_name.approve','spaces_app',_app_id::text,jsonb_build_object('slug',_slug));
END $$;