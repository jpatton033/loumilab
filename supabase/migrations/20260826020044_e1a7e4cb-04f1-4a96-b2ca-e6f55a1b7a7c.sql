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
    UPDATE public.merchant_storefronts
      SET is_published = true
      WHERE merchant_id = NEW.merchant_id AND is_published = false;
  END IF;
  RETURN NEW;
END;
$function$;