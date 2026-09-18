-- 1. Conversations ---------------------------------------------------------
CREATE TABLE public.order_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  storefront_id uuid NOT NULL REFERENCES public.merchant_storefronts(id) ON DELETE CASCADE,
  last_message_at timestamp with time zone,
  merchant_unread_count integer NOT NULL DEFAULT 0,
  customer_unread_count integer NOT NULL DEFAULT 0,
  locked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX order_conversations_merchant_idx
  ON public.order_conversations (merchant_id, last_message_at DESC NULLS LAST);

GRANT SELECT ON public.order_conversations TO authenticated;
GRANT ALL ON public.order_conversations TO service_role;
ALTER TABLE public.order_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view their conversations"
  ON public.order_conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE POLICY "Staff view all conversations"
  ON public.order_conversations FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_order_conversations_updated_at
  BEFORE UPDATE ON public.order_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Messages --------------------------------------------------------------
CREATE TABLE public.order_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.order_conversations(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('customer', 'merchant', 'system')),
  sender_user_id uuid,
  body text NOT NULL,
  event_type text,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX order_messages_conversation_idx
  ON public.order_messages (conversation_id, created_at);
CREATE INDEX order_messages_merchant_idx
  ON public.order_messages (merchant_id, created_at DESC);

GRANT SELECT ON public.order_messages TO authenticated;
GRANT ALL ON public.order_messages TO service_role;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants view their messages"
  ON public.order_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.owner_id = auth.uid()));

CREATE POLICY "Staff view all messages"
  ON public.order_messages FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

ALTER TABLE public.order_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
ALTER TABLE public.order_conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_conversations;

-- 3. Entitlement: every paid plan includes messaging -----------------------
UPDATE public.orders_plans
SET entitlements = COALESCE(entitlements, '{}'::jsonb) || '{"messaging.enabled": true}'::jsonb
WHERE COALESCE(monthly_price_cents, 0) > 0 OR requires_subscription = true;

UPDATE public.orders_plans
SET entitlements = COALESCE(entitlements, '{}'::jsonb) || '{"messaging.enabled": false}'::jsonb
WHERE COALESCE(monthly_price_cents, 0) = 0 AND requires_subscription = false;

-- 4. Helpers ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merchant_messaging_enabled(_merchant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (p.entitlements ->> 'messaging.enabled')::boolean,
    false
  )
  FROM public.merchants m
  LEFT JOIN public.orders_plans p
    ON p.slug = m.plan_slug AND p.is_active = true
  WHERE m.id = _merchant_id
$$;

REVOKE ALL ON FUNCTION public.merchant_messaging_enabled(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.merchant_messaging_enabled(uuid) TO anon, authenticated, service_role;

-- Conversation is read-only 7 days after the order finishes.
CREATE OR REPLACE FUNCTION public.order_conversation_lock_at(_order public.orders)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _order.status IN ('completed', 'cancelled', 'refunded')
      THEN _order.updated_at + interval '7 days'
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.ensure_order_conversation(_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
  o public.orders;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id;
  IF o.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO cid FROM public.order_conversations WHERE order_id = _order_id;
  IF cid IS NOT NULL THEN
    RETURN cid;
  END IF;

  INSERT INTO public.order_conversations (order_id, merchant_id, storefront_id, locked_at)
  VALUES (o.id, o.merchant_id, o.storefront_id, public.order_conversation_lock_at(o))
  ON CONFLICT (order_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO cid;

  RETURN cid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_order_conversation(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.ensure_order_conversation(uuid) TO service_role;

-- 5. Automatic order activity entries -------------------------------------
CREATE OR REPLACE FUNCTION public.log_order_status_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
  label text;
BEGIN
  IF NOT public.merchant_messaging_enabled(NEW.merchant_id) THEN
    RETURN NEW;
  END IF;

  label := CASE NEW.status
    WHEN 'paid' THEN 'Order placed'
    WHEN 'preparing' THEN 'Preparing your order'
    WHEN 'ready' THEN 'Ready for pickup'
    WHEN 'out_for_delivery' THEN 'Out for delivery'
    WHEN 'completed' THEN 'Order completed'
    WHEN 'cancelled' THEN 'Order cancelled'
    WHEN 'refunded' THEN 'Order refunded'
    ELSE NULL
  END;

  IF label IS NULL THEN
    RETURN NEW;
  END IF;

  cid := public.ensure_order_conversation(NEW.id);
  IF cid IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.order_messages (conversation_id, merchant_id, sender, body, event_type)
  VALUES (cid, NEW.merchant_id, 'system', label, NEW.status::text);

  UPDATE public.order_conversations
  SET last_message_at = now(),
      locked_at = public.order_conversation_lock_at(NEW),
      updated_at = now()
  WHERE id = cid;

  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_status_conversation_log
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_order_status_message();

-- 6. Customer access by order token ---------------------------------------
CREATE OR REPLACE FUNCTION public.get_order_conversation(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders;
  cid uuid;
  enabled boolean;
  lock_at timestamp with time zone;
  msgs jsonb;
  business text;
BEGIN
  SELECT * INTO o FROM public.orders WHERE public_token = _token;
  IF o.id IS NULL THEN
    RETURN NULL;
  END IF;

  enabled := public.merchant_messaging_enabled(o.merchant_id);
  SELECT business_name INTO business FROM public.merchants WHERE id = o.merchant_id;
  lock_at := public.order_conversation_lock_at(o);

  SELECT id INTO cid FROM public.order_conversations WHERE order_id = o.id;

  IF cid IS NOT NULL THEN
    UPDATE public.order_messages
    SET read_at = now()
    WHERE conversation_id = cid AND sender <> 'customer' AND read_at IS NULL;

    UPDATE public.order_conversations
    SET customer_unread_count = 0, locked_at = lock_at, updated_at = now()
    WHERE id = cid;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', m.id,
      'sender', m.sender,
      'body', m.body,
      'event_type', m.event_type,
      'created_at', m.created_at
    ) ORDER BY m.created_at), '[]'::jsonb)
    INTO msgs
    FROM public.order_messages m
    WHERE m.conversation_id = cid;
  ELSE
    msgs := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'messaging_enabled', enabled,
    'business_name', business,
    'order_status', o.status,
    'order_reference', o.reference,
    'order_paid', o.paid_at IS NOT NULL,
    'locked_at', lock_at,
    'locked', lock_at IS NOT NULL AND lock_at <= now(),
    'messages', msgs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_conversation(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_conversation(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.send_order_message(_token uuid, _body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders;
  cid uuid;
  lock_at timestamp with time zone;
  clean text;
  total integer;
BEGIN
  clean := btrim(COALESCE(_body, ''));
  IF clean = '' THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  IF length(clean) > 2000 THEN
    RAISE EXCEPTION 'Message is too long';
  END IF;

  SELECT * INTO o FROM public.orders WHERE public_token = _token;
  IF o.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF o.paid_at IS NULL THEN
    RAISE EXCEPTION 'Messaging is available once the order is paid';
  END IF;
  IF NOT public.merchant_messaging_enabled(o.merchant_id) THEN
    RAISE EXCEPTION 'Messaging is not available for this business';
  END IF;

  lock_at := public.order_conversation_lock_at(o);
  IF lock_at IS NOT NULL AND lock_at <= now() THEN
    RAISE EXCEPTION 'This conversation is closed';
  END IF;

  IF NOT public.check_and_increment_rate_limit('order_msg_cust:' || o.id::text, 20, 3600) THEN
    RAISE EXCEPTION 'Too many messages. Please try again later.';
  END IF;

  cid := public.ensure_order_conversation(o.id);

  SELECT count(*) INTO total FROM public.order_messages WHERE conversation_id = cid;
  IF total >= 200 THEN
    RAISE EXCEPTION 'This conversation has reached its message limit';
  END IF;

  INSERT INTO public.order_messages (conversation_id, merchant_id, sender, body)
  VALUES (cid, o.merchant_id, 'customer', clean);

  UPDATE public.order_conversations
  SET last_message_at = now(),
      merchant_unread_count = merchant_unread_count + 1,
      locked_at = lock_at,
      updated_at = now()
  WHERE id = cid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.send_order_message(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.send_order_message(uuid, text) TO anon, authenticated;

-- 7. Merchant send / read -------------------------------------------------
CREATE OR REPLACE FUNCTION public.merchant_send_order_message(_order_id uuid, _body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders;
  cid uuid;
  lock_at timestamp with time zone;
  clean text;
  total integer;
BEGIN
  clean := btrim(COALESCE(_body, ''));
  IF clean = '' THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  IF length(clean) > 2000 THEN
    RAISE EXCEPTION 'Message is too long';
  END IF;

  SELECT * INTO o FROM public.orders WHERE id = _order_id;
  IF o.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = o.merchant_id AND m.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF o.paid_at IS NULL THEN
    RAISE EXCEPTION 'Messaging is available once the order is paid';
  END IF;
  IF NOT public.merchant_messaging_enabled(o.merchant_id) THEN
    RAISE EXCEPTION 'Customer messaging is not included in your plan';
  END IF;

  lock_at := public.order_conversation_lock_at(o);
  IF lock_at IS NOT NULL AND lock_at <= now() THEN
    RAISE EXCEPTION 'This conversation is closed';
  END IF;

  IF NOT public.check_and_increment_rate_limit('order_msg_merch:' || o.id::text, 20, 3600) THEN
    RAISE EXCEPTION 'Too many messages. Please try again later.';
  END IF;

  cid := public.ensure_order_conversation(o.id);

  SELECT count(*) INTO total FROM public.order_messages WHERE conversation_id = cid;
  IF total >= 200 THEN
    RAISE EXCEPTION 'This conversation has reached its message limit';
  END IF;

  INSERT INTO public.order_messages (conversation_id, merchant_id, sender, sender_user_id, body)
  VALUES (cid, o.merchant_id, 'merchant', auth.uid(), clean);

  UPDATE public.order_conversations
  SET last_message_at = now(),
      customer_unread_count = customer_unread_count + 1,
      locked_at = lock_at,
      updated_at = now()
  WHERE id = cid;

  RETURN jsonb_build_object('ok', true, 'conversation_id', cid);
END;
$$;

REVOKE ALL ON FUNCTION public.merchant_send_order_message(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.merchant_send_order_message(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.merchant_mark_conversation_read(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.order_conversations c
    JOIN public.merchants m ON m.id = c.merchant_id
    WHERE c.id = _conversation_id AND m.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  UPDATE public.order_messages
  SET read_at = now()
  WHERE conversation_id = _conversation_id AND sender = 'customer' AND read_at IS NULL;

  UPDATE public.order_conversations
  SET merchant_unread_count = 0, updated_at = now()
  WHERE id = _conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.merchant_mark_conversation_read(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.merchant_mark_conversation_read(uuid) TO authenticated;