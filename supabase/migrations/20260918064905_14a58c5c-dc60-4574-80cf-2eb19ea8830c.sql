CREATE OR REPLACE FUNCTION public.send_order_message(_token uuid, _body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF public.check_and_increment_rate_limit('order_msg_cust:' || o.id::text, 20, 3600) THEN
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
$function$;

CREATE OR REPLACE FUNCTION public.merchant_send_order_message(_order_id uuid, _body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o public.orders;
  cid uuid;
  lock_at timestamp with time zone;
  clean text;
  total integer;
  owns boolean;
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

  SELECT EXISTS (
    SELECT 1 FROM public.merchants m
    WHERE m.id = o.merchant_id AND m.owner_id = auth.uid()
  ) INTO owns;
  IF NOT owns THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF o.paid_at IS NULL THEN
    RAISE EXCEPTION 'Messaging is available once the order is paid';
  END IF;
  IF NOT public.merchant_messaging_enabled(o.merchant_id) THEN
    RAISE EXCEPTION 'Messaging is not included in your current plan';
  END IF;

  lock_at := public.order_conversation_lock_at(o);
  IF lock_at IS NOT NULL AND lock_at <= now() THEN
    RAISE EXCEPTION 'This conversation is closed';
  END IF;

  IF public.check_and_increment_rate_limit('order_msg_merch:' || o.id::text, 30, 3600) THEN
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
      merchant_unread_count = 0,
      locked_at = lock_at,
      updated_at = now()
  WHERE id = cid;

  RETURN jsonb_build_object('ok', true);
END;
$function$;