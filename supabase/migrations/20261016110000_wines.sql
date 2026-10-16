-- Reference data (regions, vineyard sites, grape varieties) and the shared wine
-- database that grows through label scans and user input.

create type public.wine_color as enum ('white', 'red', 'rose', 'sparkling', 'sweet', 'orange');
create type public.grape_color as enum ('white', 'red');

-- ---------------------------------------------------------------------------
-- Reference data - readable by everyone, written only by admins/migrations.
-- ---------------------------------------------------------------------------

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,          -- ISO 3166-1 alpha-2, e.g. 'DE'
  name text not null,
  parent_id uuid references public.regions (id) on delete set null,
  description text,
  created_at timestamptz not null default now(),
  unique (country_code, name)
);

-- "Lage" - a named vineyard site.
create table public.vineyard_sites (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions (id) on delete restrict,
  village text,
  name text not null,
  soil text,
  description text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  unique nulls not distinct (region_id, village, name)
);
create index vineyard_sites_region_id_idx on public.vineyard_sites (region_id);

create table public.grape_varieties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color public.grape_color not null,
  description text,
  typical_aromas text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Wines and vintages - shared catalogue.
-- ---------------------------------------------------------------------------

create table public.wines (
  id uuid primary key default gen_random_uuid(),
  producer text not null check (char_length(producer) between 1 and 120),
  name text check (char_length(name) <= 160),
  color public.wine_color not null,
  grape_variety_id uuid references public.grape_varieties (id) on delete set null,
  region_id uuid references public.regions (id) on delete set null,
  site_id uuid references public.vineyard_sites (id) on delete set null,
  classification text,                     -- e.g. 'GG', 'Kabinett', 'Erste Lage'
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index wines_grape_variety_id_idx on public.wines (grape_variety_id);
create index wines_region_id_idx on public.wines (region_id);
create index wines_site_id_idx on public.wines (site_id);

create table public.wine_vintages (
  id uuid primary key default gen_random_uuid(),
  wine_id uuid not null references public.wines (id) on delete cascade,
  vintage smallint check (vintage between 1900 and 2100),  -- null = non-vintage
  alcohol numeric(4, 1) check (alcohol between 0 and 25),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique nulls not distinct (wine_id, vintage)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.regions enable row level security;
alter table public.vineyard_sites enable row level security;
alter table public.grape_varieties enable row level security;
alter table public.wines enable row level security;
alter table public.wine_vintages enable row level security;

create policy "reference data is public" on public.regions
  for select to anon, authenticated using (true);
create policy "reference data is public" on public.vineyard_sites
  for select to anon, authenticated using (true);
create policy "reference data is public" on public.grape_varieties
  for select to anon, authenticated using (true);

grant select on public.regions, public.vineyard_sites, public.grape_varieties to anon, authenticated;

-- The catalogue itself carries no secrets; blind tastings hide the glass ->
-- wine mapping (event_wine_secrets), not the wines.
create policy "signed-in users read wines" on public.wines
  for select to authenticated using (true);
create policy "accounts add wines" on public.wines
  for insert to authenticated
  with check (not public.is_anonymous() and created_by = (select auth.uid()));
create policy "creators edit their wines" on public.wines
  for update to authenticated using (created_by = (select auth.uid()));

create policy "signed-in users read vintages" on public.wine_vintages
  for select to authenticated using (true);
create policy "accounts add vintages" on public.wine_vintages
  for insert to authenticated
  with check (not public.is_anonymous() and created_by = (select auth.uid()));
create policy "creators edit their vintages" on public.wine_vintages
  for update to authenticated using (created_by = (select auth.uid()));

grant select, insert on public.wines, public.wine_vintages to authenticated;
grant update (producer, name, color, grape_variety_id, region_id, site_id, classification)
  on public.wines to authenticated;
grant update (vintage, alcohol) on public.wine_vintages to authenticated;
