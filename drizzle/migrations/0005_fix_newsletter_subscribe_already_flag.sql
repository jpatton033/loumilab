CREATE OR REPLACE FUNCTION public.newsletter_subscribe(_email text, _source text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  clean_email text;
  throttled boolean;
  v_existed boolean;
  v_was_unsubscribed boolean;
BEGIN
  clean_email := lower(btrim(coalesce(_email, '')));

  IF clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(clean_email) > 255 THEN
    RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
  END IF;

  throttled := public.check_and_increment_rate_limit('newsletter:global', 60, 3600);
  IF throttled THEN
    RAISE EXCEPTION 'Too many signups right now. Please try again later.' USING ERRCODE = '22023';
  END IF;

  SELECT true, (status <> 'subscribed')
    INTO v_existed, v_was_unsubscribed
    FROM public.newsletter_subscribers
   WHERE email = clean_email;

  INSERT INTO public.newsletter_subscribers (email, source)
  VALUES (clean_email, left(coalesce(_source, 'resources'), 64))
  ON CONFLICT (email) DO UPDATE
    SET status = 'subscribed',
        unsubscribed_at = NULL,
        updated_at = now()
    WHERE public.newsletter_subscribers.status <> 'subscribed';

  RETURN jsonb_build_object(
    'created', true,
    'already', coalesce(v_existed, false) AND NOT coalesce(v_was_unsubscribed, false),
    'resubscribed', coalesce(v_existed, false) AND coalesce(v_was_unsubscribed, false)
  );
END;
$function$;