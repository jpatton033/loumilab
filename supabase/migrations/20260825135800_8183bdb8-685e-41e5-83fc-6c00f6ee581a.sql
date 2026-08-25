-- ============================ INDUSTRIES ============================
CREATE TABLE public.orders_industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  group_label text NOT NULL DEFAULT 'Services',
  description text,
  icon text NOT NULL DEFAULT 'Store',
  is_food boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  terminology jsonb NOT NULL DEFAULT '{}'::jsonb,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  workflow jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_purchase_models text[] NOT NULL DEFAULT ARRAY['products']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.orders_industries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders_industries TO authenticated;
GRANT ALL ON public.orders_industries TO service_role;

ALTER TABLE public.orders_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active industries" ON public.orders_industries
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Staff can view all industries" ON public.orders_industries
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Finance admins insert industries" ON public.orders_industries
  FOR INSERT TO authenticated WITH CHECK (public.is_finance_admin(auth.uid()));
CREATE POLICY "Finance admins update industries" ON public.orders_industries
  FOR UPDATE TO authenticated USING (public.is_finance_admin(auth.uid()));
CREATE POLICY "Finance admins delete industries" ON public.orders_industries
  FOR DELETE TO authenticated USING (public.is_finance_admin(auth.uid()));

CREATE TRIGGER update_orders_industries_updated_at BEFORE UPDATE ON public.orders_industries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.orders_industries
  (slug, name, group_label, description, icon, is_food, display_order, terminology, modules, workflow, default_purchase_models)
VALUES
 ('food-catering','Food & Catering','Food','Plate sales, meal prep, home chefs and caterers.','ChefHat',true,1,
  '{"catalog":"Menu","catalogItem":"Menu item","transaction":"Order","transactions":"Orders","schedule":"Pickup time","notes":"Special instructions","location":"Pickup location","customer":"Customer","cta":"Order Now"}',
  '["orders","menu","customers","payments","analytics"]',
  '["New","Confirmed","Preparing","Ready","Completed"]', ARRAY['products']),
 ('restaurant','Restaurant / Food Service','Food','Dine-in, takeout and delivery food service.','UtensilsCrossed',true,2,
  '{"catalog":"Menu","catalogItem":"Menu item","transaction":"Order","transactions":"Orders","schedule":"Pickup time","notes":"Special instructions","location":"Pickup location","customer":"Customer","cta":"Order Now"}',
  '["orders","menu","customers","payments","analytics"]',
  '["New","Confirmed","Preparing","Ready","Completed"]', ARRAY['products']),
 ('bakery','Bakery / Desserts','Food','Cakes, pastries, desserts and custom orders.','CakeSlice',true,3,
  '{"catalog":"Menu","catalogItem":"Item","transaction":"Order","transactions":"Orders","schedule":"Pickup time","notes":"Order details","location":"Pickup location","customer":"Customer","cta":"Order Now"}',
  '["orders","menu","customers","schedule","payments","analytics"]',
  '["New","Confirmed","Preparing","Ready","Completed"]', ARRAY['products','custom_quotes']),
 ('electrician','Electrician','Home & Trade Services','Residential and commercial electrical work.','Zap',false,4,
  '{"catalog":"Services","catalogItem":"Service","transaction":"Job","transactions":"Jobs","schedule":"Appointment","notes":"Job notes","location":"Service address","customer":"Customer","cta":"Request Service"}',
  '["jobs","services","customers","schedule","estimates","payments","analytics"]',
  '["Request","Estimate","Approved","Deposit","Scheduled","In Progress","Invoiced","Completed"]', ARRAY['services','custom_quotes','appointments']),
 ('plumbing','Plumbing','Home & Trade Services','Repairs, installs and emergency plumbing.','Wrench',false,5,
  '{"catalog":"Services","catalogItem":"Service","transaction":"Job","transactions":"Jobs","schedule":"Appointment","notes":"Job notes","location":"Service address","customer":"Customer","cta":"Request Service"}',
  '["jobs","services","customers","schedule","estimates","payments","analytics"]',
  '["Request","Estimate","Approved","Deposit","Scheduled","In Progress","Invoiced","Completed"]', ARRAY['services','custom_quotes','appointments']),
 ('cleaning','Cleaning Services','Home & Trade Services','Residential, commercial and move-out cleaning.','Sparkles',false,6,
  '{"catalog":"Services","catalogItem":"Service","transaction":"Booking","transactions":"Bookings","schedule":"Appointment","notes":"Property details","location":"Service address","customer":"Customer","cta":"Book Cleaning"}',
  '["jobs","services","customers","schedule","estimates","payments","analytics"]',
  '["Request","Estimate","Approved","Scheduled","In Progress","Invoiced","Completed"]', ARRAY['services','appointments','recurring']),
 ('landscaping','Landscaping / Lawn Care','Home & Trade Services','Lawn care, landscaping and seasonal maintenance.','Trees',false,7,
  '{"catalog":"Services","catalogItem":"Service","transaction":"Job","transactions":"Jobs","schedule":"Visit","notes":"Property details","location":"Service address","customer":"Customer","cta":"Request a Quote"}',
  '["jobs","services","customers","schedule","estimates","payments","analytics"]',
  '["Request","Estimate","Approved","Scheduled","In Progress","Invoiced","Completed"]', ARRAY['services','recurring','custom_quotes']),
 ('handyman','Handyman / Home Services','Home & Trade Services','General repairs and home improvement work.','Hammer',false,8,
  '{"catalog":"Services","catalogItem":"Service","transaction":"Job","transactions":"Jobs","schedule":"Appointment","notes":"Job notes","location":"Service address","customer":"Customer","cta":"Request Service"}',
  '["jobs","services","customers","schedule","estimates","payments","analytics"]',
  '["Request","Estimate","Approved","Deposit","Scheduled","In Progress","Invoiced","Completed"]', ARRAY['services','custom_quotes']),
 ('beauty','Beauty / Barber','Personal Services','Hair, barbering, nails, lashes and beauty services.','Scissors',false,9,
  '{"catalog":"Services","catalogItem":"Service","transaction":"Appointment","transactions":"Appointments","schedule":"Appointment","notes":"Client notes","location":"Studio location","customer":"Client","cta":"Book Appointment"}',
  '["jobs","services","customers","schedule","payments","analytics"]',
  '["Requested","Confirmed","Scheduled","In Progress","Completed"]', ARRAY['appointments','services']),
 ('automotive','Automotive / Mobile Services','Mobile Services','Detailing, mobile mechanics and vehicle services.','Car',false,10,
  '{"catalog":"Services","catalogItem":"Service","transaction":"Job","transactions":"Jobs","schedule":"Appointment","notes":"Vehicle details","location":"Service address","customer":"Customer","cta":"Book Service"}',
  '["jobs","services","customers","schedule","estimates","payments","analytics"]',
  '["Request","Estimate","Approved","Scheduled","In Progress","Invoiced","Completed"]', ARRAY['services','appointments']),
 ('photography','Photography / Creative Services','Creative','Photography, video and creative sessions.','Camera',false,11,
  '{"catalog":"Packages","catalogItem":"Package","transaction":"Booking","transactions":"Bookings","schedule":"Session","notes":"Session details","location":"Session location","customer":"Client","cta":"Book a Session"}',
  '["jobs","services","customers","schedule","estimates","payments","analytics"]',
  '["Inquiry","Estimate","Approved","Deposit","Scheduled","In Progress","Invoiced","Completed"]', ARRAY['services','appointments','custom_quotes']),
 ('retail','Retail / Custom Products','Retail','Merch, handmade goods and custom product drops.','ShoppingBag',false,12,
  '{"catalog":"Products","catalogItem":"Product","transaction":"Order","transactions":"Orders","schedule":"Pickup time","notes":"Order notes","location":"Pickup location","customer":"Customer","cta":"Shop Now"}',
  '["orders","products","customers","payments","analytics"]',
  '["New","Confirmed","Preparing","Ready","Completed"]', ARRAY['products','custom_quotes']),
 ('professional','Professional Services','Professional','Consulting, tutoring and professional engagements.','Briefcase',false,13,
  '{"catalog":"Services","catalogItem":"Service","transaction":"Engagement","transactions":"Engagements","schedule":"Appointment","notes":"Client notes","location":"Meeting location","customer":"Client","cta":"Request a Consultation"}',
  '["jobs","services","customers","schedule","estimates","payments","analytics"]',
  '["Inquiry","Estimate","Approved","Scheduled","In Progress","Invoiced","Completed"]', ARRAY['services','appointments','custom_quotes','recurring']),
 ('other','Other','Other','Something else — Loumilab adapts to your workflow.','Store',false,14,
  '{"catalog":"Products & Services","catalogItem":"Item","transaction":"Order","transactions":"Orders","schedule":"Scheduling","notes":"Customer notes","location":"Location","customer":"Customer","cta":"Get Started"}',
  '["orders","jobs","products","customers","schedule","payments","analytics"]',
  '["New","Confirmed","In Progress","Completed"]', ARRAY['products','services']);

-- ============================ MERCHANTS ============================
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS industry_slug text NOT NULL DEFAULT 'food-catering',
  ADD COLUMN IF NOT EXISTS purchase_models text[] NOT NULL DEFAULT ARRAY['products']::text[];

-- ============================ ENUMS ============================
CREATE TYPE public.job_status AS ENUM ('request','estimate','approved','deposit','scheduled','in_progress','invoiced','completed','cancelled');
CREATE TYPE public.quote_status AS ENUM ('draft','sent','approved','declined','expired');
CREATE TYPE public.invoice_status AS ENUM ('draft','sent','paid','void');

-- ============================ CUSTOMERS ============================
CREATE TABLE public.merchant_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_customers TO authenticated;
GRANT ALL ON public.merchant_customers TO service_role;
ALTER TABLE public.merchant_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own customers" ON public.merchant_customers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));
CREATE POLICY "Staff view customers" ON public.merchant_customers FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER update_merchant_customers_updated_at BEFORE UPDATE ON public.merchant_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================ SERVICES / PRODUCTS ============================
CREATE TABLE public.merchant_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'service',
  price_cents integer,
  price_is_starting boolean NOT NULL DEFAULT true,
  unit text,
  image_url text,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.merchant_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_services TO authenticated;
GRANT ALL ON public.merchant_services TO service_role;
ALTER TABLE public.merchant_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active catalog" ON public.merchant_services FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "Owners manage own catalog" ON public.merchant_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));
CREATE POLICY "Staff view catalog" ON public.merchant_services FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER update_merchant_services_updated_at BEFORE UPDATE ON public.merchant_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================ JOBS ============================
CREATE TABLE public.merchant_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.merchant_customers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.merchant_services(id) ON DELETE SET NULL,
  reference text,
  status public.job_status NOT NULL DEFAULT 'request',
  title text NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  service_address text,
  problem_description text,
  customer_notes text,
  internal_notes text,
  attachment_paths text[] NOT NULL DEFAULT ARRAY[]::text[],
  scheduled_for timestamptz,
  scheduled_window text,
  total_cents integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.merchant_jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_jobs TO authenticated;
GRANT ALL ON public.merchant_jobs TO service_role;
ALTER TABLE public.merchant_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a service request" ON public.merchant_jobs FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'request' AND total_cents IS NULL AND internal_notes IS NULL);
CREATE POLICY "Owners manage own jobs" ON public.merchant_jobs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));
CREATE POLICY "Staff view jobs" ON public.merchant_jobs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER update_merchant_jobs_updated_at BEFORE UPDATE ON public.merchant_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_job_request_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE clean_email text;
BEGIN
  clean_email := lower(btrim(coalesce(NEW.customer_email, '')));
  IF clean_email <> '' THEN
    IF clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(clean_email) > 255 THEN
      RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
    END IF;
    NEW.customer_email := clean_email;
    IF public.check_and_increment_rate_limit('job_request:email:' || clean_email, 5, 3600) THEN
      RAISE EXCEPTION 'Too many requests from this email. Please try again later.' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF public.check_and_increment_rate_limit('job_request:merchant:' || NEW.merchant_id::text, 60, 3600) THEN
    RAISE EXCEPTION 'Requests are temporarily throttled. Please try again later.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER merchant_jobs_request_rate_limit BEFORE INSERT ON public.merchant_jobs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_job_request_rate_limit();

-- ============================ QUOTES ============================
CREATE TABLE public.merchant_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.merchant_jobs(id) ON DELETE CASCADE,
  public_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status public.quote_status NOT NULL DEFAULT 'draft',
  title text NOT NULL,
  message text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents integer NOT NULL DEFAULT 0,
  deposit_cents integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  sent_at timestamptz,
  approved_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_quotes TO authenticated;
GRANT ALL ON public.merchant_quotes TO service_role;
ALTER TABLE public.merchant_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own quotes" ON public.merchant_quotes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));
CREATE POLICY "Staff view quotes" ON public.merchant_quotes FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER update_merchant_quotes_updated_at BEFORE UPDATE ON public.merchant_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================ INVOICES ============================
CREATE TABLE public.merchant_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.merchant_jobs(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.merchant_quotes(id) ON DELETE SET NULL,
  public_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  kind text NOT NULL DEFAULT 'balance',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  amount_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer,
  due_at timestamptz,
  paid_at timestamptz,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_invoices TO authenticated;
GRANT ALL ON public.merchant_invoices TO service_role;
ALTER TABLE public.merchant_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own invoices" ON public.merchant_invoices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));
CREATE POLICY "Staff view invoices" ON public.merchant_invoices FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER update_merchant_invoices_updated_at BEFORE UPDATE ON public.merchant_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_merchant_jobs_merchant ON public.merchant_jobs(merchant_id, created_at DESC);
CREATE INDEX idx_merchant_services_merchant ON public.merchant_services(merchant_id, display_order);
CREATE INDEX idx_merchant_quotes_merchant ON public.merchant_quotes(merchant_id, created_at DESC);
CREATE INDEX idx_merchant_invoices_merchant ON public.merchant_invoices(merchant_id, created_at DESC);