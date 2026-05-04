CREATE OR REPLACE FUNCTION public.enforce_contact_submission_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_key TEXT;
  global_key TEXT := 'contact_submission:global';
  email_limit INT := 3;
  global_limit INT := 30;
  window_ms INT := 3600;
  email_count INT;
  global_count INT;
BEGIN
  email_key := 'contact_submission:email:' || lower(NEW.email);

  -- Per-email check & upsert
  SELECT request_count INTO email_count
  FROM public.rate_limits
  WHERE key = email_key AND window_start > now() - (window_ms || ' seconds')::interval;

  IF email_count IS NULL THEN
    DELETE FROM public.rate_limits WHERE key = email_key;
    INSERT INTO public.rate_limits (key, request_count, window_start) VALUES (email_key, 1, now());
  ELSIF email_count >= email_limit THEN
    RAISE EXCEPTION 'Rate limit exceeded for this email. Please try again later.'
      USING ERRCODE = '22023';
  ELSE
    UPDATE public.rate_limits SET request_count = request_count + 1 WHERE key = email_key;
  END IF;

  -- Global check & upsert
  SELECT request_count INTO global_count
  FROM public.rate_limits
  WHERE key = global_key AND window_start > now() - (window_ms || ' seconds')::interval;

  IF global_count IS NULL THEN
    DELETE FROM public.rate_limits WHERE key = global_key;
    INSERT INTO public.rate_limits (key, request_count, window_start) VALUES (global_key, 1, now());
  ELSIF global_count >= global_limit THEN
    RAISE EXCEPTION 'Submissions are temporarily throttled. Please try again later.'
      USING ERRCODE = '22023';
  ELSE
    UPDATE public.rate_limits SET request_count = request_count + 1 WHERE key = global_key;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_contact_submission_rate_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS contact_submissions_rate_limit ON public.contact_submissions;
CREATE TRIGGER contact_submissions_rate_limit
BEFORE INSERT ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_contact_submission_rate_limit();