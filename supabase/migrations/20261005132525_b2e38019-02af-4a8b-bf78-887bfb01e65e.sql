ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS relationship text
  CHECK (relationship IS NULL OR relationship IN ('owner','manager'));

-- Backfill relationship from approved claims and visitor submissions.
UPDATE public.merchants m SET relationship = CASE WHEN c.role ILIKE '%owner%' THEN 'owner' ELSE 'manager' END
FROM public.local_claims c JOIN public.merchant_local_profiles p ON p.id = c.profile_id
WHERE p.merchant_id = m.id AND c.status = 'approved' AND m.relationship IS NULL;

UPDATE public.merchants m SET relationship = CASE WHEN lc.submitter_affiliation = 'owner' THEN 'owner' ELSE 'manager' END
FROM public.local_candidates lc
WHERE lower(lc.submitter_email) = lower(m.contact_email)
  AND lc.submitter_affiliation IN ('owner','manager') AND m.relationship IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, nullif(btrim(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), ''))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

UPDATE public.profiles p
SET display_name = nullif(btrim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), '')
FROM auth.users u WHERE u.id = p.user_id AND (p.display_name IS NULL OR btrim(p.display_name) = '');

CREATE OR REPLACE FUNCTION public.admin_merchant_directory()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT coalesce(jsonb_agg(row_to_json(r) ORDER BY r.signup_at DESC), '[]'::jsonb) INTO result FROM (
    SELECT
      u.id AS user_id, u.email AS account_email, u.created_at AS signup_at,
      u.email_confirmed_at, u.last_sign_in_at,
      pr.display_name,
      m.id AS merchant_id, m.business_name, m.contact_name, m.contact_email, m.phone,
      m.address_line1, m.address_line2, m.city, m.region, m.postal_code, m.country,
      m.relationship, m.plan_slug, m.accepting_orders, m.created_at AS merchant_created_at,
      s.name AS store_name, s.slug AS store_slug, s.status::text AS store_status, s.is_published,
      lp.slug AS listing_slug, lp.is_listed, lp.ownership_status AS listing_ownership,
      lp.public_phone, lp.public_email, lp.website_url,
      lp.city AS listing_city, lp.region AS listing_region,
      sa.payout_status::text AS payout_status,
      EXISTS (SELECT 1 FROM public.newsletter_subscribers n WHERE lower(n.email) = lower(u.email)) AS subscribed,
      EXISTS (SELECT 1 FROM public.suppressed_emails x WHERE lower(x.email) = lower(u.email)) AS suppressed
    FROM auth.users u
    LEFT JOIN public.profiles pr ON pr.user_id = u.id
    LEFT JOIN LATERAL (SELECT * FROM public.merchants mm WHERE mm.owner_id = u.id ORDER BY mm.created_at LIMIT 1) m ON true
    LEFT JOIN LATERAL (SELECT * FROM public.merchant_storefronts ss WHERE ss.merchant_id = m.id ORDER BY ss.is_published DESC, ss.created_at LIMIT 1) s ON true
    LEFT JOIN LATERAL (SELECT * FROM public.merchant_local_profiles ll WHERE ll.merchant_id = m.id LIMIT 1) lp ON true
    LEFT JOIN LATERAL (SELECT * FROM public.merchant_stripe_accounts aa WHERE aa.merchant_id = m.id ORDER BY aa.livemode DESC LIMIT 1) sa ON true
  ) r;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_merchant_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_merchant_directory() TO authenticated;