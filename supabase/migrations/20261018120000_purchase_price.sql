-- Fix the purchase price afterwards (forgot it when adding the bottles):
-- updates the bottle and its purchase entry together, so value, gain and
-- history stay consistent.

create function public.set_purchase_price(p_item_id uuid, p_price numeric) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.cellar_items where id = p_item_id;
  if v_org is null or not public.is_org_member(v_org) or public.is_anonymous() then
    raise exception 'not your bottle' using errcode = '42501';
  end if;
  if p_price is not null and (p_price < 0 or p_price > 1000000) then
    raise exception 'invalid price' using errcode = '22023';
  end if;
  update public.cellar_items set purchase_price = round(p_price, 2) where id = p_item_id;
  update public.cellar_events set unit_price = round(p_price, 2)
  where cellar_item_id = p_item_id and kind = 'purchase';
end;
$$;

revoke execute on function public.set_purchase_price(uuid, numeric) from public;
grant execute on function public.set_purchase_price(uuid, numeric) to authenticated;
