-- Geschmacks-DNA: computed from your own ratings (tasting_notes) and your
-- Rate-Bögen at evenings (guesses on revealed glasses). Private: only you
-- can compute or read your profile. No AI involved - the short text on top
-- is written by the app (Gemini) from these numbers and stored as summary.

create function public.taste_dna() returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_dims text[] := array['sweetness', 'acidity', 'body', 'tannin', 'finish'];
  v_count integer;
  v_median numeric;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  create temporary table if not exists pg_temp.dna_tastings (
    source text, rating numeric, structure jsonb, aromas text[],
    color text, grape text, region text, price numeric
  ) on commit drop;
  truncate pg_temp.dna_tastings;

  -- Own ratings in "Meine Weine". Price: what you paid, otherwise the cheapest shop price found.
  insert into pg_temp.dna_tastings
  select 'note', n.rating, n.structure, n.aromas, w.color::text, g.name, r.name,
         coalesce(
           (select min(c.purchase_price) from public.cellar_items c
             join public.organization_members m on m.org_id = c.org_id and m.user_id = v_uid
             where c.vintage_id = n.vintage_id),
           (select min(ph.price) from public.price_history ph where ph.vintage_id = n.vintage_id))
  from public.tasting_notes n
  join public.wine_vintages v on v.id = n.vintage_id
  join public.wines w on w.id = v.wine_id
  left join public.grape_varieties g on g.id = w.grape_variety_id
  left join public.regions r on r.id = w.region_id
  where n.user_id = v_uid;

  -- Rate-Bögen of revealed glasses: your rating and impressions of the real wine.
  insert into pg_temp.dna_tastings
  select 'guess', q.rating, q.structure, q.aromas, w.color::text, g.name, r.name, x.price
  from public.guesses q
  join public.event_participants p on p.id = q.participant_id and p.user_id = v_uid
  join public.event_wines ew on ew.id = q.event_wine_id and ew.status = 'revealed'
  join public.event_wine_secrets x on x.event_wine_id = q.event_wine_id
  join public.wine_vintages v on v.id = x.vintage_id
  join public.wines w on w.id = v.wine_id
  left join public.grape_varieties g on g.id = w.grape_variety_id
  left join public.regions r on r.id = w.region_id;

  select count(*) filter (where rating is not null),
         percentile_cont(0.5) within group (order by rating)
    into v_count, v_median
  from pg_temp.dna_tastings;

  v_result := jsonb_build_object(
    'ready', v_count >= 5,
    'ratings', v_count,
    'needed', greatest(0, 5 - v_count),
    'median', round(v_median, 1),
    'computed_at', now()
  );

  if v_count >= 5 then
    v_result := v_result || jsonb_build_object(
      -- Structure of the wines you rate in your top half.
      'structure', (
        select coalesce(jsonb_object_agg(d, jsonb_build_object('value', avg_v, 'n', n)), '{}'::jsonb)
        from (
          select d, round(avg((t.structure ->> d)::numeric), 1) as avg_v, count(*) as n
          from pg_temp.dna_tastings t, unnest(v_dims) d
          where t.rating >= v_median and jsonb_typeof(t.structure -> d) = 'number'
          group by d
        ) s
      ),
      'aromas', (
        select coalesce(jsonb_agg(jsonb_build_object('aroma', a, 'n', n) order by n desc, a), '[]'::jsonb)
        from (
          select a, count(*) as n
          from pg_temp.dna_tastings t, unnest(t.aromas) a
          where t.rating >= v_median
          group by a
          order by count(*) desc, a
          limit 8
        ) s
      ),
      'grapes', (
        select coalesce(jsonb_agg(jsonb_build_object('name', grape, 'avg', avg_r, 'n', n) order by avg_r desc, n desc), '[]'::jsonb)
        from (
          select grape, round(avg(rating), 1) as avg_r, count(*) as n
          from pg_temp.dna_tastings where grape is not null and rating is not null
          group by grape
        ) s
      ),
      'regions', (
        select coalesce(jsonb_agg(jsonb_build_object('name', region, 'avg', avg_r, 'n', n) order by avg_r desc, n desc), '[]'::jsonb)
        from (
          select region, round(avg(rating), 1) as avg_r, count(*) as n
          from pg_temp.dna_tastings where region is not null and rating is not null
          group by region
        ) s
      ),
      'colors', (
        select coalesce(jsonb_object_agg(color, jsonb_build_object('avg', avg_r, 'n', n)), '{}'::jsonb)
        from (
          select color, round(avg(rating), 1) as avg_r, count(*) as n
          from pg_temp.dna_tastings where color is not null and rating is not null
          group by color
        ) s
      ),
      -- Average rating per price band - where more money stops buying more joy.
      'prices', (
        select coalesce(jsonb_agg(jsonb_build_object('band', band, 'from', lo, 'avg', avg_r, 'n', n) order by lo), '[]'::jsonb)
        from (
          select band, min(lo) as lo, round(avg(rating), 1) as avg_r, count(*) as n
          from (
            select rating,
              case when price < 15 then 'unter 15 €' when price < 25 then '15–25 €' when price < 40 then '25–40 €'
                   when price < 70 then '40–70 €' else 'ab 70 €' end as band,
              case when price < 15 then 0 when price < 25 then 15 when price < 40 then 25
                   when price < 70 then 40 else 70 end as lo
            from pg_temp.dna_tastings where price > 0 and rating is not null
          ) b
          group by band
        ) s
      )
    );
  end if;

  -- For comparison: what your group (people you shared an evening with)
  -- finds in the wines they rate well. Only averages, no names.
  v_result := v_result || jsonb_build_object('group_structure', (
    with runde as (
      select distinct p2.user_id
      from public.event_participants p1
      join public.event_participants p2 on p2.event_id = p1.event_id
      where p1.user_id = v_uid and p2.user_id is not null and p2.user_id <> v_uid
    ),
    theirs as (
      select n.rating, n.structure from public.tasting_notes n
      where n.is_public and n.user_id in (select user_id from runde)
      union all
      select q.rating, q.structure from public.guesses q
      join public.event_participants p on p.id = q.participant_id and p.user_id in (select user_id from runde)
      join public.event_wines ew on ew.id = q.event_wine_id and ew.status = 'revealed'
    )
    select coalesce(jsonb_object_agg(d, jsonb_build_object('value', avg_v, 'n', n)), '{}'::jsonb)
    from (
      select d, round(avg((t.structure ->> d)::numeric), 1) as avg_v, count(*) as n
      from theirs t, unnest(v_dims) d
      where t.rating >= 85 and jsonb_typeof(t.structure -> d) = 'number'
      group by d
      having count(*) >= 3
    ) s
  ));

  -- The nose: how well you recognise wines blind (needs revealed glasses).
  v_result := v_result || jsonb_build_object('nose', (
    with mine as (
      select q.grape_variety_id as guessed, w.grape_variety_id as actual, q.vintage as guessed_vintage,
             v.vintage as actual_vintage, s.points
      from public.guesses q
      join public.event_participants p on p.id = q.participant_id and p.user_id = v_uid
      join public.event_wines ew on ew.id = q.event_wine_id and ew.status = 'revealed'
      join public.event_wine_secrets x on x.event_wine_id = q.event_wine_id
      join public.wine_vintages v on v.id = x.vintage_id
      join public.wines w on w.id = v.wine_id
      left join public.scores s on s.event_wine_id = q.event_wine_id and s.participant_id = q.participant_id
    )
    select jsonb_build_object(
      'glasses', count(*),
      'grape_guesses', count(*) filter (where guessed is not null and actual is not null),
      'grape_hits', count(*) filter (where guessed is not null and guessed = actual),
      'vintage_guesses', count(*) filter (where guessed_vintage is not null and actual_vintage is not null),
      'vintage_close', count(*) filter (where abs(guessed_vintage - actual_vintage) <= 1),
      'avg_points', round(avg(points), 1),
      'confusions', (
        select coalesce(jsonb_agg(jsonb_build_object('actual', ga.name, 'guessed', gg.name, 'n', n) order by n desc), '[]'::jsonb)
        from (
          select actual, guessed, count(*) as n from mine
          where guessed is not null and actual is not null and guessed <> actual
          group by actual, guessed order by count(*) desc limit 3
        ) c
        join public.grape_varieties ga on ga.id = c.actual
        join public.grape_varieties gg on gg.id = c.guessed
      )
    )
    from mine
  ));

  insert into public.taste_profiles (user_id, dimensions, updated_at)
  values (v_uid, v_result, now())
  on conflict (user_id) do update set dimensions = excluded.dimensions, updated_at = now();

  return v_result;
end;
$$;

-- The short text in words, written by the app from the numbers above.
create function public.set_taste_summary(p_summary text) returns void
language sql security definer
set search_path = ''
as $$
  update public.taste_profiles set summary = left(btrim(p_summary), 1200)
  where user_id = auth.uid();
$$;

-- The DNA text counts against the daily AI limit, too.
alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check check (kind in ('scan', 'prices', 'dna'));

create or replace function public.claim_ai_credit(p_kind text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_limit integer := case p_kind when 'scan' then 25 when 'prices' then 20 when 'dna' then 10 else 0 end;
  v_count integer;
begin
  if auth.uid() is null or public.is_anonymous() or v_limit = 0 then
    return false;
  end if;
  insert into public.ai_usage (user_id, day, kind, count) values (auth.uid(), current_date, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = public.ai_usage.count + 1
  returning count into v_count;
  return v_count <= v_limit;
end;
$$;

revoke execute on function public.taste_dna() from public;
revoke execute on function public.set_taste_summary(text) from public;
grant execute on function public.taste_dna() to authenticated;
grant execute on function public.set_taste_summary(text) to authenticated;
