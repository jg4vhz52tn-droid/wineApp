-- Phase 1: Lagenabend + live blind tasting.
--
-- Opening, closing and revealing a glass run as database functions. The
-- reveal and the scoring happen in one step, so nobody can read the answer
-- key early and nobody can write their own points.

-- Half points on the 100-point scale (92,5). The 50..100 check stays.
alter table public.guesses alter column rating type numeric(4, 1);

-- ---------------------------------------------------------------------------
-- Preparing the glasses (organizer)
-- ---------------------------------------------------------------------------

-- Finds or creates a wine + vintage in the shared catalogue and returns the
-- vintage. Missing grapes are added; empty catalogue fields are filled in, but
-- existing ones are never overwritten.
create function public.ensure_wine_vintage(
  p_producer text,
  p_name text,
  p_color public.wine_color,
  p_vintage smallint,
  p_grape_name text default null,
  p_region_id uuid default null,
  p_site_id uuid default null,
  p_classification text default null
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_producer text := btrim(coalesce(p_producer, ''));
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_grape_name text := nullif(btrim(coalesce(p_grape_name, '')), '');
  v_grape uuid;
  v_region uuid := p_region_id;
  v_wine uuid;
  v_vintage uuid;
begin
  if v_uid is null or public.is_anonymous() then
    raise exception 'accounts only' using errcode = '42501';
  end if;
  if char_length(v_producer) not between 1 and 120 or char_length(coalesce(v_name, '')) > 160
     or char_length(coalesce(v_grape_name, '')) > 60 then
    raise exception 'invalid wine' using errcode = '22023';
  end if;

  if v_grape_name is not null then
    select id into v_grape from public.grape_varieties where lower(name) = lower(v_grape_name);
    if v_grape is null then
      insert into public.grape_varieties (name, color)
      values (v_grape_name, case when p_color = 'red' then 'red' else 'white' end::public.grape_color)
      returning id into v_grape;
    end if;
  end if;

  if p_site_id is not null then
    select region_id into v_region from public.vineyard_sites where id = p_site_id;
  end if;

  select id into v_wine from public.wines
  where lower(producer) = lower(v_producer) and lower(coalesce(name, '')) = lower(coalesce(v_name, ''))
  limit 1;

  if v_wine is null then
    insert into public.wines (producer, name, color, grape_variety_id, region_id, site_id, classification, created_by)
    values (v_producer, v_name, p_color, v_grape, v_region, p_site_id,
            nullif(btrim(coalesce(p_classification, '')), ''), v_uid)
    returning id into v_wine;
  else
    update public.wines set
      grape_variety_id = coalesce(grape_variety_id, v_grape),
      region_id = coalesce(region_id, v_region),
      site_id = coalesce(site_id, p_site_id),
      classification = coalesce(classification, nullif(btrim(coalesce(p_classification, '')), ''))
    where id = v_wine;
  end if;

  select id into v_vintage from public.wine_vintages
  where wine_id = v_wine and vintage is not distinct from p_vintage;
  if v_vintage is null then
    insert into public.wine_vintages (wine_id, vintage, created_by)
    values (v_wine, p_vintage, v_uid)
    returning id into v_vintage;
  end if;

  return v_vintage;
end;
$$;

-- Creates or updates glass N of an event together with its answer key.
create function public.save_event_glass(
  p_event_id uuid,
  p_glass_number smallint,
  p_vintage_id uuid,
  p_price numeric default null,
  p_is_pirate boolean default false,
  p_brought_by uuid default null,
  p_reference_structure jsonb default null,
  p_reference_aromas text[] default '{}'
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_glass uuid;
  v_status public.round_status;
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'only the organizer prepares glasses' using errcode = '42501';
  end if;

  select id, status into v_glass, v_status from public.event_wines
  where event_id = p_event_id and glass_number = p_glass_number;

  if v_status = 'revealed' then
    raise exception 'glass is already revealed' using errcode = '55000';
  end if;

  if v_glass is null then
    insert into public.event_wines (event_id, glass_number) values (p_event_id, p_glass_number)
    returning id into v_glass;
  end if;

  insert into public.event_wine_secrets (event_wine_id, event_id, vintage_id, price, is_pirate, brought_by,
                                         reference_structure, reference_aromas)
  values (v_glass, p_event_id, p_vintage_id, p_price, coalesce(p_is_pirate, false), p_brought_by,
          p_reference_structure, coalesce(p_reference_aromas, '{}'))
  on conflict (event_wine_id) do update set
    vintage_id = excluded.vintage_id,
    price = excluded.price,
    is_pirate = excluded.is_pirate,
    brought_by = excluded.brought_by,
    reference_structure = excluded.reference_structure,
    reference_aromas = excluded.reference_aromas;

  return v_glass;
end;
$$;

-- New order of the glasses before the evening starts: p_order lists the
-- event_wine ids, the first becomes glass 1.
create function public.reorder_event_glasses(p_event_id uuid, p_order uuid[]) returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'only the organizer orders glasses' using errcode = '42501';
  end if;
  if exists (select 1 from public.event_wines where event_id = p_event_id and status <> 'pending') then
    raise exception 'the tasting has already started' using errcode = '55000';
  end if;
  if (select count(*) from public.event_wines where event_id = p_event_id) <> cardinality(p_order)
     or exists (
       select 1 from unnest(p_order) o(id)
       where not exists (select 1 from public.event_wines w where w.id = o.id and w.event_id = p_event_id)
     ) then
    raise exception 'order must list every glass once' using errcode = '22023';
  end if;

  -- Two steps so the unique (event_id, glass_number) never clashes midway.
  update public.event_wines set glass_number = glass_number + 1000 where event_id = p_event_id;
  update public.event_wines w set glass_number = o.n
  from unnest(p_order) with ordinality as o(id, n)
  where w.id = o.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Scoring (CLAUDE.md 4.2) - rules come from scoring_profiles
-- ---------------------------------------------------------------------------

create function public.compute_glass_scores(p_event_wine_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_secret public.event_wine_secrets%rowtype;
  v_rules jsonb;
  v_grape uuid;
  v_region uuid;
  v_site uuid;
  v_country text;
  v_vintage smallint;
  v_color public.wine_color;
  v_dims text[];
  v_ref jsonb;
  v_ref_source text;
  v_aromas text[];
  v_guessers integer;
  v_guess public.guesses%rowtype;
  v_guess_region uuid;
  v_guess_country text;
  v_dim text;
  v_diff numeric;
  v_ratio numeric;
  v_p integer;
  v_points integer;
  v_structure jsonb;
  v_breakdown jsonb;
  v_struct_max integer;
begin
  select e.* into v_event from public.events e
  join public.event_wines w on w.event_id = e.id
  where w.id = p_event_wine_id;

  select * into v_secret from public.event_wine_secrets where event_wine_id = p_event_wine_id;

  select rules into v_rules from public.scoring_profiles where id = v_event.scoring_profile_id;
  if v_rules is null then
    select rules into v_rules from public.scoring_profiles where is_default;
  end if;
  v_rules := coalesce(v_rules, '{}'::jsonb);
  v_struct_max := coalesce((v_rules ->> 'structure_per_dimension_max')::integer, 0);

  if v_secret.vintage_id is not null then
    select w.grape_variety_id, w.region_id, w.site_id, v.vintage, w.color
      into v_grape, v_region, v_site, v_vintage, v_color
    from public.wine_vintages v
    join public.wines w on w.id = v.wine_id
    where v.id = v_secret.vintage_id;
    if v_region is null and v_site is not null then
      select region_id into v_region from public.vineyard_sites where id = v_site;
    end if;
    select country_code into v_country from public.regions where id = v_region;
  end if;

  -- Tannin only counts for red wine.
  select coalesce(array_agg(d), '{}') into v_dims
  from jsonb_array_elements_text(coalesce(v_rules -> 'structure_dimensions', '[]'::jsonb)) d
  where d <> 'tannin' or v_color = 'red';

  select count(*) into v_guessers from public.guesses where event_wine_id = p_event_wine_id;

  -- Structure reference: the organizer's, otherwise the group average
  -- (needs at least two guesses, else there is nothing to compare with).
  if v_secret.reference_structure is not null and v_secret.reference_structure <> '{}'::jsonb then
    v_ref := v_secret.reference_structure;
    v_ref_source := 'organizer';
  else
    select jsonb_object_agg(d, avg_value) into v_ref from (
      select d, round(avg((g.structure ->> d)::numeric), 1) as avg_value
      from public.guesses g, unnest(v_dims) d
      where g.event_wine_id = p_event_wine_id and jsonb_typeof(g.structure -> d) = 'number'
      group by d
      having count(*) >= 2
    ) s;
    v_ref_source := case when v_ref is null then null else 'group' end;
  end if;

  -- Aroma reference: the organizer's list, otherwise what at least half of
  -- the table (and at least two people) picked.
  if cardinality(coalesce(v_secret.reference_aromas, '{}')) > 0 then
    v_aromas := v_secret.reference_aromas;
  else
    select coalesce(array_agg(a), '{}') into v_aromas from (
      select a from public.guesses g, unnest(g.aromas) a
      where g.event_wine_id = p_event_wine_id
      group by a
      having count(*) >= greatest(2, ceil(v_guessers / 2.0))
    ) s;
  end if;

  for v_guess in select * from public.guesses where event_wine_id = p_event_wine_id loop
    v_points := 0;
    v_breakdown := '{}'::jsonb;

    -- Origin: a guessed site implies its region, a region implies its country.
    v_guess_region := v_guess.region_id;
    if v_guess_region is null and v_guess.site_id is not null then
      select region_id into v_guess_region from public.vineyard_sites where id = v_guess.site_id;
    end if;
    v_guess_country := upper(v_guess.country_code);
    if v_guess_country is null and v_guess_region is not null then
      select country_code into v_guess_country from public.regions where id = v_guess_region;
    end if;

    v_p := case when v_grape is not null and v_guess.grape_variety_id = v_grape
                then coalesce((v_rules ->> 'grape_exact')::integer, 0) else 0 end;
    v_breakdown := v_breakdown || jsonb_build_object('grape', v_p);
    v_points := v_points + v_p;

    v_p := case when v_country is not null and v_guess_country = v_country
                then coalesce((v_rules ->> 'country')::integer, 0) else 0 end;
    v_breakdown := v_breakdown || jsonb_build_object('country', v_p);
    v_points := v_points + v_p;

    v_p := case when v_region is not null and v_guess_region = v_region
                then coalesce((v_rules ->> 'region')::integer, 0) else 0 end;
    v_breakdown := v_breakdown || jsonb_build_object('region', v_p);
    v_points := v_points + v_p;

    v_p := case when v_site is not null and v_guess.site_id = v_site
                then coalesce((v_rules ->> 'site')::integer, 0) else 0 end;
    v_breakdown := v_breakdown || jsonb_build_object('site', v_p);
    v_points := v_points + v_p;

    v_p := 0;
    if v_vintage is not null and v_guess.vintage is not null then
      v_p := case abs(v_guess.vintage - v_vintage)
        when 0 then coalesce((v_rules #>> '{vintage,exact}')::integer, 0)
        when 1 then coalesce((v_rules #>> '{vintage,within_1}')::integer, 0)
        when 2 then coalesce((v_rules #>> '{vintage,within_2}')::integer, 0)
        else 0 end;
    end if;
    v_breakdown := v_breakdown || jsonb_build_object('vintage', v_p);
    v_points := v_points + v_p;

    v_p := 0;
    if coalesce(v_secret.price, 0) > 0 and v_guess.price is not null then
      v_ratio := abs(v_guess.price - v_secret.price) / v_secret.price;
      v_p := case
        when v_ratio <= 0.15 then coalesce((v_rules #>> '{price,within_15_pct}')::integer, 0)
        when v_ratio <= 0.30 then coalesce((v_rules #>> '{price,within_30_pct}')::integer, 0)
        else 0 end;
    end if;
    v_breakdown := v_breakdown || jsonb_build_object('price', v_p);
    v_points := v_points + v_p;

    -- Structure: full points when spot on, nothing from 3 scale points off.
    v_structure := '{}'::jsonb;
    if v_ref is not null then
      foreach v_dim in array v_dims loop
        if jsonb_typeof(v_ref -> v_dim) = 'number' and jsonb_typeof(v_guess.structure -> v_dim) = 'number' then
          v_diff := abs((v_guess.structure ->> v_dim)::numeric - (v_ref ->> v_dim)::numeric);
          v_p := round(v_struct_max * greatest(0, 1 - v_diff / 3.0))::integer;
          v_structure := v_structure || jsonb_build_object(v_dim, v_p);
          v_points := v_points + v_p;
        end if;
      end loop;
    end if;
    v_breakdown := v_breakdown || jsonb_build_object('structure', v_structure, 'structure_reference', v_ref_source);

    v_p := 0;
    if cardinality(v_aromas) > 0 then
      select count(*) * coalesce((v_rules ->> 'aroma_per_hit')::integer, 0) into v_p
      from unnest(v_guess.aromas) a where a = any (v_aromas);
      v_p := least(v_p, coalesce((v_rules ->> 'aroma_max')::integer, 0));
    end if;
    v_breakdown := v_breakdown || jsonb_build_object('aromas', v_p);
    v_points := v_points + v_p;

    v_p := case when v_event.pirate_mode and v_secret.is_pirate and v_guess.marked_pirate
                then coalesce((v_rules ->> 'pirate_found')::integer, 0) else 0 end;
    v_breakdown := v_breakdown || jsonb_build_object('pirate', v_p);
    v_points := v_points + v_p;

    insert into public.scores (event_wine_id, event_id, participant_id, points, breakdown)
    values (p_event_wine_id, v_event.id, v_guess.participant_id, v_points, v_breakdown)
    on conflict (event_wine_id, participant_id) do update set
      points = excluded.points, breakdown = excluded.breakdown, computed_at = now();
  end loop;
end;
$$;

revoke execute on function public.compute_glass_scores(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Round control (organizer only)
-- ---------------------------------------------------------------------------

-- Pours glass N: guests can now guess. Any other open glass is closed.
create function public.open_glass(p_event_wine_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_event uuid;
  v_status public.round_status;
begin
  select event_id, status into v_event, v_status from public.event_wines
  where id = p_event_wine_id for update;
  if v_event is null or not public.is_event_organizer(v_event) then
    raise exception 'only the organizer opens a glass' using errcode = '42501';
  end if;
  if v_status = 'revealed' then
    raise exception 'glass is already revealed' using errcode = '55000';
  end if;

  update public.event_wines set status = 'closed'
  where event_id = v_event and status = 'open' and id <> p_event_wine_id;
  update public.event_wines set status = 'open', opened_at = coalesce(opened_at, now())
  where id = p_event_wine_id;
  update public.events set status = 'live' where id = v_event and status in ('draft', 'planned');
end;
$$;

-- Stops guessing for a glass without revealing it yet.
create function public.close_glass(p_event_wine_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_event uuid;
begin
  select event_id into v_event from public.event_wines where id = p_event_wine_id for update;
  if v_event is null or not public.is_event_organizer(v_event) then
    raise exception 'only the organizer closes a glass' using errcode = '42501';
  end if;
  update public.event_wines set status = 'closed' where id = p_event_wine_id and status = 'open';
end;
$$;

-- The big moment: reveal, score and hand out the collectible cards.
create function public.reveal_glass(p_event_wine_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_event uuid;
  v_status public.round_status;
  v_grape uuid;
  v_region uuid;
  v_site uuid;
begin
  select event_id, status into v_event, v_status from public.event_wines
  where id = p_event_wine_id for update;
  if v_event is null or not public.is_event_organizer(v_event) then
    raise exception 'only the organizer reveals a glass' using errcode = '42501';
  end if;
  if v_status = 'revealed' then
    return;
  end if;
  if v_status = 'pending' then
    raise exception 'glass has not been poured yet' using errcode = '55000';
  end if;

  update public.event_wines set status = 'revealed', revealed_at = now() where id = p_event_wine_id;
  perform public.compute_glass_scores(p_event_wine_id);

  select w.grape_variety_id, coalesce(w.region_id, s.region_id), w.site_id
    into v_grape, v_region, v_site
  from public.event_wine_secrets x
  join public.wine_vintages v on v.id = x.vintage_id
  join public.wines w on w.id = v.wine_id
  left join public.vineyard_sites s on s.id = w.site_id
  where x.event_wine_id = p_event_wine_id;

  -- Grapes and sites added after the seed get their card on first reveal.
  insert into public.collectible_cards (kind, grape_variety_id, title, body)
  select 'grape', g.id, g.name, g.description from public.grape_varieties g
  where g.id = v_grape
    and not exists (select 1 from public.collectible_cards c where c.kind = 'grape' and c.grape_variety_id = g.id);
  insert into public.collectible_cards (kind, site_id, title, body)
  select 'site', s.id, coalesce(s.village || ' ', '') || s.name, s.description from public.vineyard_sites s
  where s.id = v_site
    and not exists (select 1 from public.collectible_cards c where c.kind = 'site' and c.site_id = s.id);

  insert into public.user_cards (user_id, card_id, source_event_id)
  select p.user_id, c.id, v_event
  from public.event_participants p
  cross join public.collectible_cards c
  where p.event_id = v_event
    and p.user_id is not null
    and (p.rsvp = 'yes' or exists (
      select 1 from public.guesses g where g.event_wine_id = p_event_wine_id and g.participant_id = p.id))
    and ((c.kind = 'grape' and c.grape_variety_id = v_grape)
      or (c.kind = 'site' and c.site_id = v_site)
      or (c.kind = 'region' and c.region_id = v_region))
  on conflict do nothing;
end;
$$;

-- Who has already handed in a guess (not what they guessed).
create function public.glass_progress(p_event_id uuid)
returns table (event_wine_id uuid, participant_id uuid)
language sql stable security definer
set search_path = ''
as $$
  select g.event_wine_id, g.participant_id
  from public.guesses g
  where g.event_id = p_event_id
    and (public.is_event_participant(p_event_id) or public.is_event_organizer(p_event_id))
$$;

revoke execute on function public.ensure_wine_vintage(text, text, public.wine_color, smallint, text, uuid, uuid, text) from public;
revoke execute on function public.save_event_glass(uuid, smallint, uuid, numeric, boolean, uuid, jsonb, text[]) from public;
revoke execute on function public.reorder_event_glasses(uuid, uuid[]) from public;
revoke execute on function public.open_glass(uuid) from public;
revoke execute on function public.close_glass(uuid) from public;
revoke execute on function public.reveal_glass(uuid) from public;
revoke execute on function public.glass_progress(uuid) from public;

grant execute on function public.ensure_wine_vintage(text, text, public.wine_color, smallint, text, uuid, uuid, text) to authenticated;
grant execute on function public.save_event_glass(uuid, smallint, uuid, numeric, boolean, uuid, jsonb, text[]) to authenticated;
grant execute on function public.reorder_event_glasses(uuid, uuid[]) to authenticated;
grant execute on function public.open_glass(uuid) to authenticated;
grant execute on function public.close_glass(uuid) to authenticated;
grant execute on function public.reveal_glass(uuid) to authenticated;
grant execute on function public.glass_progress(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: phones follow the evening live. Supabase applies RLS to every
-- change it sends, so guests still get no answer key before the reveal.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table
      public.events, public.event_participants, public.event_wines, public.scores, public.cost_items;
  end if;
end;
$$;
