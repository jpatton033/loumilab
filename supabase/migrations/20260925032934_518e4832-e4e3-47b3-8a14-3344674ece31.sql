CREATE OR REPLACE FUNCTION public.guard_merchant_plan_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' OR (auth.uid() IS NOT NULL AND public.is_staff(auth.uid())) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.plan_slug IS NOT DISTINCT FROM OLD.plan_slug THEN
    RETURN NEW;
  END IF;
  IF NEW.plan_slug = 'launch' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND EXISTS (
    SELECT 1 FROM public.merchant_subscriptions s
    WHERE s.merchant_id = NEW.id AND s.plan_slug = NEW.plan_slug
      AND s.status IN ('active','trialing','past_due')
  ) THEN
    RETURN NEW;
  END IF;
  -- Paid tiers are only granted by billing (service role) or staff.
  NEW.plan_slug := CASE WHEN TG_OP = 'UPDATE' THEN OLD.plan_slug ELSE 'launch' END;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_merchant_plan_slug() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS merchants_plan_slug_guard ON public.merchants;
CREATE TRIGGER merchants_plan_slug_guard BEFORE INSERT OR UPDATE ON public.merchants
FOR EACH ROW EXECUTE FUNCTION public.guard_merchant_plan_slug();