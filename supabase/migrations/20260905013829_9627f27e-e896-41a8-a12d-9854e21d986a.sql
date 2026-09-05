create or replace function public.get_public_store_context(_storefront_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'accepting_orders', m.accepting_orders,
    'industry_slug', m.industry_slug
  )
  from public.merchant_storefronts s
  join public.merchants m on m.id = s.merchant_id
  where s.id = _storefront_id
    and (s.is_published or s.status in ('published', 'paused'))
$$;

revoke all on function public.get_public_store_context(uuid) from public;
grant execute on function public.get_public_store_context(uuid) to anon, authenticated;