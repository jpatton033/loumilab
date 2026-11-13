create or replace function public.resolve_customer_slug(_slug text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from merchant_storefronts where slug = lower(_slug)) then 'store'
    when exists (select 1 from spaces_apps where slug = lower(_slug)) then 'space'
    when exists (select 1 from merchant_local_profiles where slug = lower(_slug)) then 'local'
  end;
$$;
grant execute on function public.resolve_customer_slug(text) to anon, authenticated;

create or replace function public.guard_customer_slug()
returns trigger language plpgsql security definer set search_path = public as $$
declare s text := lower(new.slug);
begin
  if s is null then return new; end if;
  if tg_op = 'UPDATE' and new.slug is not distinct from old.slug then return new; end if;
  if s = any (array['www','app','apps','admin','api','mail','email','smtp','imap','ftp','cdn','static','assets','spaces','orders','local','help','support','status','docs','blog','news','the-dot','thedot','resources','store','shop','auth','login','sign-in','signup','account','dashboard','billing','pay','payments','checkout','dev','staging','preview','test','loumilab','vurtti','id','m']) then
    raise exception 'That name is reserved. Please choose another.';
  end if;
  if tg_table_name <> 'merchant_storefronts' and exists (select 1 from merchant_storefronts where slug = s) then
    raise exception 'That name is already taken.';
  end if;
  if tg_table_name <> 'spaces_apps' and exists (select 1 from spaces_apps where slug = s) then
    raise exception 'That name is already taken.';
  end if;
  -- Local listings may share a slug with their own storefront (the storefront wins).
  if tg_table_name = 'spaces_apps' and exists (select 1 from merchant_local_profiles where slug = s) then
    raise exception 'That name is already taken.';
  end if;
  return new;
end $$;

create trigger guard_customer_slug before insert or update of slug on public.merchant_storefronts for each row execute function public.guard_customer_slug();
create trigger guard_customer_slug before insert or update of slug on public.spaces_apps for each row execute function public.guard_customer_slug();
create trigger guard_customer_slug before insert or update of slug on public.merchant_local_profiles for each row execute function public.guard_customer_slug();