CREATE POLICY "Anyone can upload custom project attachments"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'custom-project-files');

CREATE POLICY "Staff can view custom project attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'custom-project-files' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete custom project attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'custom-project-files' AND public.is_staff(auth.uid()));