-- Named racks: a cellar can have several storage places ("Keller Ferienhaus",
-- "Weinkühlschrank Küche"), each with its own grid of compartments × rows.

create table public.cellar_racks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  compartments smallint not null default 4 check (compartments between 1 and 20),
  rows smallint not null default 4 check (rows between 1 and 30),
  created_at timestamptz not null default now(),
  unique (org_id, name)
);
create index cellar_racks_org_idx on public.cellar_racks (org_id);

alter table public.cellar_items
  add column rack_id uuid references public.cellar_racks (id) on delete set null;

-- A bottle can only sit in a rack of its own cellar.
create function public.check_cellar_rack() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.rack_id is not null and not exists (
    select 1 from public.cellar_racks r where r.id = new.rack_id and r.org_id = new.org_id
  ) then
    raise exception 'rack % does not belong to org %', new.rack_id, new.org_id;
  end if;
  return new;
end;
$$;

create trigger cellar_items_check_rack before insert or update of rack_id, org_id on public.cellar_items
  for each row execute function public.check_cellar_rack();

alter table public.cellar_racks enable row level security;

create policy "org members read racks" on public.cellar_racks
  for select to authenticated using (public.is_org_member(org_id));
create policy "org members add racks" on public.cellar_racks
  for insert to authenticated with check (public.is_org_member(org_id) and not public.is_anonymous());
create policy "org members edit racks" on public.cellar_racks
  for update to authenticated using (public.is_org_member(org_id));
create policy "org members remove racks" on public.cellar_racks
  for delete to authenticated using (public.is_org_member(org_id));

grant select, delete on public.cellar_racks to authenticated;
grant insert (org_id, name, compartments, rows) on public.cellar_racks to authenticated;
grant update (name, compartments, rows) on public.cellar_racks to authenticated;

-- add_cellar_bottles gains a rack and a grape name (looked up in the catalogue).
drop function public.add_cellar_bottles(
  uuid, text, text, public.wine_color, smallint, integer, numeric, date, uuid, uuid, text,
  smallint, smallint, text, text, text
);

create function public.add_cellar_bottles(
  p_org_id uuid,
  p_producer text,
  p_name text,
  p_color public.wine_color,
  p_vintage smallint,
  p_quantity integer,
  p_purchase_price numeric default null,
  p_purchased_on date default current_date,
  p_grape_name text default null,
  p_classification text default null,
  p_drink_from smallint default null,
  p_drink_until smallint default null,
  p_rack_id uuid default null,
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
  v_grape_id uuid;
  v_window public.drink_window_source;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'quantity must be at least 1' using errcode = '22023';
  end if;

  select id into v_grape_id from public.grape_varieties where lower(name) = lower(btrim(coalesce(p_grape_name, '')));

  select id into v_wine_id from public.wines
  where lower(producer) = lower(btrim(p_producer))
    and lower(coalesce(name, '')) = lower(btrim(coalesce(p_name, '')))
  limit 1;

  if v_wine_id is null then
    insert into public.wines (producer, name, color, grape_variety_id, classification)
    values (btrim(p_producer), nullif(btrim(coalesce(p_name, '')), ''), p_color, v_grape_id,
            nullif(btrim(coalesce(p_classification, '')), ''))
    returning id into v_wine_id;
  end if;

  select id into v_vintage_id from public.wine_vintages
  where wine_id = v_wine_id and vintage is not distinct from p_vintage;

  if v_vintage_id is null then
    insert into public.wine_vintages (wine_id, vintage) values (v_wine_id, p_vintage)
    returning id into v_vintage_id;
  end if;

  if p_drink_from is not null or p_drink_until is not null then
    v_window := 'manual';
  end if;

  insert into public.cellar_items (
    org_id, vintage_id, quantity, purchase_price, purchased_on, drink_from, drink_until,
    drink_window_source, rack_id, storage_compartment, storage_row
  ) values (
    p_org_id, v_vintage_id, p_quantity, p_purchase_price, coalesce(p_purchased_on, current_date),
    p_drink_from, p_drink_until, v_window, p_rack_id,
    nullif(p_storage_compartment, ''), nullif(p_storage_row, '')
  ) returning id into v_item_id;

  insert into public.cellar_events (cellar_item_id, org_id, kind, quantity, unit_price, happened_on)
  values (v_item_id, p_org_id, 'purchase', p_quantity, p_purchase_price, coalesce(p_purchased_on, current_date));

  return v_item_id;
end;
$$;

revoke execute on function public.add_cellar_bottles from public;
grant execute on function public.add_cellar_bottles to authenticated;

-- Demo cellar with named racks (replaces the version from seed.sql).
create or replace function public.create_demo_cellar() returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_org uuid;
  v_row record;
  v_item uuid;
  v_rack uuid;
  v_count integer := 0;
begin
  select personal_org_id into v_org from public.profiles where id = auth.uid();
  if v_org is null then
    raise exception 'no personal cellar' using errcode = 'P0002';
  end if;

  insert into public.cellar_racks (org_id, name, compartments, rows)
  values (v_org, 'Keller · Regal links', 2, 2), (v_org, 'Keller · Regal rechts', 2, 2), (v_org, 'Weinkühlschrank', 2, 2)
  on conflict (org_id, name) do nothing;

  for v_row in
    select v.id as vintage_id, d.*
    from (values
      ('Scharzhofberger Riesling', 6, 38.0, date '2022-11-12', 2024, 2040, 'Keller · Regal links', '1', '1', 52.0),
      ('Erdener Prälat Riesling Alte Reben', 3, 42.0, date '2021-09-04', 2023, 2035, 'Keller · Regal links', '1', '2', 55.0),
      ('Wehlener Sonnenuhr Riesling', 4, 29.0, date '2019-05-20', 2022, 2040, 'Keller · Regal links', '2', '1', 41.0),
      ('Kiedrich Gräfenberg Riesling', 2, 58.0, date '2022-03-15', 2025, 2038, 'Keller · Regal links', '2', '2', 64.0),
      ('Westhofen Morstein Riesling', 2, 95.0, date '2021-10-01', 2026, 2045, 'Keller · Regal rechts', '1', '1', 160.0),
      ('Hermannshöhle Riesling', 3, 48.0, date '2023-01-28', 2026, 2042, 'Keller · Regal rechts', '1', '2', 54.0),
      ('Kirchenstück Riesling', 1, 120.0, date '2020-12-18', 2024, 2036, 'Keller · Regal rechts', '2', '1', 150.0),
      ('Escherndorfer Lump Silvaner', 5, 28.0, date '2023-06-10', 2024, 2030, 'Weinkühlschrank', '1', '1', 29.0),
      ('Bürgstadter Centgrafenberg Spätburgunder', 3, 65.0, date '2021-11-30', 2023, 2034, 'Weinkühlschrank', '2', '1', 85.0),
      ('Fellbacher Lämmler Lemberger', 4, 32.0, date '2022-08-08', 2023, 2027, 'Weinkühlschrank', '2', '2', 33.0)
    ) as d(wine, qty, price, bought, drink_from, drink_until, rack, compartment, row_no, value_now)
    join public.wines w on w.name = d.wine
    join public.wine_vintages v on v.wine_id = w.id
  loop
    select id into v_rack from public.cellar_racks where org_id = v_org and name = v_row.rack;

    insert into public.cellar_items (org_id, vintage_id, quantity, purchase_price, purchased_on,
      drink_from, drink_until, drink_window_source, rack_id, storage_compartment, storage_row)
    values (v_org, v_row.vintage_id, v_row.qty, v_row.price, v_row.bought,
      v_row.drink_from, v_row.drink_until, 'manual', v_rack, v_row.compartment, v_row.row_no)
    returning id into v_item;

    insert into public.cellar_events (cellar_item_id, org_id, kind, quantity, unit_price, happened_on)
    values (v_item, v_org, 'purchase', v_row.qty, v_row.price, v_row.bought);

    insert into public.cellar_valuations (cellar_item_id, org_id, value, source, valued_on)
    values
      (v_item, v_org, round((v_row.price + v_row.value_now) / 2, 2), 'manual',
        v_row.bought + ((current_date - v_row.bought) / 2)),
      (v_item, v_org, v_row.value_now, 'manual', current_date);

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.create_demo_cellar() from public;
grant execute on function public.create_demo_cellar() to authenticated;
