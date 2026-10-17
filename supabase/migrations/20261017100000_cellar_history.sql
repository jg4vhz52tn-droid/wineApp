-- Cellar as a portfolio: every purchase / opened bottle is an event, every
-- value we know (typed in, estimated, later AI or market price) a valuation.
-- The value-over-time chart is computed from these two tables.

create type public.cellar_event_kind as enum ('purchase', 'consume', 'adjust');
create type public.valuation_source as enum ('manual', 'estimate', 'ai', 'market');

create table public.cellar_events (
  id uuid primary key default gen_random_uuid(),
  cellar_item_id uuid not null references public.cellar_items (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  kind public.cellar_event_kind not null,
  quantity integer not null check (quantity <> 0), -- + bought, - opened/removed
  unit_price numeric(10, 2) check (unit_price >= 0), -- paid, or value when opened
  happened_on date not null default current_date,
  note text check (char_length(note) <= 1000),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index cellar_events_item_idx on public.cellar_events (cellar_item_id, happened_on);
create index cellar_events_org_idx on public.cellar_events (org_id);

create table public.cellar_valuations (
  id uuid primary key default gen_random_uuid(),
  cellar_item_id uuid not null references public.cellar_items (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  value numeric(10, 2) not null check (value >= 0), -- per bottle
  source public.valuation_source not null default 'manual',
  source_url text,
  valued_on date not null default current_date,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index cellar_valuations_item_idx on public.cellar_valuations (cellar_item_id, valued_on desc);
create index cellar_valuations_org_idx on public.cellar_valuations (org_id);

-- org_id is denormalized for RLS - keep it consistent with the item.
create function public.check_cellar_org() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.cellar_items c where c.id = new.cellar_item_id and c.org_id = new.org_id
  ) then
    raise exception 'cellar item % does not belong to org %', new.cellar_item_id, new.org_id;
  end if;
  return new;
end;
$$;

create trigger cellar_events_check_org before insert or update on public.cellar_events
  for each row execute function public.check_cellar_org();
create trigger cellar_valuations_check_org before insert or update on public.cellar_valuations
  for each row execute function public.check_cellar_org();

alter table public.cellar_events enable row level security;
alter table public.cellar_valuations enable row level security;

create policy "org members read cellar events" on public.cellar_events
  for select to authenticated using (public.is_org_member(org_id));
create policy "org members write cellar events" on public.cellar_events
  for insert to authenticated with check (public.is_org_member(org_id) and not public.is_anonymous());
create policy "org members delete cellar events" on public.cellar_events
  for delete to authenticated using (public.is_org_member(org_id));

create policy "org members read valuations" on public.cellar_valuations
  for select to authenticated using (public.is_org_member(org_id));
create policy "org members write valuations" on public.cellar_valuations
  for insert to authenticated with check (public.is_org_member(org_id) and not public.is_anonymous());
create policy "org members delete valuations" on public.cellar_valuations
  for delete to authenticated using (public.is_org_member(org_id));

grant select, delete on public.cellar_events, public.cellar_valuations to authenticated;
grant insert (cellar_item_id, org_id, kind, quantity, unit_price, happened_on, note)
  on public.cellar_events to authenticated;
grant insert (cellar_item_id, org_id, value, source, source_url, valued_on)
  on public.cellar_valuations to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs - run as the caller, so RLS still applies; they just keep the
-- several inserts of one action together in one transaction.
-- ---------------------------------------------------------------------------

-- Adds bottles: finds or creates the wine and vintage, then the cellar item
-- and its purchase event.
create function public.add_cellar_bottles(
  p_org_id uuid,
  p_producer text,
  p_name text,
  p_color public.wine_color,
  p_vintage smallint,
  p_quantity integer,
  p_purchase_price numeric default null,
  p_purchased_on date default current_date,
  p_grape_variety_id uuid default null,
  p_region_id uuid default null,
  p_classification text default null,
  p_drink_from smallint default null,
  p_drink_until smallint default null,
  p_storage_shelf text default null,
  p_storage_compartment text default null,
  p_storage_row text default null
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_wine_id uuid;
  v_vintage_id uuid;
  v_item_id uuid;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'quantity must be at least 1' using errcode = '22023';
  end if;

  select id into v_wine_id from public.wines
  where lower(producer) = lower(btrim(p_producer))
    and lower(coalesce(name, '')) = lower(btrim(coalesce(p_name, '')))
  limit 1;

  if v_wine_id is null then
    insert into public.wines (producer, name, color, grape_variety_id, region_id, classification)
    values (btrim(p_producer), nullif(btrim(coalesce(p_name, '')), ''), p_color, p_grape_variety_id, p_region_id,
            nullif(btrim(coalesce(p_classification, '')), ''))
    returning id into v_wine_id;
  end if;

  select id into v_vintage_id from public.wine_vintages
  where wine_id = v_wine_id and vintage is not distinct from p_vintage;

  if v_vintage_id is null then
    insert into public.wine_vintages (wine_id, vintage) values (v_wine_id, p_vintage)
    returning id into v_vintage_id;
  end if;

  insert into public.cellar_items (
    org_id, vintage_id, quantity, purchase_price, purchased_on, drink_from, drink_until,
    drink_window_source, storage_shelf, storage_compartment, storage_row
  ) values (
    p_org_id, v_vintage_id, p_quantity, p_purchase_price, coalesce(p_purchased_on, current_date),
    p_drink_from, p_drink_until, case when p_drink_from is not null then 'manual'::public.drink_window_source end,
    nullif(p_storage_shelf, ''), nullif(p_storage_compartment, ''), nullif(p_storage_row, '')
  ) returning id into v_item_id;

  insert into public.cellar_events (cellar_item_id, org_id, kind, quantity, unit_price, happened_on)
  values (v_item_id, p_org_id, 'purchase', p_quantity, p_purchase_price, coalesce(p_purchased_on, current_date));

  return v_item_id;
end;
$$;

-- Opens (drinks) bottles: lowers the quantity and records what they were worth.
create function public.open_cellar_bottle(
  p_item_id uuid,
  p_count integer default 1,
  p_value numeric default null,
  p_note text default null
) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_item public.cellar_items%rowtype;
begin
  select * into v_item from public.cellar_items where id = p_item_id for update;
  if not found then
    raise exception 'cellar item not found' using errcode = 'P0002';
  end if;
  if p_count < 1 or p_count > v_item.quantity then
    raise exception 'not enough bottles' using errcode = '22023';
  end if;

  update public.cellar_items set quantity = quantity - p_count where id = p_item_id;
  insert into public.cellar_events (cellar_item_id, org_id, kind, quantity, unit_price, note)
  values (p_item_id, v_item.org_id, 'consume', -p_count, p_value, p_note);

  return v_item.quantity - p_count;
end;
$$;

revoke execute on function public.add_cellar_bottles from public;
revoke execute on function public.open_cellar_bottle from public;
grant execute on function public.add_cellar_bottles to authenticated;
grant execute on function public.open_cellar_bottle to authenticated;
