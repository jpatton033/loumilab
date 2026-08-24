-- ============ ADMIN PERMISSION TIERS ============
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'finance_admin', 'merchant_support', 'operations', 'analyst');

CREATE TABLE public.admin_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.admin_roles TO authenticated;
GRANT ALL ON public.admin_roles TO service_role;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid, _role public.admin_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_admin_role(uuid, public.admin_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_admin_role(uuid, public.admin_role) TO authenticated;

-- Any Loumilab staff member (legacy admin role or any admin tier)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = _user_id);
$$;

REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- Can this user touch money configuration (fees, plans, refunds)?
CREATE OR REPLACE FUNCTION public.is_finance_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      OR EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = _user_id AND role IN ('super_admin','finance_admin'));
$$;

REVOKE EXECUTE ON FUNCTION public.is_finance_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_finance_admin(uuid) TO authenticated;

CREATE POLICY "Users can view own admin roles" ON public.admin_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff can view admin roles" ON public.admin_roles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Super admins manage admin roles" ON public.admin_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_admin_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_admin_role(auth.uid(), 'super_admin'));

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  target_type text,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_target_idx ON public.audit_logs (target_type, target_id);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can append audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND actor_id = auth.uid());

-- ============ PLANS ============
CREATE TABLE public.orders_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  positioning text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price_label text,
  monthly_price_cents integer,
  annual_price_cents integer,
  annual_billing_active boolean NOT NULL DEFAULT false,
  annual_note text,
  platform_fee_bps integer,
  fee_label text,
  features text[] NOT NULL DEFAULT '{}',
  entitlements jsonb NOT NULL DEFAULT '{}'::jsonb,
  badge text,
  cta_label text NOT NULL DEFAULT 'Get started',
  cta_href text,
  cta_secondary_label text,
  cta_secondary_href text,
  requires_subscription boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  effective_from timestamptz NOT NULL DEFAULT now(),
  stripe_product_id text,
  stripe_price_monthly_id text,
  stripe_price_annual_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.orders_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders_plans TO authenticated;
GRANT ALL ON public.orders_plans TO service_role;
ALTER TABLE public.orders_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active public plans" ON public.orders_plans
  FOR SELECT TO anon, authenticated USING (is_public = true AND is_active = true);
CREATE POLICY "Staff can view all plans" ON public.orders_plans
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance admins insert plans" ON public.orders_plans
  FOR INSERT TO authenticated WITH CHECK (public.is_finance_admin(auth.uid()));
CREATE POLICY "Finance admins update plans" ON public.orders_plans
  FOR UPDATE TO authenticated USING (public.is_finance_admin(auth.uid()));
CREATE POLICY "Finance admins delete plans" ON public.orders_plans
  FOR DELETE TO authenticated USING (public.is_finance_admin(auth.uid()));

CREATE TRIGGER update_orders_plans_updated_at
  BEFORE UPDATE ON public.orders_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FEE CHANGE HISTORY ============
CREATE TABLE public.orders_plan_fee_changes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.orders_plans(id) ON DELETE CASCADE,
  old_fee_bps integer,
  new_fee_bps integer NOT NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.orders_plan_fee_changes TO authenticated;
GRANT ALL ON public.orders_plan_fee_changes TO service_role;
ALTER TABLE public.orders_plan_fee_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view fee changes" ON public.orders_plan_fee_changes
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance admins record fee changes" ON public.orders_plan_fee_changes
  FOR INSERT TO authenticated WITH CHECK (public.is_finance_admin(auth.uid()) AND created_by = auth.uid());

-- ============ CUSTOM PROJECT LEADS ============
CREATE TYPE public.custom_lead_status AS ENUM ('new','contacted','discovery','proposal','approved','in_development','completed','declined');

CREATE TABLE public.custom_project_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  orders_account_email text,
  storefront_url text,
  business_type text,
  build_goal text NOT NULL,
  project_description text NOT NULL,
  desired_features text,
  existing_website text,
  existing_software text,
  budget_range text,
  launch_timeframe text,
  integrations_required text,
  location_count text,
  monthly_order_volume text,
  additional_notes text,
  attachment_paths text[] NOT NULL DEFAULT '{}',
  status public.custom_lead_status NOT NULL DEFAULT 'new',
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX custom_project_leads_created_at_idx ON public.custom_project_leads (created_at DESC);

GRANT INSERT ON public.custom_project_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_project_leads TO authenticated;
GRANT ALL ON public.custom_project_leads TO service_role;
ALTER TABLE public.custom_project_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a custom project request" ON public.custom_project_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view custom project leads" ON public.custom_project_leads
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update custom project leads" ON public.custom_project_leads
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Super admins delete custom project leads" ON public.custom_project_leads
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_admin_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_custom_project_leads_updated_at
  BEFORE UPDATE ON public.custom_project_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_custom_lead_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email text;
BEGIN
  clean_email := lower(btrim(coalesce(NEW.email, '')));
  IF clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(clean_email) > 255 THEN
    RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
  END IF;
  NEW.email := clean_email;

  IF public.check_and_increment_rate_limit('custom_lead:email:' || clean_email, 3, 3600) THEN
    RAISE EXCEPTION 'Rate limit exceeded for this email. Please try again later.' USING ERRCODE = '22023';
  END IF;

  IF public.check_and_increment_rate_limit('custom_lead:global', 40, 3600) THEN
    RAISE EXCEPTION 'Submissions are temporarily throttled. Please try again later.' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER custom_project_leads_rate_limit
  BEFORE INSERT ON public.custom_project_leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_custom_lead_rate_limit();

-- ============ SEED PLANS ============
INSERT INTO public.orders_plans
  (slug, name, positioning, description, price_label, monthly_price_cents, annual_price_cents, annual_billing_active, annual_note, platform_fee_bps, fee_label, features, entitlements, badge, cta_label, cta_href, cta_secondary_label, cta_secondary_href, requires_subscription, display_order)
VALUES
(
  'launch', 'Launch', 'Start Selling',
  'Everything you need to publish a real storefront and start taking paid orders.',
  '$0', 0, NULL, false, NULL, 500, '+ 5% Loumilab platform fee',
  ARRAY['Unlimited menu & product listings','Loumilab storefront','Shareable storefront URL','Product images','Categories','Variants','Basic modifiers & add-ons','Online payments','Pickup ordering','Delivery ordering','Tips','Order dashboard','Order status management','Basic analytics','Basic availability controls','Loumilab branding','Standard support'],
  '{"storefront.unlimited_products":true,"orders.pickup":true,"orders.delivery":true,"orders.tips":true,"orders.scheduling":false,"discounts.enabled":false,"promo_codes.enabled":false,"analytics.level":"basic","customization.level":"basic","branding.remove_loumilab":false,"staff.max_users":1,"exports.enabled":false,"customer_insights.enabled":false,"priority_support.enabled":false}'::jsonb,
  NULL, 'Start Selling', '/orders/get-started', NULL, NULL, false, 1
),
(
  'starter', 'Starter', 'Run Your Business',
  'For sellers taking orders every week who need scheduling, promotions, and better reporting.',
  '$19', 1900, 19000, true, 'Save about two months with annual billing.', 390, '+ 3.9% Loumilab platform fee',
  ARRAY['Everything in Launch','Scheduled ordering','Pickup time windows','Delivery windows','Enhanced modifiers','Promo codes','Discounts','Product scheduling','Enhanced storefront customization','Customer order history','Better analytics','Availability scheduling','Reduced Loumilab branding','Improved reporting','Priority support relative to Launch'],
  '{"storefront.unlimited_products":true,"orders.pickup":true,"orders.delivery":true,"orders.tips":true,"orders.scheduling":true,"orders.windows":true,"discounts.enabled":true,"promo_codes.enabled":true,"analytics.level":"enhanced","customization.level":"enhanced","branding.remove_loumilab":false,"branding.reduced_loumilab":true,"staff.max_users":2,"exports.enabled":false,"customer_insights.enabled":false,"priority_support.enabled":true}'::jsonb,
  NULL, 'Choose Starter', '/orders/get-started?plan=starter', NULL, NULL, true, 2
),
(
  'business', 'Business', 'Grow Your Business',
  'For growing operations that need staff accounts, deep analytics, and full storefront control.',
  '$49', 4900, 49000, true, 'Save about two months with annual billing.', 290, '+ 2.9% Loumilab platform fee',
  ARRAY['Everything in Starter','Advanced analytics','Customer insights','Repeat-customer analytics','Product performance analytics','Sales exports','Advanced reporting','Advanced storefront customization','Remove visible Loumilab storefront branding','Multiple staff accounts','Staff roles','Advanced order controls','Advanced delivery & pickup settings','Enhanced promotions','Customer-management tools','Priority support','Future integrations where available'],
  '{"storefront.unlimited_products":true,"orders.pickup":true,"orders.delivery":true,"orders.tips":true,"orders.scheduling":true,"orders.windows":true,"orders.advanced_controls":true,"discounts.enabled":true,"promo_codes.enabled":true,"analytics.level":"advanced","customization.level":"advanced","branding.remove_loumilab":true,"staff.max_users":6,"staff.roles":["owner","manager","staff"],"exports.enabled":true,"customer_insights.enabled":true,"priority_support.enabled":true}'::jsonb,
  'Best for Growing Businesses', 'Choose Business', '/orders/get-started?plan=business', NULL, NULL, true, 3
),
(
  'custom', 'Custom', 'Build With Loumilab',
  'Need more than a storefront? Let''s build it. Custom sites, ordering systems, apps, and integrations designed and developed by Loumilab.',
  'Custom', NULL, NULL, false, NULL, NULL, 'Custom agreement',
  ARRAY['Independent website or custom e-commerce','Custom ordering system','Fully branded web or mobile application','Custom domain','Customer accounts','Advanced loyalty program','Advanced delivery system','Custom inventory','Multiple locations','Advanced CRM','Custom dashboards & workflows','API integrations','AI tools & automation','Specialized payment workflows','Custom databases','Advanced analytics'],
  '{"custom":true}'::jsonb,
  NULL, 'Build With Loumilab', '/orders/custom', 'Request a Consultation', '/contact', false, 4
);

INSERT INTO public.orders_plan_fee_changes (plan_id, old_fee_bps, new_fee_bps, reason)
SELECT id, NULL, platform_fee_bps, 'Initial platform fee configuration'
FROM public.orders_plans WHERE platform_fee_bps IS NOT NULL;