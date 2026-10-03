CREATE OR REPLACE FUNCTION public.local_candidate_visitor_source() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.source_type = 'visitor' AND coalesce(btrim(NEW.source_url),'') = '' THEN
    NEW.source_url := 'Visitor submission (' || coalesce(NEW.submitter_affiliation,'unknown') || ')';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.local_candidate_visitor_source() FROM public, anon, authenticated;
CREATE TRIGGER local_candidate_visitor_source BEFORE INSERT ON public.local_candidates
  FOR EACH ROW EXECUTE FUNCTION public.local_candidate_visitor_source();