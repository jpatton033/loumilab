create or replace function public.guard_customer_slug()
returns trigger language plpgsql security definer set search_path = public as $$
declare s text := lower(new.slug);
begin
  if s is null then return new; end if;
  if tg_op = 'UPDATE' and new.slug is not distinct from old.slug then return new; end if;
  if s = any (array['www','app','apps','admin','api','mail','email','smtp','imap','ftp','cdn','static','assets','spaces','orders','local','help','support','status','docs','blog','news','the-dot','thedot','resources','store','shop','auth','login','sign-in','signup','account','dashboard','billing','pay','payments','checkout','dev','staging','preview','test','loumilab','vurtti','id','m']) then
    raise exception 'That name is reserved. Please choose another.';
  end if;
  -- Local listings may share a name with a storefront (the storefront wins); stores and Spaces apps never collide.
  if tg_table_name = 'spaces_apps' and (exists (select 1 from merchant_storefronts where slug = s) or exists (select 1 from merchant_local_profiles where slug = s)) then
    raise exception 'That name is already taken.';
  end if;
  if tg_table_name in ('merchant_storefronts','merchant_local_profiles') and exists (select 1 from spaces_apps where slug = s) then
    raise exception 'That name is already taken.';
  end if;
  return new;
end $$;