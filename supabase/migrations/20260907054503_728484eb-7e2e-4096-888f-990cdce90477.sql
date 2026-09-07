CREATE TABLE public.merchant_agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL,
  document text NOT NULL CHECK (document IN ('terms','privacy')),
  version text NOT NULL,
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX merchant_agreements_unique
  ON public.merchant_agreements (user_id, document, version);

GRANT SELECT, INSERT ON public.merchant_agreements TO authenticated;
GRANT ALL ON public.merchant_agreements TO service_role;

ALTER TABLE public.merchant_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own agreements"
  ON public.merchant_agreements FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users record their own agreements"
  ON public.merchant_agreements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff read all agreements"
  ON public.merchant_agreements FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));