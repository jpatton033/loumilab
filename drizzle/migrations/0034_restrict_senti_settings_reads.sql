DROP POLICY IF EXISTS "anyone read settings" ON public.senti_settings;
CREATE POLICY "staff read settings" ON public.senti_settings
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
REVOKE SELECT ON public.senti_settings FROM anon;