-- Label scan, prices on demand, and ratings everyone can read.

-- ---------------------------------------------------------------------------
-- Label photos: they belong to the wine (not to a person), so they are public.
-- Uploads go to "<user id>/<file>" in the bucket wine-labels.
-- ---------------------------------------------------------------------------

alter table public.wines add column label_path text check (char_length(label_path) <= 300);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wine-labels', 'wine-labels', true, 3145728, '{image/jpeg,image/webp}')
on conflict (id) do nothing;

create policy "wine labels: accounts upload into their folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wine-labels'
    and not public.is_anonymous()
    and split_part(name, '/', 1) = (select auth.uid())::text
  );
create policy "wine labels: uploader removes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wine-labels' and owner = (select auth.uid()));

-- Puts a scanned label on the wine. An existing label is only replaced on
-- wines you created yourself.
create function public.set_wine_label(p_vintage_id uuid, p_path text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_anonymous() then
    raise exception 'accounts only' using errcode = '42501';
  end if;
  if split_part(coalesce(p_path, ''), '/', 1) <> auth.uid()::text then
    raise exception 'label must be your upload' using errcode = '22023';
  end if;
  update public.wines w set label_path = p_path
  from public.wine_vintages v
  where v.id = p_vintage_id and w.id = v.wine_id
    and (w.label_path is null or w.created_by = auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- Ratings: half points, public by default ("nur für mich" possible)
-- ---------------------------------------------------------------------------

alter table public.tasting_notes alter column rating type numeric(4, 1);
alter table public.tasting_notes add column is_public boolean not null default true;
alter table public.tasting_notes add column updated_at timestamptz not null default now();
create index tasting_notes_vintage_id_idx on public.tasting_notes (vintage_id);

create trigger tasting_notes_set_updated_at before update on public.tasting_notes
  for each row execute function public.set_updated_at();

create policy "public tasting notes are readable" on public.tasting_notes
  for select to authenticated using (is_public);

-- All visible ratings of a wine (every vintage) with the author's name -
-- profiles stay private, only the display name comes along.
create function public.wine_reviews(p_wine_id uuid)
returns table (
  id uuid,
  author text,
  is_mine boolean,
  vintage smallint,
  rating numeric,
  note text,
  aromas text[],
  structure jsonb,
  tasted_on date,
  is_public boolean
)
language sql stable security definer
set search_path = ''
as $$
  select n.id, coalesce(nullif(p.display_name, ''), 'Jemand'), n.user_id = auth.uid(), v.vintage,
         n.rating, n.note, n.aromas, n.structure, n.tasted_on, n.is_public
  from public.tasting_notes n
  join public.wine_vintages v on v.id = n.vintage_id
  left join public.profiles p on p.id = n.user_id
  where v.wine_id = p_wine_id
    and auth.uid() is not null
    and (n.is_public or n.user_id = auth.uid())
  order by n.tasted_on desc, n.created_at desc
  limit 200
$$;

-- Average of the visible ratings per wine, for lists.
create function public.wine_rating_summary(p_wine_ids uuid[])
returns table (wine_id uuid, avg_rating numeric, ratings integer)
language sql stable security definer
set search_path = ''
as $$
  select v.wine_id, round(avg(n.rating), 1), count(*)::integer
  from public.tasting_notes n
  join public.wine_vintages v on v.id = n.vintage_id
  where v.wine_id = any (p_wine_ids)
    and n.rating is not null
    and auth.uid() is not null
    and (n.is_public or n.user_id = auth.uid())
  group by v.wine_id
$$;

-- ---------------------------------------------------------------------------
-- Prices found on the web (on demand). Shown as "Fundstelle", with shop link.
-- ---------------------------------------------------------------------------

alter table public.price_history add column shop text check (char_length(shop) <= 120);
alter table public.price_history add column bottle_ml integer check (bottle_ml between 100 and 30000);

create function public.record_price_offers(p_vintage_id uuid, p_offers jsonb) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_offer jsonb;
  v_count integer := 0;
begin
  if auth.uid() is null or public.is_anonymous() then
    raise exception 'accounts only' using errcode = '42501';
  end if;
  if jsonb_typeof(p_offers) <> 'array' or jsonb_array_length(p_offers) > 12 then
    raise exception 'offers must be a short list' using errcode = '22023';
  end if;
  for v_offer in select * from jsonb_array_elements(p_offers) loop
    if (v_offer ->> 'url') !~ '^https://' or (v_offer ->> 'price')::numeric not between 0.5 and 100000 then
      continue;
    end if;
    insert into public.price_history (vintage_id, price, currency, source, url, shop, bottle_ml, is_estimate)
    values (
      p_vintage_id,
      round((v_offer ->> 'price')::numeric, 2),
      coalesce(nullif(upper(v_offer ->> 'currency'), ''), 'EUR'),
      'web-search',
      left(v_offer ->> 'url', 1000),
      left(v_offer ->> 'shop', 120),
      nullif(v_offer ->> 'bottle_ml', '')::integer,
      true
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Daily limit for AI requests (label scan, price search) - keeps costs safe.
-- ---------------------------------------------------------------------------

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  kind text not null check (kind in ('scan', 'prices')),
  count integer not null default 0,
  primary key (user_id, day, kind)
);
alter table public.ai_usage enable row level security;
-- No policies: only claim_ai_credit touches it.

create function public.claim_ai_credit(p_kind text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_limit integer := case p_kind when 'scan' then 25 when 'prices' then 20 else 0 end;
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

revoke execute on function public.set_wine_label(uuid, text) from public;
revoke execute on function public.wine_reviews(uuid) from public;
revoke execute on function public.wine_rating_summary(uuid[]) from public;
revoke execute on function public.record_price_offers(uuid, jsonb) from public;
revoke execute on function public.claim_ai_credit(text) from public;
grant execute on function public.set_wine_label(uuid, text) to authenticated;
grant execute on function public.wine_reviews(uuid) to authenticated;
grant execute on function public.wine_rating_summary(uuid[]) to authenticated;
grant execute on function public.record_price_offers(uuid, jsonb) to authenticated;
grant execute on function public.claim_ai_credit(text) to authenticated;
