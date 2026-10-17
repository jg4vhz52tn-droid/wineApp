-- Seed data for development: reference data, a handful of real German
-- Rieslings from well-known sites (plus one Silvaner as the "pirate"), the
-- default scoring rules, a few badges and a helper that creates a demo
-- tasting for the signed-in user.
--
-- Prices are rough demo estimates, not market data.

-- ---------------------------------------------------------------------------
-- Scoring rules (CLAUDE.md, 4.2) - tune here, not in code.
-- ---------------------------------------------------------------------------

insert into public.scoring_profiles (name, is_default, rules) values (
  'Standard',
  true,
  '{
    "grape_exact": 30,
    "country": 10,
    "region": 10,
    "site": 15,
    "vintage": {"exact": 15, "within_1": 8, "within_2": 3},
    "price": {"within_15_pct": 10, "within_30_pct": 5},
    "structure_per_dimension_max": 5,
    "structure_dimensions": ["sweetness", "acidity", "body", "tannin"],
    "aroma_per_hit": 2,
    "aroma_max": 10,
    "pirate_found": 20
  }'::jsonb
);

-- ---------------------------------------------------------------------------
-- Grape varieties
-- ---------------------------------------------------------------------------

insert into public.grape_varieties (name, color, description, typical_aromas) values
  ('Riesling', 'white', 'Spät reifend, hohe Säure, transportiert den Boden wie kaum eine andere Rebsorte.',
    '{Pfirsich,Aprikose,Zitrus,grüner Apfel,Schiefer,Petrol}'),
  ('Silvaner', 'white', 'Dezent, erdig-kräuterig, in Franken auf Muschelkalk zu Hause.',
    '{Birne,Heu,Kräuter,Melone,Feuerstein}'),
  ('Grauburgunder', 'white', 'Pinot-Gris-Mutation, meist mehr Körper und weniger Säure.',
    '{Birne,Nuss,Mandel,Honigmelone}'),
  ('Weißburgunder', 'white', 'Elegant, cremig, moderate Säure.',
    '{Apfel,Birne,Mandel,Zitrus}'),
  ('Chardonnay', 'white', 'Weltweit verbreitet, vom straffen Chablis bis zum Holz-Kalifornier.',
    '{Apfel,Zitrus,Butter,Haselnuss,Vanille}'),
  ('Grüner Veltliner', 'white', 'Österreichs Leitsorte, würzig mit „Pfefferl“.',
    '{weißer Pfeffer,grüner Apfel,Zitrus,Linse}'),
  ('Sauvignon Blanc', 'white', 'Aromatisch, grasig bis tropisch.',
    '{Stachelbeere,Holunder,Paprika,Passionsfrucht}'),
  ('Müller-Thurgau', 'white', 'Mild, blumig, früh trinkreif.',
    '{Muskat,Pfirsich,Blüten}'),
  ('Spätburgunder', 'red', 'Pinot Noir: dünnschalig, wenig Tannin, viel Finesse.',
    '{Kirsche,Himbeere,Erdbeere,Waldboden,Rauch}'),
  ('Lemberger', 'red', 'Blaufränkisch: kräftige Säure, dunkle Frucht, Würze.',
    '{Brombeere,Sauerkirsche,Pfeffer}');

-- ---------------------------------------------------------------------------
-- Regions and vineyard sites
-- ---------------------------------------------------------------------------

insert into public.regions (country_code, name, description) values
  ('DE', 'Mosel', 'Steile Schieferhänge an Mosel, Saar und Ruwer; filigrane Rieslinge mit niedrigem Alkohol.'),
  ('DE', 'Rheingau', 'Südhänge am Rhein zwischen Wiesbaden und Lorch; klassische, kraftvolle Rieslinge.'),
  ('DE', 'Rheinhessen', 'Größtes deutsches Anbaugebiet; Kalk-Lagen wie im Wonnegau liefern Weltklasse.'),
  ('DE', 'Nahe', 'Enorme Bodenvielfalt auf kleinem Raum, von Schiefer bis Vulkangestein.'),
  ('DE', 'Pfalz', 'Warm und sonnig an der Haardt; reife, saftige Rieslinge.'),
  ('DE', 'Franken', 'Bocksbeutel-Land, Muschelkalk am Main, Heimat des Silvaners.'),
  ('AT', 'Wachau', 'Terrassen an der Donau, Urgestein und Löss.'),
  ('FR', 'Elsass', 'Am Fuß der Vogesen, trocken und sonnig, Grand-Cru-Lagen.');

insert into public.regions (country_code, name, parent_id, description)
select 'DE', 'Saar', id, 'Kühles Seitental der Mosel, sehr rassige Säure.'
from public.regions where country_code = 'DE' and name = 'Mosel';

insert into public.vineyard_sites (region_id, village, name, soil, description, latitude, longitude)
select r.id, s.village, s.name, s.soil, s.description, s.lat, s.lng
from (values
  ('Saar', 'Wiltingen', 'Scharzhofberg', 'Grauer Devonschiefer',
     'Eine der berühmtesten Riesling-Lagen der Welt, kühl und windig.', 49.6553, 6.6008),
  ('Mosel', 'Erden', 'Prälat', 'Roter Schiefer',
     'Winzige, extrem warme Felslage direkt am Fluss.', 49.9800, 7.0167),
  ('Mosel', 'Wehlen', 'Sonnenuhr', 'Blauer Devonschiefer',
     'Steilhang mit der namensgebenden Sonnenuhr im Weinberg.', 49.9408, 7.0517),
  ('Rheingau', 'Kiedrich', 'Gräfenberg', 'Phyllit und Schiefer',
     'Steile Südwestlage, seit dem 12. Jahrhundert dokumentiert.', 50.0428, 8.0786),
  ('Rheinhessen', 'Westhofen', 'Morstein', 'Kalkmergel über Kalkstein',
     'Spät reifende Kalklage im Wonnegau, sehr langlebige Weine.', 49.7044, 8.2400),
  ('Nahe', 'Niederhausen', 'Hermannshöhle', 'Schiefer mit Vulkangestein',
     'Gilt als beste Lage der Nahe, komplex und würzig.', 49.7944, 7.7742),
  ('Pfalz', 'Forst', 'Kirchenstück', 'Sandstein, Basalt und Kalk',
     'Kleine ummauerte Lage im Ortskern, oft als „Pfälzer Montrachet“ bezeichnet.', 49.4250, 8.1906),
  ('Franken', 'Escherndorf', 'Lump', 'Muschelkalk',
     'Steiler Prallhang an der Mainschleife.', 49.8667, 10.1667)
) as s(region, village, name, soil, description, lat, lng)
join public.regions r on r.name = s.region;

-- ---------------------------------------------------------------------------
-- Wines and vintages
-- ---------------------------------------------------------------------------

insert into public.wines (producer, name, color, grape_variety_id, region_id, site_id, classification, created_by)
select w.producer, w.name, 'white', g.id, s.region_id, s.id, w.classification, null
from (values
  ('Egon Müller', 'Scharzhofberger Riesling', 'Riesling', 'Scharzhofberg', 'Kabinett'),
  ('Dr. Loosen', 'Erdener Prälat Riesling Alte Reben', 'Riesling', 'Prälat', 'GG'),
  ('Joh. Jos. Prüm', 'Wehlener Sonnenuhr Riesling', 'Riesling', 'Sonnenuhr', 'Spätlese'),
  ('Robert Weil', 'Kiedrich Gräfenberg Riesling', 'Riesling', 'Gräfenberg', 'GG'),
  ('Keller', 'Westhofen Morstein Riesling', 'Riesling', 'Morstein', 'GG'),
  ('Dönnhoff', 'Hermannshöhle Riesling', 'Riesling', 'Hermannshöhle', 'GG'),
  ('Dr. Bürklin-Wolf', 'Kirchenstück Riesling', 'Riesling', 'Kirchenstück', 'G.C.'),
  ('Horst Sauer', 'Escherndorfer Lump Silvaner', 'Silvaner', 'Lump', 'GG')
) as w(producer, name, grape, site, classification)
join public.grape_varieties g on g.name = w.grape
join public.vineyard_sites s on s.name = w.site;

insert into public.wine_vintages (wine_id, vintage, alcohol, created_by)
select w.id, v.vintage, v.alcohol, null
from (values
  ('Scharzhofberger Riesling', 2021, 8.5),
  ('Erdener Prälat Riesling Alte Reben', 2019, 12.5),
  ('Wehlener Sonnenuhr Riesling', 2017, 8.0),
  ('Kiedrich Gräfenberg Riesling', 2020, 13.0),
  ('Westhofen Morstein Riesling', 2019, 12.5),
  ('Hermannshöhle Riesling', 2021, 12.5),
  ('Kirchenstück Riesling', 2018, 13.0),
  ('Escherndorfer Lump Silvaner', 2022, 13.5)
) as v(wine, vintage, alcohol)
join public.wines w on w.name = v.wine;

-- ---------------------------------------------------------------------------
-- Collectible cards (one per site and grape) and badges
-- ---------------------------------------------------------------------------

insert into public.collectible_cards (kind, site_id, title, body)
select 'site', s.id, coalesce(s.village || ' ', '') || s.name, s.description
from public.vineyard_sites s;

insert into public.collectible_cards (kind, grape_variety_id, title, body)
select 'grape', g.id, g.name, g.description from public.grape_varieties g;

insert into public.badges (code, title, description, icon, criteria) values
  ('first_event_hosted', 'Gastgeber', 'Ersten Lagenabend organisiert.', 'host', '{"events_hosted": 1}'),
  ('riesling_nose', 'Riesling-Nase', '10 Rieslinge blind richtig erkannt.', 'nose', '{"grape": "Riesling", "correct": 10}'),
  ('pirate_hunter', 'Piratenjäger', 'Den Piraten eines Abends entlarvt.', 'pirate', '{"pirates_found": 1}'),
  ('collector_10_regions', 'Weltenbummler', '10 Regionen in der Sammlung.', 'globe', '{"region_cards": 10}');

-- ---------------------------------------------------------------------------
-- Demo tasting: `select public.create_demo_event();` as a signed-in account
-- (the app's "Demo-Abend anlegen" button calls it). Dev convenience only.
-- ---------------------------------------------------------------------------

create or replace function public.create_demo_event() returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_glass_id uuid;
  v_glass integer := 0;
  v_wine record;
begin
  insert into public.events (title, theme, starts_at, location, invitation_text, participant_limit, pirate_mode)
  values (
    'Riesling quer durch die Lagen',
    'Große Rieslinge von Saar bis Pfalz – und ein Pirat',
    date_trunc('day', now()) + interval '7 days 19 hours',
    'Bei uns im Wohnzimmer',
    'Acht Gläser, acht Lagen, ein Abend. Wir probieren blind, raten Lage und Jahrgang – '
      || 'und irgendwo hat sich ein Pirat eingeschlichen. Bringt Hunger mit, für Brot und Käse ist gesorgt.',
    12,
    true
  )
  returning id into v_event_id;

  insert into public.event_participants (event_id, display_name, rsvp)
  values (v_event_id, 'Jonas', 'yes'), (v_event_id, 'Matti', 'yes'), (v_event_id, 'Sophie', 'pending');

  for v_wine in
    select v.id as vintage_id, w.name, g.name as grape
    from public.wine_vintages v
    join public.wines w on w.id = v.wine_id
    join public.grape_varieties g on g.id = w.grape_variety_id
    where w.color = 'white'
    order by v.alcohol, w.name
  loop
    v_glass := v_glass + 1;
    insert into public.event_wines (event_id, glass_number)
    values (v_event_id, v_glass) returning id into v_glass_id;

    insert into public.event_wine_secrets (event_wine_id, event_id, vintage_id, is_pirate, price)
    values (v_glass_id, v_event_id, v_wine.vintage_id, v_wine.grape <> 'Riesling', 30 + v_glass * 8);
  end loop;

  return v_event_id;
end;
$$;

revoke execute on function public.create_demo_event() from public;
grant execute on function public.create_demo_event() to authenticated;

-- ---------------------------------------------------------------------------
-- Two reds for the demo cellar
-- ---------------------------------------------------------------------------

insert into public.regions (country_code, name, description)
values ('DE', 'Württemberg', 'Rotweinland am Neckar: Trollinger, Lemberger, Spätburgunder.');

insert into public.vineyard_sites (region_id, village, name, soil, description)
select r.id, s.village, s.name, s.soil, s.description
from (values
  ('Franken', 'Bürgstadt', 'Centgrafenberg', 'Roter Buntsandstein', 'Steile Sandsteinlage am Main, bekannt für Spätburgunder.'),
  ('Württemberg', 'Fellbach', 'Lämmler', 'Keuper', 'Südhang bei Stuttgart.')
) as s(region, village, name, soil, description)
join public.regions r on r.name = s.region;

insert into public.wines (producer, name, color, grape_variety_id, region_id, site_id, classification, created_by)
select w.producer, w.name, 'red', g.id, s.region_id, s.id, w.classification, null
from (values
  ('Rudolf Fürst', 'Bürgstadter Centgrafenberg Spätburgunder', 'Spätburgunder', 'Centgrafenberg', 'GG'),
  ('Aldinger', 'Fellbacher Lämmler Lemberger', 'Lemberger', 'Lämmler', 'GG')
) as w(producer, name, grape, site, classification)
join public.grape_varieties g on g.name = w.grape
join public.vineyard_sites s on s.name = w.site;

insert into public.wine_vintages (wine_id, vintage, alcohol, created_by)
select w.id, v.vintage, v.alcohol, null
from (values
  ('Bürgstadter Centgrafenberg Spätburgunder', 2019, 13.0),
  ('Fellbacher Lämmler Lemberger', 2020, 13.5)
) as v(wine, vintage, alcohol)
join public.wines w on w.name = v.wine;

-- The demo cellar function (create_demo_cellar) lives in migration
-- 20261017120000_cellar_racks.sql because it uses named racks.
