-- A photo per evening (the group, or the bottle of the night) for the
-- evening patch in the collection. Stored privately: only people who were
-- part of that evening can see it. Files live under "<event id>/<file>".

alter table public.events add column photo_path text check (char_length(photo_path) <= 300);

-- May this user see / add files under this storage path?
create function public.can_use_event_photo(p_name text) returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_event uuid;
begin
  begin
    v_event := split_part(p_name, '/', 1)::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  return public.is_event_participant(v_event) or public.is_event_organizer(v_event);
end;
$$;

-- Everyone at the table may set the evening's photo (not only the organizer).
create function public.set_event_photo(p_event_id uuid, p_path text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not (public.is_event_participant(p_event_id) or public.is_event_organizer(p_event_id)) then
    raise exception 'only people of this evening can set its photo' using errcode = '42501';
  end if;
  if p_path is not null and split_part(p_path, '/', 1) <> p_event_id::text then
    raise exception 'photo belongs to another evening' using errcode = '22023';
  end if;
  update public.events set photo_path = p_path where id = p_event_id;
end;
$$;

revoke execute on function public.can_use_event_photo(text) from public;
revoke execute on function public.set_event_photo(uuid, text) from public;
grant execute on function public.can_use_event_photo(text) to authenticated;
grant execute on function public.set_event_photo(uuid, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-photos', 'event-photos', false, 5242880, '{image/jpeg,image/png,image/webp}')
on conflict (id) do nothing;

create policy "evening photos: people of the evening read" on storage.objects
  for select to authenticated
  using (bucket_id = 'event-photos' and public.can_use_event_photo(name));
create policy "evening photos: people of the evening upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-photos' and public.can_use_event_photo(name));
create policy "evening photos: uploader removes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-photos' and owner = (select auth.uid()));
