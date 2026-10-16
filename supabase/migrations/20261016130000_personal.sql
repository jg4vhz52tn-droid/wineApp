-- Personal data: cellar, tasting notes, journal, wishlist/prices, taste DNA,
-- collectible cards and badges. Most of it is filled in later phases; the
-- tables exist now so the data model is settled early.

-- ---------------------------------------------------------------------------
-- Cellar - owned by an organization (personal org today, business later).
-- ---------------------------------------------------------------------------

create type public.drink_window_source as enum ('ai', 'manual');

create table public.cellar_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  vintage_id uuid not null references public.wine_vintages (id) on delete restrict,
  quantity integer not null default 1 check (quantity >= 0),
  purchase_price numeric(10, 2) check (purchase_price >= 0),
  currency char(3) not null default 'EUR',
  purchased_on date,
  storage_shelf text,                      -- Regal
  storage_compartment text,                -- Fach
  storage_row text,                        -- Reihe
  drink_from smallint check (drink_from between 1900 and 2200),
  drink_until smallint check (drink_until between 1900 and 2200),
  drink_window_source public.drink_window_source,
  notes text check (char_length(notes) <= 2000),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (drink_until is null or drink_from is null or drink_until >= drink_from)
);
create index cellar_items_org_id_idx on public.cellar_items (org_id);

create trigger cellar_items_set_updated_at before update on public.cellar_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Tasting notes and journal
-- ---------------------------------------------------------------------------

create table public.tasting_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vintage_id uuid references public.wine_vintages (id) on delete set null,
  event_wine_id uuid references public.event_wines (id) on delete set null,
  rating smallint check (rating between 50 and 100),
  note text check (char_length(note) <= 4000),
  structure jsonb,
  aromas text[] not null default '{}',
  tasted_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index tasting_notes_user_id_idx on public.tasting_notes (user_id);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vintage_id uuid references public.wine_vintages (id) on delete set null,
  cellar_item_id uuid references public.cellar_items (id) on delete set null,
  title text check (char_length(title) <= 160),
  occasion text,                           -- Anlass
  companions text,                         -- mit wem
  place text,                              -- wo
  topics text check (char_length(topics) <= 4000),  -- worüber gesprochen wurde
  happened_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index journal_entries_user_id_idx on public.journal_entries (user_id);

create table public.journal_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null,
  caption text check (char_length(caption) <= 300),
  created_at timestamptz not null default now()
);
create index journal_media_entry_id_idx on public.journal_media (entry_id);

-- ---------------------------------------------------------------------------
-- Wishlist and prices
-- ---------------------------------------------------------------------------

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vintage_id uuid not null references public.wine_vintages (id) on delete cascade,
  target_price numeric(10, 2) check (target_price >= 0),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  unique (user_id, vintage_id)
);

create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  wishlist_item_id uuid not null references public.wishlist_items (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  max_price numeric(10, 2) not null check (max_price >= 0),
  active boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Filled by a server-side price source (Phase 5), behind one interface.
create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  vintage_id uuid not null references public.wine_vintages (id) on delete cascade,
  price numeric(10, 2) not null check (price >= 0),
  currency char(3) not null default 'EUR',
  source text not null,
  url text,
  is_estimate boolean not null default true,
  observed_at timestamptz not null default now()
);
create index price_history_vintage_id_idx on public.price_history (vintage_id, observed_at desc);

-- ---------------------------------------------------------------------------
-- Taste DNA
-- ---------------------------------------------------------------------------

create table public.taste_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  dimensions jsonb not null default '{}'::jsonb,
  summary text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Collectible cards and badges
-- ---------------------------------------------------------------------------

create type public.card_kind as enum ('region', 'site', 'grape', 'lesson');

create table public.collectible_cards (
  id uuid primary key default gen_random_uuid(),
  kind public.card_kind not null,
  region_id uuid references public.regions (id) on delete cascade,
  site_id uuid references public.vineyard_sites (id) on delete cascade,
  grape_variety_id uuid references public.grape_varieties (id) on delete cascade,
  title text not null,
  body text,
  image_path text,
  created_at timestamptz not null default now()
);

create table public.user_cards (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.collectible_cards (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  source_event_id uuid references public.events (id) on delete set null,
  primary key (user_id, card_id)
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  icon text,
  criteria jsonb not null default '{}'::jsonb
);

create table public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.cellar_items enable row level security;
alter table public.tasting_notes enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_media enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.price_alerts enable row level security;
alter table public.price_history enable row level security;
alter table public.taste_profiles enable row level security;
alter table public.collectible_cards enable row level security;
alter table public.user_cards enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "org members manage cellar" on public.cellar_items
  for all to authenticated
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id) and not public.is_anonymous());
grant select, insert, update, delete on public.cellar_items to authenticated;

-- Own-rows tables.
create policy "own tasting notes" on public.tasting_notes
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own journal" on public.journal_entries
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own journal media" on public.journal_media
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own wishlist" on public.wishlist_items
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own price alerts" on public.price_alerts
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete
  on public.tasting_notes, public.journal_entries, public.journal_media,
     public.wishlist_items, public.price_alerts
  to authenticated;

-- Server-written, user-readable.
create policy "prices are readable" on public.price_history
  for select to authenticated using (true);
create policy "own taste profile" on public.taste_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own cards" on public.user_cards
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own badges" on public.user_badges
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.price_history, public.taste_profiles, public.user_cards, public.user_badges
  to authenticated;

-- Catalogues of what can be collected.
create policy "cards are public" on public.collectible_cards
  for select to anon, authenticated using (true);
create policy "badges are public" on public.badges
  for select to anon, authenticated using (true);
grant select on public.collectible_cards, public.badges to anon, authenticated;
