CREATE POLICY "Staff read admin email files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'admin-email' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff upload admin email files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-email' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff update admin email files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'admin-email' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'admin-email' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff delete admin email files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'admin-email' AND public.is_staff(auth.uid()));