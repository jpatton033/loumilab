REVOKE ALL ON FUNCTION public.storefront_can_publish(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_storefront_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.owns_merchant_media_path(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_merchant_media_path(text) TO authenticated;