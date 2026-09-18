REVOKE EXECUTE ON FUNCTION public.ensure_order_conversation(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.merchant_messaging_enabled(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_status_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.order_conversation_lock_at(public.orders) FROM PUBLIC, anon, authenticated;