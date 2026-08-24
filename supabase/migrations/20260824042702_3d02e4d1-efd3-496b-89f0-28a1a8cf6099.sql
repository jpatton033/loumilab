-- Enums
CREATE TYPE public.payout_status AS ENUM ('not_started','onboarding','pending_verification','restricted','payout_enabled','disabled');

-- Merchants
CREATE TABLE public.merchants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  contact_email text NOT NULL,
  phone text,
  country text NOT NULL DEFAULT 'US',
  business_type text,
  plan_slug text NOT NULL DEFAULT 'launch',
  accepting_orders boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX merchants_owner_id_key ON public.merchants(owner_id);

GRANT SELECT, INSERT, UPDATE ON public.merchants TO authenticated;
GRANT ALL ON public.merchants TO service_role;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own merchant" ON public.merchants FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Owners create own merchant" ON public.merchants FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update own merchant" ON public.merchants FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Connected accounts (written only by edge functions / service role)
CREATE TABLE public.merchant_stripe_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL,
  livemode boolean NOT NULL DEFAULT false,
  payout_status public.payout_status NOT NULL DEFAULT 'not_started',
  details_submitted boolean NOT NULL DEFAULT false,
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  requirements_due jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements_disabled_reason text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX merchant_stripe_accounts_merchant_key ON public.merchant_stripe_accounts(merchant_id);
CREATE UNIQUE INDEX merchant_stripe_accounts_stripe_key ON public.merchant_stripe_accounts(stripe_account_id);

GRANT SELECT ON public.merchant_stripe_accounts TO authenticated;
GRANT ALL ON public.merchant_stripe_accounts TO service_role;
ALTER TABLE public.merchant_stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own connected account" ON public.merchant_stripe_accounts FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid())
    OR public.is_staff(auth.uid())
  );

CREATE TRIGGER update_merchant_stripe_accounts_updated_at BEFORE UPDATE ON public.merchant_stripe_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Idempotent webhook log
CREATE TABLE public.stripe_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text NOT NULL,
  type text NOT NULL,
  account_id text,
  livemode boolean NOT NULL DEFAULT false,
  payload jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX stripe_webhook_events_event_key ON public.stripe_webhook_events(stripe_event_id);

GRANT ALL ON public.stripe_webhook_events TO service_role;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view webhook events" ON public.stripe_webhook_events FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));