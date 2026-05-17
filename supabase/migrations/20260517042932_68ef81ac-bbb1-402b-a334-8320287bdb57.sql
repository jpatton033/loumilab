DROP TRIGGER IF EXISTS contact_submissions_rate_limit ON public.contact_submissions;

CREATE TRIGGER contact_submissions_rate_limit
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_contact_submission_rate_limit();