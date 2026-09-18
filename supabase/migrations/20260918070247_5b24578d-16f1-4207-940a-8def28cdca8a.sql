UPDATE public.merchants SET plan_slug = 'launch' WHERE business_name = 'Jay''s Kitchen';
UPDATE public.orders SET status = 'completed' WHERE public_token = '4f055989-2582-415b-8c5e-803989dcb5a8';
DELETE FROM public.order_messages WHERE conversation_id IN (SELECT id FROM public.order_conversations);
DELETE FROM public.order_conversations WHERE order_id IN (SELECT id FROM public.orders WHERE public_token = '4f055989-2582-415b-8c5e-803989dcb5a8');
DELETE FROM public.rate_limits WHERE key LIKE 'order_msg%';