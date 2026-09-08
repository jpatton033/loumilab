drop policy "Published storefronts are public" on public.merchant_storefronts;

create policy "Published storefronts are public"
on public.merchant_storefronts
for select
to public
using (is_published = true);