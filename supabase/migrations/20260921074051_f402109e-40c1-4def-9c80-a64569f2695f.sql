CREATE POLICY "Staff view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));