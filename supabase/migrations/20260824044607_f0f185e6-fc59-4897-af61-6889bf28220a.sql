CREATE OR REPLACE FUNCTION public.enforce_accepting_orders_payout_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.accepting_orders = true AND (TG_OP = 'INSERT' OR OLD.accepting_orders IS DISTINCT FROM NEW.accepting_orders) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.merchant_stripe_accounts
      WHERE merchant_id = NEW.id AND payout_status = 'payout_enabled'
    ) THEN
      RAISE EXCEPTION 'Payments setup must be complete (payouts enabled) before accepting orders.'
        USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS merchants_accepting_orders_gate ON public.merchants;
CREATE TRIGGER merchants_accepting_orders_gate
BEFORE INSERT OR UPDATE ON public.merchants
FOR EACH ROW EXECUTE FUNCTION public.enforce_accepting_orders_payout_gate();

CREATE OR REPLACE FUNCTION public.sync_accepting_orders_on_payout_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.payout_status <> 'payout_enabled' THEN
    UPDATE public.merchants
      SET accepting_orders = false
      WHERE id = NEW.merchant_id AND accepting_orders = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS merchant_accounts_payout_sync ON public.merchant_stripe_accounts;
CREATE TRIGGER merchant_accounts_payout_sync
AFTER INSERT OR UPDATE OF payout_status ON public.merchant_stripe_accounts
FOR EACH ROW EXECUTE FUNCTION public.sync_accepting_orders_on_payout_change();

REVOKE EXECUTE ON FUNCTION public.enforce_accepting_orders_payout_gate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_accepting_orders_on_payout_change() FROM PUBLIC, anon, authenticated;