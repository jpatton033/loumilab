CREATE OR REPLACE FUNCTION public.sync_accepting_orders_on_payout_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.payout_status <> 'payout_enabled' THEN
    UPDATE public.merchants
      SET accepting_orders = false
      WHERE id = NEW.merchant_id AND accepting_orders = true;

    UPDATE public.merchant_storefronts
      SET is_published = false
      WHERE merchant_id = NEW.merchant_id AND is_published = true;
  ELSE
    UPDATE public.merchants
      SET accepting_orders = true
      WHERE id = NEW.merchant_id AND accepting_orders = false;

    UPDATE public.merchant_storefronts
      SET is_published = true
      WHERE merchant_id = NEW.merchant_id AND is_published = false;
  END IF;
  RETURN NEW;
END;
$function$;

UPDATE public.merchants m
  SET accepting_orders = true
  WHERE m.accepting_orders = false
    AND EXISTS (
      SELECT 1 FROM public.merchant_stripe_accounts a
      WHERE a.merchant_id = m.id AND a.payout_status = 'payout_enabled'
    );