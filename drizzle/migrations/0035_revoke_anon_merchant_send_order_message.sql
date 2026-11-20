REVOKE EXECUTE ON FUNCTION public.merchant_send_order_message(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merchant_send_order_message(uuid, text) TO authenticated, service_role;