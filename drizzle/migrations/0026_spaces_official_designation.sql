CREATE TABLE public.spaces_verifier_grants (
  user_id uuid PRIMARY KEY,
  granted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.spaces_verifier_grants TO service_role;
GRANT SELECT ON public.spaces_verifier_grants TO authenticated;
ALTER TABLE public.spaces_verifier_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY verifier_grants_read ON public.spaces_verifier_grants FOR SELECT TO authenticated
  USING (public.has_admin_role(auth.uid(),'super_admin') OR user_id = auth.uid());

CREATE TABLE public.spaces_official_designations (
  app_id uuid PRIMARY KEY REFERENCES public.spaces_apps(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  ownership_ref text NOT NULL,
  responsible text NOT NULL,
  note text,
  verified_by uuid NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid,
  revoked_at timestamptz
);
GRANT ALL ON public.spaces_official_designations TO service_role;
GRANT SELECT ON public.spaces_official_designations TO authenticated;
ALTER TABLE public.spaces_official_designations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.spaces_designation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('granted','revoked','verifier_added','verifier_removed','name_approved')),
  actor_id uuid NOT NULL,
  note text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.spaces_designation_events TO service_role;
GRANT SELECT ON public.spaces_designation_events TO authenticated;
ALTER TABLE public.spaces_designation_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.spaces_reserved_name_approvals (
  slug text PRIMARY KEY,
  workspace_id uuid NOT NULL,
  approved_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.spaces_reserved_name_approvals TO service_role;
GRANT SELECT ON public.spaces_reserved_name_approvals TO authenticated;
ALTER TABLE public.spaces_reserved_name_approvals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.spaces_can_verify(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_admin_role(_uid,'super_admin') OR EXISTS (SELECT 1 FROM public.spaces_verifier_grants WHERE user_id = _uid)
$$;

CREATE POLICY designations_staff_read ON public.spaces_official_designations FOR SELECT TO authenticated USING (public.spaces_can_verify(auth.uid()));
CREATE POLICY designation_events_staff_read ON public.spaces_designation_events FOR SELECT TO authenticated USING (public.spaces_can_verify(auth.uid()));
CREATE POLICY reserved_names_staff_read ON public.spaces_reserved_name_approvals FOR SELECT TO authenticated USING (public.spaces_can_verify(auth.uid()));

CREATE OR REPLACE FUNCTION public.spaces_app_designation(_app_id uuid)
RETURNS TABLE(official boolean, product_name text, verified_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (d.app_id IS NOT NULL AND d.revoked_at IS NULL), CASE WHEN d.revoked_at IS NULL THEN d.product_name END, CASE WHEN d.revoked_at IS NULL THEN d.verified_at END
  FROM (SELECT _app_id AS id) a LEFT JOIN public.spaces_official_designations d ON d.app_id = a.id
  WHERE public.spaces_can_view_app(_app_id, auth.uid()) OR public.spaces_can_verify(auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.spaces_grant_official(_app_id uuid, _product text, _ownership_ref text, _responsible text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF NOT public.spaces_can_verify(uid) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF coalesce(trim(_product),'')='' OR coalesce(trim(_ownership_ref),'')='' OR coalesce(trim(_responsible),'')='' OR coalesce(trim(_note),'')='' THEN
    RAISE EXCEPTION 'Product, ownership record, responsible person and note are required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM spaces_apps WHERE id=_app_id) THEN RAISE EXCEPTION 'App not found'; END IF;
  INSERT INTO spaces_official_designations(app_id,product_name,ownership_ref,responsible,note,verified_by,verified_at,revoked_by,revoked_at)
  VALUES (_app_id,trim(_product),trim(_ownership_ref),trim(_responsible),trim(_note),uid,now(),null,null)
  ON CONFLICT (app_id) DO UPDATE SET product_name=excluded.product_name, ownership_ref=excluded.ownership_ref, responsible=excluded.responsible,
    note=excluded.note, verified_by=uid, verified_at=now(), revoked_by=null, revoked_at=null;
  INSERT INTO spaces_designation_events(app_id,action,actor_id,note,details) VALUES (_app_id,'granted',uid,_note,jsonb_build_object('product',_product,'ownership_ref',_ownership_ref));
  INSERT INTO audit_logs(actor_id,action,target_type,target_id,reason,new_value) VALUES (uid,'spaces.official.grant','spaces_app',_app_id::text,_note,jsonb_build_object('product',_product));
END $$;

CREATE OR REPLACE FUNCTION public.spaces_revoke_official(_app_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF NOT public.spaces_can_verify(uid) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF coalesce(trim(_note),'')='' THEN RAISE EXCEPTION 'A note is required'; END IF;
  UPDATE spaces_official_designations SET revoked_by=uid, revoked_at=now() WHERE app_id=_app_id AND revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'This app is not currently official'; END IF;
  INSERT INTO spaces_designation_events(app_id,action,actor_id,note) VALUES (_app_id,'revoked',uid,_note);
  INSERT INTO audit_logs(actor_id,action,target_type,target_id,reason) VALUES (uid,'spaces.official.revoke','spaces_app',_app_id::text,_note);
END $$;

CREATE OR REPLACE FUNCTION public.spaces_set_verifier(_user_email text, _allow boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); target uuid;
BEGIN
  IF NOT public.has_admin_role(uid,'super_admin') THEN RAISE EXCEPTION 'Only super admins can change verifiers'; END IF;
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
  WHERE public.has_admin_role(auth.uid(),'super_admin') ORDER BY g.created_at
$$;

CREATE OR REPLACE FUNCTION public.spaces_admin_projects()
RETURNS TABLE(app_id uuid, name text, slug text, workspace_name text, owner_email text, created_at timestamptz,
  official boolean, product_name text, ownership_ref text, responsible text, verified_at timestamptz, revoked_at timestamptz, reserved_name_ok boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.name, a.slug, w.name, u.email::text, a.created_at,
    (d.app_id IS NOT NULL AND d.revoked_at IS NULL), d.product_name, d.ownership_ref, d.responsible, d.verified_at, d.revoked_at,
    EXISTS (SELECT 1 FROM spaces_reserved_name_approvals r WHERE r.slug=a.slug)
  FROM spaces_apps a LEFT JOIN spaces_workspaces w ON w.id=a.workspace_id LEFT JOIN auth.users u ON u.id=a.created_by
  LEFT JOIN spaces_official_designations d ON d.app_id=a.id
  WHERE public.spaces_can_verify(auth.uid()) ORDER BY a.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.spaces_approve_reserved_name(_slug text, _app_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); ws uuid;
BEGIN
  IF NOT public.has_admin_role(uid,'super_admin') THEN RAISE EXCEPTION 'Only super admins can approve reserved names'; END IF;
  SELECT workspace_id INTO ws FROM spaces_apps WHERE id=_app_id;
  IF ws IS NULL THEN RAISE EXCEPTION 'App not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM spaces_official_designations WHERE app_id=_app_id AND revoked_at IS NULL) THEN RAISE EXCEPTION 'Only official projects can use reserved names'; END IF;
  INSERT INTO spaces_reserved_name_approvals(slug,workspace_id,approved_by) VALUES (lower(trim(_slug)),ws,uid)
  ON CONFLICT (slug) DO UPDATE SET workspace_id=excluded.workspace_id, approved_by=uid, created_at=now();
  INSERT INTO spaces_designation_events(app_id,action,actor_id,details) VALUES (_app_id,'name_approved',uid,jsonb_build_object('slug',_slug));
  INSERT INTO audit_logs(actor_id,action,target_type,target_id,new_value) VALUES (uid,'spaces.reserved_name.approve','spaces_app',_app_id::text,jsonb_build_object('slug',_slug));
END $$;

CREATE OR REPLACE FUNCTION public.guard_customer_slug()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare s text := lower(new.slug);
begin
  if s is null then return new; end if;
  if tg_op = 'UPDATE' and new.slug is not distinct from old.slug then return new; end if;
  if s = any (array['www','app','apps','admin','api','mail','email','smtp','imap','ftp','cdn','static','assets','spaces','orders','local','help','support','status','docs','blog','news','the-dot','thedot','resources','store','shop','auth','login','sign-in','signup','account','dashboard','billing','pay','payments','checkout','dev','staging','preview','test','loumilab','vurtti','id','m','click','notify','send','rsend']) then
    if not (tg_table_name = 'spaces_apps' and exists (select 1 from spaces_reserved_name_approvals r where r.slug = s and r.workspace_id = new.workspace_id)) then
      raise exception 'That name is reserved. Please choose another.';
    end if;
  end if;
  if tg_table_name = 'spaces_apps' and (exists (select 1 from merchant_storefronts where slug = s) or exists (select 1 from merchant_local_profiles where slug = s)) then
    raise exception 'That name is already taken.';
  end if;
  if tg_table_name in ('merchant_storefronts','merchant_local_profiles') and exists (select 1 from spaces_apps where slug = s) then
    raise exception 'That name is already taken.';
  end if;
  return new;
end $function$;

REVOKE ALL ON FUNCTION public.spaces_grant_official(uuid,text,text,text,text), public.spaces_revoke_official(uuid,text), public.spaces_set_verifier(text,boolean), public.spaces_approve_reserved_name(text,uuid), public.spaces_list_verifiers(), public.spaces_admin_projects() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.spaces_grant_official(uuid,text,text,text,text), public.spaces_revoke_official(uuid,text), public.spaces_set_verifier(text,boolean), public.spaces_approve_reserved_name(text,uuid), public.spaces_list_verifiers(), public.spaces_admin_projects(), public.spaces_app_designation(uuid), public.spaces_can_verify(uuid) TO authenticated;