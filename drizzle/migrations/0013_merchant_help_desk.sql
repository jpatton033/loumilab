CREATE TABLE public.support_staff (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  level text NOT NULL CHECK (level IN ('viewer','specialist','admin')),
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.support_staff TO authenticated;
GRANT ALL ON public.support_staff TO service_role;
ALTER TABLE public.support_staff ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.support_level(_uid uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _uid IS NULL THEN 0
    WHEN public.has_role(_uid,'admin') OR public.has_admin_role(_uid,'super_admin') THEN 3
    ELSE COALESCE((SELECT CASE level WHEN 'admin' THEN 3 WHEN 'specialist' THEN 2 ELSE 1 END FROM public.support_staff WHERE user_id = _uid), 0)
  END
$$;
REVOKE EXECUTE ON FUNCTION public.support_level(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.support_level(uuid) TO authenticated;

CREATE POLICY "Support staff view team" ON public.support_staff FOR SELECT TO authenticated
  USING (public.support_level(auth.uid()) >= 1);

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = _user_id);
$$;

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  topic text NOT NULL CHECK (topic IN ('setup','storefront','payments','orders','calendar','other')),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','open','waiting','resolved')),
  assignee_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.support_tickets (merchant_id);
CREATE INDEX ON public.support_tickets (status);
GRANT SELECT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and support read tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (public.support_level(auth.uid()) >= 1 OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE TABLE public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_kind text NOT NULL CHECK (author_kind IN ('merchant','staff')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.support_ticket_messages (ticket_id);
GRANT SELECT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and support read messages" ON public.support_ticket_messages FOR SELECT TO authenticated
  USING (public.support_level(auth.uid()) >= 1 OR EXISTS (
    SELECT 1 FROM public.support_tickets t JOIN public.merchants m ON m.id = t.merchant_id
    WHERE t.id = ticket_id AND m.owner_id = auth.uid()));

CREATE TABLE public.support_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  scopes text[] NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('requested','active','revoked','declined')),
  requested_by uuid,
  granted_by uuid,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.support_access_grants (merchant_id);
GRANT SELECT ON public.support_access_grants TO authenticated;
GRANT ALL ON public.support_access_grants TO service_role;
ALTER TABLE public.support_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and support read grants" ON public.support_access_grants FOR SELECT TO authenticated
  USING (public.support_level(auth.uid()) >= 1 OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

-- Internal audit writer (real actor and role, server-side)
CREATE OR REPLACE FUNCTION public.support_audit(_action text, _merchant uuid, _old jsonb, _new jsonb, _reason text, _meta jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lvl int := public.support_level(auth.uid());
BEGIN
  INSERT INTO public.audit_logs(actor_id, actor_email, actor_role, action, target_type, target_id, old_value, new_value, reason, metadata)
  VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()),
    CASE WHEN EXISTS (SELECT 1 FROM public.merchants WHERE id=_merchant AND owner_id=auth.uid()) AND _lvl = 0 THEN 'merchant'
         WHEN _lvl=3 THEN 'support_admin' WHEN _lvl=2 THEN 'support_specialist' WHEN _lvl=1 THEN 'support_viewer' ELSE 'system' END,
    _action, 'merchant', _merchant::text, _old, _new, _reason, _meta);
END $$;
REVOKE EXECUTE ON FUNCTION public.support_audit(text,uuid,jsonb,jsonb,text,jsonb) FROM PUBLIC, authenticated, anon;

-- Merchant: open ticket
CREATE OR REPLACE FUNCTION public.merchant_open_ticket(_topic text, _subject text, _body text, _grant_hours integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m uuid; _t uuid;
BEGIN
  SELECT id INTO _m FROM public.merchants WHERE owner_id = auth.uid() LIMIT 1;
  IF _m IS NULL THEN RAISE EXCEPTION 'No merchant account'; END IF;
  IF NOT public.check_and_increment_rate_limit('ticket:'||auth.uid(), 10, 86400) THEN RAISE EXCEPTION 'Too many requests today'; END IF;
  INSERT INTO public.support_tickets(merchant_id, opened_by, topic, subject) VALUES (_m, auth.uid(), _topic, left(trim(_subject),160)) RETURNING id INTO _t;
  INSERT INTO public.support_ticket_messages(ticket_id, author_id, author_kind, body) VALUES (_t, auth.uid(), 'merchant', trim(_body));
  IF _grant_hours IN (1,24,168) THEN
    INSERT INTO public.support_access_grants(merchant_id, ticket_id, scopes, status, granted_by, expires_at)
    VALUES (_m, _t, ARRAY['store_details','fulfilment','catalog','local_listing'], 'active', auth.uid(), now() + make_interval(hours => _grant_hours));
    PERFORM public.support_audit('support.grant_created', _m, NULL, jsonb_build_object('hours',_grant_hours), NULL, jsonb_build_object('ticket',_t));
  END IF;
  RETURN _t;
END $$;

CREATE OR REPLACE FUNCTION public.support_reply(_ticket uuid, _body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.support_tickets; _owner boolean; _lvl int := public.support_level(auth.uid());
BEGIN
  SELECT * INTO _t FROM public.support_tickets WHERE id = _ticket;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  _owner := EXISTS (SELECT 1 FROM public.merchants WHERE id=_t.merchant_id AND owner_id=auth.uid());
  IF NOT _owner AND _lvl < 1 THEN RAISE EXCEPTION 'Not allowed'; END IF;
  INSERT INTO public.support_ticket_messages(ticket_id, author_id, author_kind, body)
  VALUES (_ticket, auth.uid(), CASE WHEN _owner AND _lvl=0 THEN 'merchant' ELSE 'staff' END, trim(_body));
  UPDATE public.support_tickets SET updated_at = now(),
    status = CASE WHEN _owner AND _lvl=0 THEN (CASE WHEN status='resolved' OR status='waiting' THEN 'open' ELSE status END)
                  ELSE (CASE WHEN status='new' THEN 'open' ELSE status END) END
  WHERE id = _ticket;
END $$;

CREATE OR REPLACE FUNCTION public.support_ticket_set_status(_ticket uuid, _status text, _assign_self boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.support_tickets;
BEGIN
  IF public.support_level(auth.uid()) < 1 THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT * INTO _t FROM public.support_tickets WHERE id=_ticket;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _status NOT IN ('new','open','waiting','resolved') THEN RAISE EXCEPTION 'Bad status'; END IF;
  UPDATE public.support_tickets SET status=_status, updated_at=now(),
    assignee_id = CASE WHEN _assign_self THEN auth.uid() ELSE assignee_id END WHERE id=_ticket;
  PERFORM public.support_audit('support.ticket_status', _t.merchant_id, jsonb_build_object('status',_t.status), jsonb_build_object('status',_status), NULL, jsonb_build_object('ticket',_ticket));
END $$;

-- Grants
CREATE OR REPLACE FUNCTION public.support_request_access(_merchant uuid, _ticket uuid, _scopes text[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _g uuid;
BEGIN
  IF public.support_level(auth.uid()) < 2 THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF NOT (_scopes <@ ARRAY['store_details','fulfilment','catalog','local_listing']) OR cardinality(_scopes)=0 THEN RAISE EXCEPTION 'Bad scopes'; END IF;
  INSERT INTO public.support_access_grants(merchant_id, ticket_id, scopes, status, requested_by)
  VALUES (_merchant, _ticket, _scopes, 'requested', auth.uid()) RETURNING id INTO _g;
  PERFORM public.support_audit('support.access_requested', _merchant, NULL, to_jsonb(_scopes), NULL, jsonb_build_object('grant',_g));
  RETURN _g;
END $$;

CREATE OR REPLACE FUNCTION public.merchant_decide_access(_grant uuid, _approve boolean, _hours integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _g public.support_access_grants;
BEGIN
  SELECT * INTO _g FROM public.support_access_grants WHERE id=_grant;
  IF _g.id IS NULL OR NOT EXISTS (SELECT 1 FROM public.merchants WHERE id=_g.merchant_id AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _g.status <> 'requested' THEN RAISE EXCEPTION 'Already decided'; END IF;
  IF _approve AND _hours NOT IN (1,24,168) THEN RAISE EXCEPTION 'Bad duration'; END IF;
  UPDATE public.support_access_grants SET status = CASE WHEN _approve THEN 'active' ELSE 'declined' END,
    granted_by = auth.uid(), expires_at = CASE WHEN _approve THEN now() + make_interval(hours => _hours) END WHERE id=_grant;
  PERFORM public.support_audit(CASE WHEN _approve THEN 'support.grant_created' ELSE 'support.grant_declined' END, _g.merchant_id, NULL, jsonb_build_object('hours',_hours,'scopes',_g.scopes), NULL, jsonb_build_object('grant',_grant));
END $$;

CREATE OR REPLACE FUNCTION public.revoke_support_access(_grant uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _g public.support_access_grants;
BEGIN
  SELECT * INTO _g FROM public.support_access_grants WHERE id=_grant;
  IF _g.id IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  IF NOT (public.support_level(auth.uid()) >= 3 OR EXISTS (SELECT 1 FROM public.merchants WHERE id=_g.merchant_id AND owner_id=auth.uid())) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.support_access_grants SET status='revoked', revoked_at=now(), revoked_by=auth.uid() WHERE id=_grant AND status IN ('active','requested');
  PERFORM public.support_audit('support.grant_revoked', _g.merchant_id, NULL, NULL, NULL, jsonb_build_object('grant',_grant));
END $$;

-- Safe overview (also used for View as Merchant)
CREATE OR REPLACE FUNCTION public.support_merchant_overview(_merchant uuid, _view_as boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r jsonb;
BEGIN
  IF public.support_level(auth.uid()) < 1 THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT jsonb_build_object(
    'merchant', (SELECT jsonb_build_object('id',m.id,'business_name',m.business_name,'contact_email',m.contact_email,'industry_slug',m.industry_slug,
        'plan_slug',m.plan_slug,'accepting_orders',m.accepting_orders,'created_at',m.created_at,
        'email_confirmed', (SELECT u.email_confirmed_at IS NOT NULL FROM auth.users u WHERE u.id=m.owner_id),
        'last_sign_in_at', (SELECT u.last_sign_in_at FROM auth.users u WHERE u.id=m.owner_id)) FROM public.merchants m WHERE m.id=_merchant),
    'storefront', (SELECT jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug,'status',s.status,'is_published',s.is_published,'location',s.location,
        'description',s.description,'hours',s.hours,'pickup_enabled',s.pickup_enabled,'pickup_info',s.pickup_info,'delivery_enabled',s.delivery_enabled,
        'delivery_fee_cents',s.delivery_fee_cents,'delivery_minimum_cents',s.delivery_minimum_cents,'logo_url',s.logo_url)
        FROM public.merchant_storefronts s WHERE s.merchant_id=_merchant ORDER BY s.created_at LIMIT 1),
    'products', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'description',p.description,'price_cents',p.price_cents,'availability',p.availability,'is_active',p.is_active) ORDER BY p.display_order)
        FROM public.merchant_products p WHERE p.merchant_id=_merchant), '[]'),
    'payouts', (SELECT jsonb_build_object('payout_status',a.payout_status,'details_submitted',a.details_submitted,'charges_enabled',a.charges_enabled,'payouts_enabled',a.payouts_enabled,'has_requirements', cardinality(COALESCE(a.requirements_due,'{}'))>0)
        FROM public.merchant_stripe_accounts a WHERE a.merchant_id=_merchant LIMIT 1),
    'local', (SELECT jsonb_build_object('is_listed',l.is_listed,'display_name',l.display_name,'tagline',l.tagline,'category',l.category,'hours_text',l.hours_text,'slug',l.slug)
        FROM public.merchant_local_profiles l WHERE l.merchant_id=_merchant LIMIT 1),
    'calendar', (SELECT jsonb_build_object('provider',c.provider,'connected',c.calendar_id IS NOT NULL,'reconnect_required',c.reconnect_required) FROM public.merchant_calendar_links c WHERE c.merchant_id=_merchant),
    'orders', jsonb_build_object('total',(SELECT count(*) FROM public.orders o WHERE o.merchant_id=_merchant),
        'last_order_at',(SELECT max(created_at) FROM public.orders o WHERE o.merchant_id=_merchant)),
    'grants', COALESCE((SELECT jsonb_agg(to_jsonb(g) ORDER BY g.created_at DESC) FROM public.support_access_grants g WHERE g.merchant_id=_merchant), '[]')
  ) INTO _r;
  IF _r->'merchant' IS NULL OR _r->'merchant' = 'null'::jsonb THEN RAISE EXCEPTION 'Not found'; END IF;
  PERFORM public.support_audit(CASE WHEN _view_as THEN 'support.view_as_merchant' ELSE 'support.view_merchant' END, _merchant, NULL, NULL, NULL, NULL);
  RETURN _r;
END $$;

-- Assisted change, scope-whitelisted
CREATE OR REPLACE FUNCTION public.support_apply_change(_merchant uuid, _scope text, _target uuid, _patch jsonb, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _allowed text[]; _k text; _old jsonb; _clean jsonb := '{}'::jsonb;
BEGIN
  IF public.support_level(auth.uid()) < 2 THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF coalesce(length(trim(_reason)),0) < 3 THEN RAISE EXCEPTION 'A reason is required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.support_access_grants WHERE merchant_id=_merchant AND status='active' AND expires_at > now() AND _scope = ANY(scopes)) THEN
    RAISE EXCEPTION 'The merchant has not granted access for this change';
  END IF;
  _allowed := CASE _scope
    WHEN 'store_details' THEN ARRAY['name','location','description','hours']
    WHEN 'fulfilment' THEN ARRAY['pickup_enabled','pickup_info','delivery_enabled','delivery_fee_cents','delivery_minimum_cents']
    WHEN 'catalog' THEN ARRAY['name','description','price_cents','availability','is_active']
    WHEN 'local_listing' THEN ARRAY['display_name','tagline','hours_text']
    ELSE NULL END;
  IF _allowed IS NULL THEN RAISE EXCEPTION 'Unknown scope'; END IF;
  FOR _k IN SELECT jsonb_object_keys(_patch) LOOP
    IF NOT (_k = ANY(_allowed)) THEN RAISE EXCEPTION 'Field % cannot be changed by support', _k; END IF;
    _clean := _clean || jsonb_build_object(_k, _patch->_k);
  END LOOP;
  IF _clean = '{}'::jsonb THEN RAISE EXCEPTION 'Nothing to change'; END IF;

  IF _scope IN ('store_details','fulfilment') THEN
    SELECT to_jsonb(s) INTO _old FROM public.merchant_storefronts s WHERE merchant_id=_merchant ORDER BY created_at LIMIT 1;
    IF _old IS NULL THEN RAISE EXCEPTION 'No storefront'; END IF;
    UPDATE public.merchant_storefronts s SET
      name = COALESCE(_clean->>'name', s.name),
      location = CASE WHEN _clean ? 'location' THEN _clean->>'location' ELSE s.location END,
      description = CASE WHEN _clean ? 'description' THEN _clean->>'description' ELSE s.description END,
      hours = CASE WHEN _clean ? 'hours' THEN _clean->>'hours' ELSE s.hours END,
      pickup_enabled = COALESCE((_clean->>'pickup_enabled')::boolean, s.pickup_enabled),
      pickup_info = CASE WHEN _clean ? 'pickup_info' THEN _clean->>'pickup_info' ELSE s.pickup_info END,
      delivery_enabled = COALESCE((_clean->>'delivery_enabled')::boolean, s.delivery_enabled),
      delivery_fee_cents = COALESCE(GREATEST(0,(_clean->>'delivery_fee_cents')::int), s.delivery_fee_cents),
      delivery_minimum_cents = COALESCE(GREATEST(0,(_clean->>'delivery_minimum_cents')::int), s.delivery_minimum_cents)
    WHERE s.id = (_old->>'id')::uuid;
  ELSIF _scope = 'catalog' THEN
    SELECT to_jsonb(p) INTO _old FROM public.merchant_products p WHERE p.id=_target AND p.merchant_id=_merchant;
    IF _old IS NULL THEN RAISE EXCEPTION 'Item not found'; END IF;
    UPDATE public.merchant_products p SET
      name = COALESCE(_clean->>'name', p.name),
      description = CASE WHEN _clean ? 'description' THEN _clean->>'description' ELSE p.description END,
      price_cents = COALESCE(GREATEST(0,(_clean->>'price_cents')::int), p.price_cents),
      availability = COALESCE(_clean->>'availability', p.availability),
      is_active = COALESCE((_clean->>'is_active')::boolean, p.is_active)
    WHERE p.id=_target;
  ELSE
    SELECT to_jsonb(l) INTO _old FROM public.merchant_local_profiles l WHERE merchant_id=_merchant LIMIT 1;
    IF _old IS NULL THEN RAISE EXCEPTION 'No Local listing'; END IF;
    UPDATE public.merchant_local_profiles l SET
      display_name = COALESCE(_clean->>'display_name', l.display_name),
      tagline = CASE WHEN _clean ? 'tagline' THEN _clean->>'tagline' ELSE l.tagline END,
      hours_text = CASE WHEN _clean ? 'hours_text' THEN _clean->>'hours_text' ELSE l.hours_text END
    WHERE l.id = (_old->>'id')::uuid;
  END IF;

  SELECT jsonb_object_agg(k, _old->k) INTO _old FROM jsonb_object_keys(_clean) k;
  PERFORM public.support_audit('support.change.'||_scope, _merchant, _old, _clean, trim(_reason), jsonb_build_object('target',_target));
END $$;

-- Team management
CREATE OR REPLACE FUNCTION public.support_set_staff(_email text, _level text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _old text;
BEGIN
  IF public.support_level(auth.uid()) < 3 THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT id INTO _uid FROM auth.users WHERE lower(email)=lower(trim(_email));
  IF _uid IS NULL THEN RAISE EXCEPTION 'No Loumilab account uses that email'; END IF;
  IF _uid = auth.uid() THEN RAISE EXCEPTION 'You cannot change your own access'; END IF;
  SELECT level INTO _old FROM public.support_staff WHERE user_id=_uid;
  IF _level IS NULL OR _level = 'none' THEN
    DELETE FROM public.support_staff WHERE user_id=_uid;
  ELSIF _level IN ('viewer','specialist','admin') THEN
    INSERT INTO public.support_staff(user_id,email,level,added_by) VALUES (_uid, lower(trim(_email)), _level, auth.uid())
    ON CONFLICT (user_id) DO UPDATE SET level=EXCLUDED.level;
  ELSE RAISE EXCEPTION 'Bad level'; END IF;
  INSERT INTO public.audit_logs(actor_id, actor_email, actor_role, action, target_type, target_id, old_value, new_value)
  VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id=auth.uid()), 'support_admin', 'support.staff_changed', 'user', _uid::text,
    jsonb_build_object('level',_old), jsonb_build_object('level',_level));
END $$;

DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['merchant_open_ticket(text,text,text,integer)','support_reply(uuid,text)','support_ticket_set_status(uuid,text,boolean)',
    'support_request_access(uuid,uuid,text[])','merchant_decide_access(uuid,boolean,integer)','revoke_support_access(uuid)',
    'support_merchant_overview(uuid,boolean)','support_apply_change(uuid,text,uuid,jsonb,text)','support_set_staff(text,text)'] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP; END $$;

-- Hardening existing access
DROP POLICY IF EXISTS "Owners update own merchant" ON public.merchants;
CREATE POLICY "Owners update own merchant" ON public.merchants FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.support_level(auth.uid()) >= 3)
  WITH CHECK (owner_id = auth.uid() OR public.support_level(auth.uid()) >= 3);

CREATE OR REPLACE FUNCTION public.guard_merchant_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id AND coalesce(auth.role(),'') <> 'service_role' AND current_user NOT IN ('postgres','supabase_admin') THEN
    RAISE EXCEPTION 'Account ownership cannot be changed here';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_merchant_owner ON public.merchants;
CREATE TRIGGER guard_merchant_owner BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.guard_merchant_owner();

DROP POLICY IF EXISTS "Owners view own connected account" ON public.merchant_stripe_accounts;
CREATE POLICY "Owners view own connected account" ON public.merchant_stripe_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid())
    OR public.support_level(auth.uid()) >= 3 OR public.is_finance_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff can append audit logs" ON public.audit_logs;
CREATE POLICY "Staff can append audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND actor_id = auth.uid());
