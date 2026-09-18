CREATE OR REPLACE FUNCTION public.order_conversation_lock_at(_order public.orders)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _order.status IN ('completed', 'cancelled', 'refunded')
      THEN _order.updated_at + interval '7 days'
    ELSE NULL
  END
$$;