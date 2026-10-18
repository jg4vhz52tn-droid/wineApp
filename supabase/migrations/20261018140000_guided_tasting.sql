-- Geführte Verkostung: experience level in the profile, one "typical
-- profile" per wine vintage (written once by the AI, then shared by everyone),
-- and the results of a guided tasting stored with the rating.

alter table public.profiles add column experience text not null default 'intermediate'
  check (experience in ('beginner', 'intermediate', 'pro'));
grant update (experience) on public.profiles to authenticated;

-- What experts typically find in this wine: colour, aromas, structure.
-- Not a lab analysis - shown as "So beschreiben Kenner diesen Wein typischerweise".
create table public.wine_profiles (
  vintage_id uuid primary key references public.wine_vintages (id) on delete cascade,
  profile jsonb not null,
  source text not null default 'ai' check (source in ('ai', 'manual')),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.wine_profiles enable row level security;
create policy "wine profiles are readable" on public.wine_profiles
  for select to authenticated using (true);
grant select on public.wine_profiles to authenticated;

-- First one wins: a stored profile is never overwritten by others.
create function public.save_wine_profile(p_vintage_id uuid, p_profile jsonb) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_anonymous() then
    raise exception 'accounts only' using errcode = '42501';
  end if;
  if jsonb_typeof(p_profile) <> 'object' or length(p_profile::text) > 8000 then
    raise exception 'invalid profile' using errcode = '22023';
  end if;
  insert into public.wine_profiles (vintage_id, profile) values (p_vintage_id, p_profile)
  on conflict (vintage_id) do nothing;
end;
$$;

-- What happened in the guided tasting: colour picked, aromas found / not found, finish in seconds.
alter table public.tasting_notes add column guided jsonb;

-- The wine profile counts against the daily AI limit.
alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check check (kind in ('scan', 'prices', 'dna', 'profile'));

create or replace function public.claim_ai_credit(p_kind text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_limit integer := case p_kind
    when 'scan' then 25 when 'prices' then 20 when 'dna' then 10 when 'profile' then 30 else 0 end;
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

revoke execute on function public.save_wine_profile(uuid, jsonb) from public;
grant execute on function public.save_wine_profile(uuid, jsonb) to authenticated;
