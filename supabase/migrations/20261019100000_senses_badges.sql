-- "Deine Sinne" (eye, nose, palate) and badges. Both are computed from what
-- you did - guided tastings, evenings, collected cards - and badges are only
-- ever awarded by award_badges(), never written by the app.

insert into public.badges (code, title, description, icon, criteria) values
  ('first_guided', 'Erster Schluck', 'Die erste geführte Verkostung gemacht.', 'glass', '{"guided": 1}'),
  ('guided_10', 'Weinschüler', '10 geführte Verkostungen.', 'book', '{"guided": 10}'),
  ('aromas_10', 'Spürnase', '10 Aromen in geführten Verkostungen gefunden.', 'nose', '{"aromas_found": 10}'),
  ('aromas_40', 'Aromajäger', '40 Aromen gefunden.', 'flower', '{"aromas_found": 40}'),
  ('color_eye', 'Farbauge', '5-mal die typische Farbe getroffen.', 'eye', '{"shade_matches": 5}'),
  ('acidity_pro', 'Säure-Profi', '5-mal die Säure auf ±1 eingeschätzt.', 'lemon', '{"acidity_close": 5}'),
  ('long_finish', 'Langer Atem', '5-mal den Abgang mit der Stoppuhr gemessen.', 'timer', '{"finish_measured": 5}')
on conflict (code) do nothing;

-- Everything the senses and badges are computed from, for the signed-in user.
create function public.my_progress_stats() returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with g as (
    select n.guided from public.tasting_notes n
    where n.user_id = auth.uid() and n.guided is not null
  ),
  palate as (
    select (e.value ->> 'mine')::numeric as mine, (e.value ->> 'expected')::numeric as expected, e.key as dim
    from g, jsonb_each(coalesce(g.guided -> 'palate', '{}'::jsonb)) e
    where jsonb_typeof(e.value -> 'mine') = 'number' and jsonb_typeof(e.value -> 'expected') = 'number'
  ),
  mine as (
    select p.id from public.event_participants p where p.user_id = auth.uid()
  )
  select jsonb_build_object(
    'guided', (select count(*) from g),
    'shade_matches', (select count(*) from g where g.guided ->> 'shadeMatch' = 'true'),
    'shade_tries', (select count(*) from g where g.guided ? 'shade' and g.guided ->> 'shade' is not null),
    'aromas_found', (
      select coalesce(sum(jsonb_array_length(coalesce(g.guided -> 'found', '[]'::jsonb))
        + jsonb_array_length(coalesce(g.guided -> 'foundAfterHint', '[]'::jsonb))), 0) from g),
    'aromas_missed', (select coalesce(sum(jsonb_array_length(coalesce(g.guided -> 'notFound', '[]'::jsonb))), 0) from g),
    'palate_close', (select count(*) from palate where abs(mine - expected) <= 1.5),
    'palate_total', (select count(*) from palate),
    'acidity_close', (select count(*) from palate where dim = 'acidity' and abs(mine - expected) <= 1),
    'finish_measured', (select count(*) from g where jsonb_typeof(g.guided -> 'finishSeconds') = 'number'),
    'blind_grape_hits', (
      select count(*) from public.scores s
      where s.participant_id in (select id from mine) and coalesce((s.breakdown ->> 'grape')::numeric, 0) > 0),
    'blind_structure_points', (
      select coalesce(sum(v.value::numeric), 0) from public.scores s, jsonb_each_text(coalesce(s.breakdown -> 'structure', '{}'::jsonb)) v
      where s.participant_id in (select id from mine)),
    'riesling_hits', (
      select count(*) from public.scores s
      join public.event_wine_secrets x on x.event_wine_id = s.event_wine_id
      join public.wine_vintages v on v.id = x.vintage_id
      join public.wines w on w.id = v.wine_id
      join public.grape_varieties gv on gv.id = w.grape_variety_id
      where s.participant_id in (select id from mine) and gv.name = 'Riesling'
        and coalesce((s.breakdown ->> 'grape')::numeric, 0) > 0),
    'pirates_found', (
      select count(*) from public.scores s
      where s.participant_id in (select id from mine) and coalesce((s.breakdown ->> 'pirate')::numeric, 0) > 0),
    'events_hosted', (
      select count(*) from public.events e where e.organizer_id = auth.uid() and e.status = 'finished'),
    'region_cards', (
      select count(*) from public.user_cards uc join public.collectible_cards c on c.id = uc.card_id
      where uc.user_id = auth.uid() and c.kind = 'region')
  )
$$;

-- Awards every badge you have earned and not yet got; returns the new ones.
create function public.award_badges() returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_stats jsonb;
  v_new jsonb;
begin
  if auth.uid() is null or public.is_anonymous() then
    return '[]'::jsonb;
  end if;
  v_stats := public.my_progress_stats();

  with earned as (
    select b.id from public.badges b
    where exists (
      select 1 from jsonb_each_text(b.criteria) c
      where c.key in (
        'guided', 'aromas_found', 'shade_matches', 'acidity_close', 'finish_measured',
        'events_hosted', 'pirates_found', 'region_cards'
      )
    )
    and not exists (
      -- every numeric criterion must be reached
      select 1 from jsonb_each_text(b.criteria) c
      where c.key <> 'grape' and c.key <> 'correct'
        and coalesce((v_stats ->> c.key)::numeric, 0) < c.value::numeric
    )
    union
    -- "Riesling-Nase": 10 Rieslings blind recognised
    select b.id from public.badges b
    where b.code = 'riesling_nose' and (v_stats ->> 'riesling_hits')::numeric >= coalesce((b.criteria ->> 'correct')::numeric, 10)
  ),
  added as (
    insert into public.user_badges (user_id, badge_id)
    select auth.uid(), e.id from earned e
    on conflict do nothing
    returning badge_id
  )
  select coalesce(jsonb_agg(jsonb_build_object('code', b.code, 'title', b.title, 'description', b.description, 'icon', b.icon)), '[]'::jsonb)
    into v_new
  from added a join public.badges b on b.id = a.badge_id;

  return v_new;
end;
$$;

revoke execute on function public.my_progress_stats() from public;
revoke execute on function public.award_badges() from public;
grant execute on function public.my_progress_stats() to authenticated;
grant execute on function public.award_badges() to authenticated;
