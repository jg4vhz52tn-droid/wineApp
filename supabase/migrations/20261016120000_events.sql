-- Lagenabend (events) and live blind tasting.
--
-- Secrecy model: event_wines only says "glass 3 exists and is open". Which
-- wine is in the glass lives in event_wine_secrets, readable by guests only
-- once that glass is revealed. Guesses of others become visible at the same
-- moment. Round status changes go through RPCs (Phase 1), never direct
-- updates, so the reveal and the scoring happen together.

create type public.event_status as enum ('draft', 'planned', 'live', 'finished');
create type public.rsvp_status as enum ('pending', 'yes', 'no');
create type public.participant_role as enum ('organizer', 'guest');
create type public.round_status as enum ('pending', 'open', 'closed', 'revealed');

-- ---------------------------------------------------------------------------
-- Scoring rules - configuration, not code (see CLAUDE.md, 4.2).
-- ---------------------------------------------------------------------------

create table public.scoring_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rules jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index scoring_profiles_one_default_idx
  on public.scoring_profiles (is_default) where is_default;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  theme text check (char_length(theme) <= 200),
  starts_at timestamptz,
  location text check (char_length(location) <= 200),
  invitation_text text check (char_length(invitation_text) <= 4000),
  participant_limit integer check (participant_limit > 0),
  status public.event_status not null default 'planned',
  is_blind boolean not null default true,
  pirate_mode boolean not null default false,
  -- 40 random bits, enough for a friends-circle invite link.
  invite_code text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  scoring_profile_id uuid references public.scoring_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_organizer_id_idx on public.events (organizer_id);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  -- null = guest added by the organizer who has no phone at the table.
  user_id uuid references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  role public.participant_role not null default 'guest',
  rsvp public.rsvp_status not null default 'pending',
  joined_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index event_participants_user_id_idx on public.event_participants (user_id);

-- One row per glass. Contains nothing that gives the wine away.
create table public.event_wines (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  glass_number smallint not null check (glass_number > 0),
  status public.round_status not null default 'pending',
  opened_at timestamptz,
  revealed_at timestamptz,
  unique (event_id, glass_number)
);

-- The answer key per glass: organizer only, guests after the reveal.
create table public.event_wine_secrets (
  event_wine_id uuid primary key references public.event_wines (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  vintage_id uuid references public.wine_vintages (id) on delete set null,
  is_pirate boolean not null default false,
  reference_structure jsonb,               -- {sweetness, acidity, body, tannin, finish} 0..10
  reference_aromas text[] not null default '{}',
  price numeric(10, 2) check (price >= 0),
  brought_by uuid references public.event_participants (id) on delete set null
);
create index event_wine_secrets_event_id_idx on public.event_wine_secrets (event_id);

create table public.guesses (
  id uuid primary key default gen_random_uuid(),
  event_wine_id uuid not null references public.event_wines (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.event_participants (id) on delete cascade,
  structure jsonb,                         -- {sweetness, acidity, body, tannin, finish} 0..10
  aromas text[] not null default '{}',
  grape_variety_id uuid references public.grape_varieties (id) on delete set null,
  country_code char(2),
  region_id uuid references public.regions (id) on delete set null,
  site_id uuid references public.vineyard_sites (id) on delete set null,
  vintage smallint check (vintage between 1900 and 2100),
  price numeric(10, 2) check (price >= 0),
  rating smallint check (rating between 50 and 100),
  marked_pirate boolean not null default false,
  note text check (char_length(note) <= 2000),
  voice_note_path text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_wine_id, participant_id)
);
create index guesses_event_id_idx on public.guesses (event_id);
create index guesses_participant_id_idx on public.guesses (participant_id);

create trigger guesses_set_updated_at before update on public.guesses
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- Written only by the scoring function (Phase 1).
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  event_wine_id uuid not null references public.event_wines (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.event_participants (id) on delete cascade,
  points integer not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique (event_wine_id, participant_id)
);
create index scores_event_id_idx on public.scores (event_id);

-- Cost sharing - kept in the background of an event.
create table public.cost_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  paid_by uuid references public.event_participants (id) on delete set null,
  event_wine_id uuid references public.event_wines (id) on delete set null,
  description text not null check (char_length(description) between 1 and 200),
  amount numeric(10, 2) not null check (amount >= 0),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index cost_items_event_id_idx on public.cost_items (event_id);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create function public.is_event_organizer(p_event_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.organizer_id = auth.uid()
  )
$$;

create function public.is_event_participant(p_event_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_participants p
    where p.event_id = p_event_id and p.user_id = auth.uid()
  )
$$;

create function public.is_glass_revealed(p_event_wine_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_wines w
    where w.id = p_event_wine_id and w.status = 'revealed'
  )
$$;

create function public.is_glass_open(p_event_wine_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_wines w
    where w.id = p_event_wine_id and w.status = 'open'
  )
$$;

create function public.owns_participant(p_participant_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_participants p
    where p.id = p_participant_id and p.user_id = auth.uid()
  )
$$;

-- Keeps denormalized event_id columns honest so policies can rely on them.
create function public.check_event_wine_event() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.event_wines w
    where w.id = new.event_wine_id and w.event_id = new.event_id
  ) then
    raise exception 'event_wine % does not belong to event %', new.event_wine_id, new.event_id;
  end if;
  return new;
end;
$$;

create function public.check_participant_event() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.participant_id is not null and not exists (
    select 1 from public.event_participants p
    where p.id = new.participant_id and p.event_id = new.event_id
  ) then
    raise exception 'participant % does not belong to event %', new.participant_id, new.event_id;
  end if;
  return new;
end;
$$;

create trigger event_wine_secrets_check_event before insert or update on public.event_wine_secrets
  for each row execute function public.check_event_wine_event();
create trigger guesses_check_event before insert or update on public.guesses
  for each row execute function public.check_event_wine_event();
create trigger guesses_check_participant before insert or update on public.guesses
  for each row execute function public.check_participant_event();

-- The organizer is always the first participant of their event.
create function public.add_organizer_as_participant() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.event_participants (event_id, user_id, display_name, role, rsvp)
  values (
    new.id,
    new.organizer_id,
    coalesce(
      nullif((select display_name from public.profiles where id = new.organizer_id), ''),
      'Gastgeber'
    ),
    'organizer',
    'yes'
  );
  return new;
end;
$$;

create trigger events_add_organizer after insert on public.events
  for each row execute function public.add_organizer_as_participant();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.scoring_profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_wines enable row level security;
alter table public.event_wine_secrets enable row level security;
alter table public.guesses enable row level security;
alter table public.scores enable row level security;
alter table public.cost_items enable row level security;

create policy "scoring profiles are readable" on public.scoring_profiles
  for select to authenticated using (true);
grant select on public.scoring_profiles to authenticated;

-- events
create policy "participants read events" on public.events
  for select to authenticated
  using (organizer_id = (select auth.uid()) or public.is_event_participant(id));
create policy "accounts create events" on public.events
  for insert to authenticated
  with check (not public.is_anonymous() and organizer_id = (select auth.uid()));
create policy "organizers update events" on public.events
  for update to authenticated using (organizer_id = (select auth.uid()));
create policy "organizers delete events" on public.events
  for delete to authenticated using (organizer_id = (select auth.uid()));

grant select, delete on public.events to authenticated;
grant insert (title, theme, starts_at, location, invitation_text, participant_limit,
              is_blind, pirate_mode, scoring_profile_id, org_id)
  on public.events to authenticated;
grant update (title, theme, starts_at, location, invitation_text, participant_limit,
              status, is_blind, pirate_mode, scoring_profile_id)
  on public.events to authenticated;

-- event_participants (guests join via join_event(), not by inserting rows)
create policy "participants see each other" on public.event_participants
  for select to authenticated
  using (public.is_event_participant(event_id) or public.is_event_organizer(event_id));
create policy "organizers add offline guests" on public.event_participants
  for insert to authenticated
  with check (public.is_event_organizer(event_id) and user_id is null and role = 'guest');
create policy "participants update themselves" on public.event_participants
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_event_organizer(event_id));
create policy "organizers remove guests" on public.event_participants
  for delete to authenticated
  using (public.is_event_organizer(event_id) and role = 'guest');

grant select, delete on public.event_participants to authenticated;
grant insert (event_id, display_name, rsvp) on public.event_participants to authenticated;
grant update (display_name, rsvp) on public.event_participants to authenticated;

-- event_wines: everyone in the event sees the glasses; status only via RPC.
create policy "participants see glasses" on public.event_wines
  for select to authenticated
  using (public.is_event_participant(event_id) or public.is_event_organizer(event_id));
create policy "organizers add glasses" on public.event_wines
  for insert to authenticated with check (public.is_event_organizer(event_id));
create policy "organizers renumber glasses" on public.event_wines
  for update to authenticated using (public.is_event_organizer(event_id));
create policy "organizers remove glasses" on public.event_wines
  for delete to authenticated using (public.is_event_organizer(event_id));

grant select, delete on public.event_wines to authenticated;
grant insert (event_id, glass_number) on public.event_wines to authenticated;
grant update (glass_number) on public.event_wines to authenticated;

-- event_wine_secrets: THE secret. Organizer always, guests only once revealed.
create policy "organizer or revealed" on public.event_wine_secrets
  for select to authenticated
  using (
    public.is_event_organizer(event_id)
    or (public.is_event_participant(event_id) and public.is_glass_revealed(event_wine_id))
  );
create policy "organizers write secrets" on public.event_wine_secrets
  for insert to authenticated with check (public.is_event_organizer(event_id));
create policy "organizers edit secrets" on public.event_wine_secrets
  for update to authenticated using (public.is_event_organizer(event_id));
create policy "organizers delete secrets" on public.event_wine_secrets
  for delete to authenticated using (public.is_event_organizer(event_id));

grant select, insert, delete on public.event_wine_secrets to authenticated;
grant update (vintage_id, is_pirate, reference_structure, reference_aromas, price, brought_by)
  on public.event_wine_secrets to authenticated;

-- guesses: your own always; everyone's once the glass is revealed.
-- Writing is only possible while the round for that glass is open.
create policy "own guesses or revealed" on public.guesses
  for select to authenticated
  using (
    public.owns_participant(participant_id)
    or (
      (public.is_event_participant(event_id) or public.is_event_organizer(event_id))
      and public.is_glass_revealed(event_wine_id)
    )
  );
create policy "guess while open" on public.guesses
  for insert to authenticated
  with check (public.owns_participant(participant_id) and public.is_glass_open(event_wine_id));
create policy "change guess while open" on public.guesses
  for update to authenticated
  using (public.owns_participant(participant_id) and public.is_glass_open(event_wine_id))
  with check (public.owns_participant(participant_id) and public.is_glass_open(event_wine_id));

grant select on public.guesses to authenticated;
grant insert (event_wine_id, event_id, participant_id, structure, aromas, grape_variety_id,
              country_code, region_id, site_id, vintage, price, rating, marked_pirate,
              note, voice_note_path)
  on public.guesses to authenticated;
grant update (structure, aromas, grape_variety_id, country_code, region_id, site_id,
              vintage, price, rating, marked_pirate, note, voice_note_path)
  on public.guesses to authenticated;

-- scores: read-only for the table, after the reveal.
create policy "scores after reveal" on public.scores
  for select to authenticated
  using (
    (public.is_event_participant(event_id) or public.is_event_organizer(event_id))
    and public.is_glass_revealed(event_wine_id)
  );
grant select on public.scores to authenticated;

-- cost_items
create policy "participants see costs" on public.cost_items
  for select to authenticated
  using (public.is_event_participant(event_id) or public.is_event_organizer(event_id));
create policy "participants add costs" on public.cost_items
  for insert to authenticated
  with check (
    (public.is_event_participant(event_id) or public.is_event_organizer(event_id))
    and created_by = (select auth.uid())
  );
create policy "creator or organizer edit costs" on public.cost_items
  for update to authenticated
  using (created_by = (select auth.uid()) or public.is_event_organizer(event_id));
create policy "creator or organizer delete costs" on public.cost_items
  for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_event_organizer(event_id));

create function public.check_cost_payer() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.paid_by is not null and not exists (
    select 1 from public.event_participants p
    where p.id = new.paid_by and p.event_id = new.event_id
  ) then
    raise exception 'payer % does not belong to event %', new.paid_by, new.event_id;
  end if;
  return new;
end;
$$;

create trigger cost_items_check_payer before insert or update on public.cost_items
  for each row execute function public.check_cost_payer();

grant select, delete on public.cost_items to authenticated;
grant insert (event_id, paid_by, event_wine_id, description, amount) on public.cost_items to authenticated;
grant update (paid_by, event_wine_id, description, amount) on public.cost_items to authenticated;

-- ---------------------------------------------------------------------------
-- Guest access via invite link
-- ---------------------------------------------------------------------------

-- What someone sees after opening the invite link, before joining.
create function public.event_preview(p_invite_code text)
returns table (
  event_id uuid,
  title text,
  theme text,
  starts_at timestamptz,
  location text,
  invitation_text text,
  organizer_name text,
  status public.event_status,
  is_blind boolean,
  participant_limit integer,
  confirmed_count integer
)
language sql stable security definer
set search_path = ''
as $$
  select
    e.id, e.title, e.theme, e.starts_at, e.location, e.invitation_text,
    (select p.display_name from public.event_participants p
       where p.event_id = e.id and p.role = 'organizer' limit 1),
    e.status, e.is_blind, e.participant_limit,
    (select count(*)::integer from public.event_participants p
       where p.event_id = e.id and p.rsvp = 'yes')
  from public.events e
  where e.invite_code = p_invite_code and e.status <> 'draft'
$$;

-- Joins (or re-answers) an event as the current user. Works for anonymous
-- guests: the app signs them in anonymously first, then calls this.
create function public.join_event(
  p_invite_code text,
  p_display_name text,
  p_rsvp public.rsvp_status default 'yes'
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events%rowtype;
  v_name text := btrim(coalesce(p_display_name, ''));
  v_participant_id uuid;
  v_confirmed integer;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if char_length(v_name) not between 1 and 40 then
    raise exception 'name must be 1-40 characters' using errcode = '22023';
  end if;

  select * into v_event from public.events
  where invite_code = p_invite_code and status <> 'draft'
  for update;
  if not found then
    raise exception 'invite not found' using errcode = 'P0002';
  end if;

  if p_rsvp = 'yes' and v_event.participant_limit is not null then
    select count(*) into v_confirmed from public.event_participants
    where event_id = v_event.id and rsvp = 'yes' and user_id is distinct from v_uid;
    if v_confirmed >= v_event.participant_limit then
      raise exception 'event is full' using errcode = 'P0001';
    end if;
  end if;

  insert into public.event_participants (event_id, user_id, display_name, role, rsvp)
  values (v_event.id, v_uid, v_name, 'guest', p_rsvp)
  on conflict (event_id, user_id)
    do update set display_name = excluded.display_name, rsvp = excluded.rsvp
  returning id into v_participant_id;

  -- Guests have no profile name yet; remember the one they typed.
  update public.profiles set display_name = v_name
  where id = v_uid and display_name = '';

  return v_participant_id;
end;
$$;

revoke execute on function public.event_preview(text) from public;
revoke execute on function public.join_event(text, text, public.rsvp_status) from public;
grant execute on function public.event_preview(text) to anon, authenticated;
grant execute on function public.join_event(text, text, public.rsvp_status) to authenticated;
