DROP POLICY IF EXISTS "Public can read kc media" ON storage.objects;

CREATE POLICY "Admins can read kc media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kc-media' AND public.has_role(auth.uid(), 'admin'));