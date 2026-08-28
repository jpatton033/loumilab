CREATE TABLE IF NOT EXISTS public.merchant_welcome_emails (
  merchant_id uuid PRIMARY KEY REFERENCES public.merchants(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.merchant_welcome_emails TO service_role;

ALTER TABLE public.merchant_welcome_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can review welcome sends"
  ON public.merchant_welcome_emails FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));