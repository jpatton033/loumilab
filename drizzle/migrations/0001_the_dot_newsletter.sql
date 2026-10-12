-- The Dot. editorial publication: subscriber management + issue archive

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN status text NOT NULL DEFAULT 'subscribed',
  ADD COLUMN interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN unsubscribed_at timestamptz,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_subscribers_unsubscribe_token_key UNIQUE (unsubscribe_token);

CREATE TABLE public.dot_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number integer NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  subtitle text,
  issue_month text,
  editors_note text,
  story_title text,
  story_body text,
  short_stories jsonb NOT NULL DEFAULT '[]'::jsonb,
  resource_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  product_update text,
  closing_thought text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dot_issues_status_check CHECK (status IN ('draft','published')),
  CONSTRAINT dot_issues_slug_format CHECK (slug ~ '^[a-z0-9-]{1,120}$'),
  CONSTRAINT dot_issues_number_positive CHECK (issue_number >= 1)
);

CREATE UNIQUE INDEX dot_issues_slug_key ON public.dot_issues (slug);
CREATE UNIQUE INDEX dot_issues_issue_number_key ON public.dot_issues (issue_number);

GRANT SELECT ON public.dot_issues TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dot_issues TO authenticated;
GRANT ALL ON public.dot_issues TO service_role;

ALTER TABLE public.dot_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published issues"
  ON public.dot_issues FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins can view all issues"
  ON public.dot_issues FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create issues"
  ON public.dot_issues FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update issues"
  ON public.dot_issues FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete issues"
  ON public.dot_issues FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER dot_issues_updated_at
  BEFORE UPDATE ON public.dot_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Subscribe now reports whether the address is new, returning, or already on The Dot.
DROP FUNCTION public.newsletter_subscribe(text, text);
CREATE OR REPLACE FUNCTION public.newsletter_subscribe(_email text, _source text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  clean_email text;
  throttled boolean;
  v_status text;
BEGIN
  clean_email := lower(btrim(coalesce(_email, '')));

  IF clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(clean_email) > 255 THEN
    RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
  END IF;

  throttled := public.check_and_increment_rate_limit('newsletter:global', 60, 3600);
  IF throttled THEN
    RAISE EXCEPTION 'Too many signups right now. Please try again later.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.newsletter_subscribers (email, source)
  VALUES (clean_email, left(coalesce(_source, 'resources'), 64))
  ON CONFLICT (email) DO UPDATE
    SET status = 'subscribed',
        unsubscribed_at = NULL,
        updated_at = now()
    WHERE public.newsletter_subscribers.status <> 'subscribed';

  SELECT status INTO v_status FROM public.newsletter_subscribers WHERE email = clean_email;

  RETURN jsonb_build_object(
    'created', v_status IS NOT NULL,
    'already', v_status = 'subscribed',
    'resubscribed', false
  );
END;
$function$;

-- Optional topic preferences after subscribing.
CREATE OR REPLACE FUNCTION public.newsletter_set_interests(_email text, _interests text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  clean_email text;
  allowed text[] := ARRAY['Business & Growth','Technology & AI','Web & Digital','Security & Privacy','Orders & Commerce'];
  clean text[];
BEGIN
  clean_email := lower(btrim(coalesce(_email, '')));
  IF clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(clean_email) > 255 THEN
    RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(DISTINCT i) INTO clean
  FROM unnest(coalesce(_interests, ARRAY[]::text[])) AS i
  WHERE i = ANY(allowed);

  UPDATE public.newsletter_subscribers
  SET interests = coalesce(clean, ARRAY[]::text[]), updated_at = now()
  WHERE email = clean_email;

  RETURN found;
END;
$function$;

-- Unsubscribe via the secret token that ships with every future send.
CREATE OR REPLACE FUNCTION public.newsletter_unsubscribe(_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.newsletter_subscribers
  SET status = 'unsubscribed', unsubscribed_at = now(), updated_at = now()
  WHERE unsubscribe_token = _token;
  RETURN found;
END;
$function$;