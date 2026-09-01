DROP POLICY IF EXISTS "Merchant media is readable" ON storage.objects;

CREATE POLICY "Merchants read their own media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'merchant-media'
    AND (public.owns_merchant_media_path(name) OR public.is_staff(auth.uid()))
  );