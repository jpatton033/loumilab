DROP POLICY "Anyone can submit a custom project request" ON public.custom_project_leads;

CREATE POLICY "Anyone can submit a custom project request" ON public.custom_project_leads
  FOR INSERT
  WITH CHECK (status = 'new'::custom_lead_status AND internal_notes IS NULL);