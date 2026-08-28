DROP POLICY IF EXISTS "Published storefronts are public" ON public.merchant_storefronts;
CREATE POLICY "Published storefronts are public"
  ON public.merchant_storefronts FOR SELECT
  USING (is_published = true OR status = 'paused');