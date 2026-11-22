CREATE OR REPLACE FUNCTION public.validate_storefront_design(_d jsonb)
 RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public'
AS $function$
DECLARE s jsonb; allowed text[] := ARRAY['header','hero','about','products','services','featured','gallery','promo','testimonials','faq','contact','hours','footer'];
BEGIN
  IF jsonb_typeof(_d) <> 'object' OR jsonb_typeof(_d->'sections') <> 'array' OR jsonb_typeof(_d->'theme') <> 'object' THEN
    RAISE EXCEPTION 'Design is not valid'; END IF;
  IF jsonb_array_length(_d->'sections') > 40 THEN RAISE EXCEPTION 'Too many sections'; END IF;
  IF octet_length(_d::text) > 200000 THEN RAISE EXCEPTION 'Design is too large'; END IF;
  IF _d::text ~* '(<\s*script|javascript:|data:text/html|[\s"''/<]on[a-z]+\s*=)' THEN RAISE EXCEPTION 'Design contains disallowed content'; END IF;
  IF coalesce(_d->'theme'->>'buttonStyle','solid') NOT IN ('solid','outline','pill') THEN RAISE EXCEPTION 'Unknown button style'; END IF;
  IF coalesce(_d->'theme'->>'contentWidth','normal') NOT IN ('narrow','normal','wide') THEN RAISE EXCEPTION 'Unknown content width'; END IF;
  FOR s IN SELECT * FROM jsonb_array_elements(_d->'sections') LOOP
    IF NOT ((s->>'type') = ANY(allowed)) THEN RAISE EXCEPTION 'Unknown section type'; END IF;
    IF coalesce(s->'props'->>'layout','split') NOT IN ('split','full','centered') THEN RAISE EXCEPTION 'Unknown hero layout'; END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(_d->'sections') x WHERE x->>'type' = 'products' AND coalesce((x->>'hidden')::boolean, false) = false) THEN
    RAISE EXCEPTION 'Your website needs a visible products section so customers can order'; END IF;
END $function$;