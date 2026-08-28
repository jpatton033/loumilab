-- 1. Store lifecycle status ---------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.storefront_status AS ENUM ('setup', 'ready', 'published', 'paused', 'restricted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.merchant_storefronts
  ADD COLUMN IF NOT EXISTS status public.storefront_status NOT NULL DEFAULT 'setup';

UPDATE public.merchant_storefronts
  SET status = CASE WHEN is_published THEN 'published'::public.storefront_status
                    ELSE 'setup'::public.storefront_status END;

-- Requirements a store must meet before it can be public.
CREATE OR REPLACE FUNCTION public.storefront_can_publish(_storefront_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.merchant_storefronts s
    JOIN public.merchant_stripe_accounts a ON a.merchant_id = s.merchant_id
    WHERE s.id = _storefront_id
      AND a.payout_status = 'payout_enabled'
      AND coalesce(btrim(s.description), '') <> ''
      AND (
        EXISTS (SELECT 1 FROM public.merchant_products p
                 WHERE p.storefront_id = s.id AND p.is_active)
        OR EXISTS (SELECT 1 FROM public.merchant_services v
                    WHERE v.merchant_id = s.merchant_id AND v.is_active)
      )
  );
$$;

-- Keeps is_published and status consistent, and blocks publishing an unready store.
CREATE OR REPLACE FUNCTION public.enforce_storefront_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Legacy writes that only flip is_published still resolve to a status.
  IF TG_OP = 'UPDATE'
     AND NEW.is_published IS DISTINCT FROM OLD.is_published
     AND NEW.status = OLD.status THEN
    NEW.status := CASE WHEN NEW.is_published THEN 'published'::public.storefront_status
                       ELSE 'ready'::public.storefront_status END;
  END IF;

  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published'::public.storefront_status) THEN
    IF NOT public.storefront_can_publish(NEW.id) THEN
      RAISE EXCEPTION 'This store is not ready to publish yet. Finish payments setup, add a description and at least one item or service first.'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  NEW.is_published := (NEW.status = 'published');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS merchant_storefronts_status_guard ON public.merchant_storefronts;
CREATE TRIGGER merchant_storefronts_status_guard
  BEFORE INSERT OR UPDATE ON public.merchant_storefronts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_storefront_status();

-- 2. Payout changes move stores between lifecycle states ----------------------
CREATE OR REPLACE FUNCTION public.sync_accepting_orders_on_payout_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payout_status <> 'payout_enabled' THEN
    UPDATE public.merchants
      SET accepting_orders = false
      WHERE id = NEW.merchant_id AND accepting_orders = true;

    -- A live store whose payouts stopped is restricted, not silently deleted.
    UPDATE public.merchant_storefronts
      SET status = 'restricted'
      WHERE merchant_id = NEW.merchant_id AND status = 'published';
  ELSE
    UPDATE public.merchants
      SET accepting_orders = true
      WHERE id = NEW.merchant_id AND accepting_orders = false;

    -- Payouts approved: the merchant decides when to go live.
    UPDATE public.merchant_storefronts
      SET status = 'ready'
      WHERE merchant_id = NEW.merchant_id AND status IN ('setup', 'restricted');
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Merchant media storage (logos, item images) ------------------------------
-- Path convention: <merchant_id>/<kind>/<file>
CREATE OR REPLACE FUNCTION public.owns_merchant_media_path(object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parts text[];
  merchant uuid;
BEGIN
  parts := storage.foldername(object_name);
  IF parts IS NULL OR array_length(parts, 1) < 1 THEN
    RETURN false;
  END IF;
  BEGIN
    merchant := parts[1]::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;
  RETURN EXISTS (
    SELECT 1 FROM public.merchants
    WHERE id = merchant AND owner_id = auth.uid()
  );
END;
$$;

DROP POLICY IF EXISTS "Merchant media is readable" ON storage.objects;
CREATE POLICY "Merchant media is readable"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'merchant-media');

DROP POLICY IF EXISTS "Merchants upload their own media" ON storage.objects;
CREATE POLICY "Merchants upload their own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'merchant-media' AND public.owns_merchant_media_path(name));

DROP POLICY IF EXISTS "Merchants update their own media" ON storage.objects;
CREATE POLICY "Merchants update their own media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'merchant-media' AND public.owns_merchant_media_path(name))
  WITH CHECK (bucket_id = 'merchant-media' AND public.owns_merchant_media_path(name));

DROP POLICY IF EXISTS "Merchants delete their own media" ON storage.objects;
CREATE POLICY "Merchants delete their own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'merchant-media' AND public.owns_merchant_media_path(name));