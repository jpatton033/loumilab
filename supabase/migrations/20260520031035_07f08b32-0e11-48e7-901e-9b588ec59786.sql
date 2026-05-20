
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  _key text,
  _max_count int,
  _window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count int;
BEGIN
  INSERT INTO public.rate_limits (key, request_count, window_start)
  VALUES (_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET request_count = CASE
          WHEN public.rate_limits.window_start < now() - (_window_seconds || ' seconds')::interval THEN 1
          ELSE public.rate_limits.request_count + 1
        END,
        window_start = CASE
          WHEN public.rate_limits.window_start < now() - (_window_seconds || ' seconds')::interval THEN now()
          ELSE public.rate_limits.window_start
        END
  RETURNING request_count INTO current_count;

  RETURN current_count > _max_count;
END;
$$;

-- Ensure unique key for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_key_uniq ON public.rate_limits(key);
