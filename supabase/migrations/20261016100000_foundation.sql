-- Foundation: organizations (owners of cellars etc., prepared for the later
-- business version), profiles, and the shared helper functions used by RLS.
--
-- Conventions:
-- * Every table has RLS enabled. Grants are explicit; RLS decides row access.
-- * Helper functions are SECURITY DEFINER with an empty search_path so policies
--   can look at other tables without recursive RLS checks.
-- * auth.uid() is wrapped in (select ...) inside policies so Postgres
--   evaluates it once per statement instead of once per row.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.org_kind as enum ('personal', 'group', 'business');
create type public.org_role as enum ('owner', 'admin', 'member');

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True for guests who joined via invite link without a full account.
create function public.is_anonymous() returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  kind public.org_kind not null default 'personal',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index organization_members_user_id_idx on public.organization_members (user_id);

create function public.is_org_member(p_org_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org_id and m.user_id = auth.uid()
  )
$$;

create function public.is_org_admin(p_org_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org_id and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "members read their organizations" on public.organizations
  for select to authenticated using (public.is_org_member(id));
create policy "admins update their organizations" on public.organizations
  for update to authenticated using (public.is_org_admin(id));

create policy "members read memberships" on public.organization_members
  for select to authenticated using (public.is_org_member(org_id));

grant select, update (name) on public.organizations to authenticated;
grant select on public.organization_members to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  avatar_url text,
  is_guest boolean not null default false,
  personal_org_id uuid references public.organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()));

grant select, update (display_name, avatar_url) on public.profiles to authenticated;

-- Creates the personal organization a full account owns its cellar through.
create function public.ensure_personal_org(p_user_id uuid, p_name text) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
begin
  select personal_org_id into v_org_id from public.profiles where id = p_user_id;
  if v_org_id is not null then
    return v_org_id;
  end if;

  insert into public.organizations (name, kind, created_by)
  values (coalesce(nullif(p_name, ''), 'Mein Keller'), 'personal', p_user_id)
  returning id into v_org_id;

  insert into public.organization_members (org_id, user_id, role)
  values (v_org_id, p_user_id, 'owner');

  update public.profiles set personal_org_id = v_org_id where id = p_user_id;
  return v_org_id;
end;
$$;
revoke execute on function public.ensure_personal_org(uuid, text) from public;

create function public.handle_new_user() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := left(coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    ''
  ), 40);

  insert into public.profiles (id, display_name, is_guest)
  values (new.id, v_name, new.is_anonymous);

  if not new.is_anonymous then
    perform public.ensure_personal_org(new.id, v_name);
  end if;
  return new;
end;
$$;

-- A guest who later links an email/Google account keeps their user id (and so
-- all their guesses and scores); they just become a full account.
create function public.handle_user_upgraded() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if old.is_anonymous and not new.is_anonymous then
    update public.profiles set is_guest = false where id = new.id;
    perform public.ensure_personal_org(
      new.id,
      (select display_name from public.profiles where id = new.id)
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
create trigger on_auth_user_upgraded after update of is_anonymous on auth.users
  for each row execute function public.handle_user_upgraded();
