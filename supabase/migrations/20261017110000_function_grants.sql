-- The project does not expose new objects automatically, so the helper
-- functions used inside RLS policies get explicit EXECUTE rights here.
-- (They only answer questions about the caller, e.g. "am I a participant?".)

grant execute on function public.is_anonymous() to anon, authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.is_event_organizer(uuid) to authenticated;
grant execute on function public.is_event_participant(uuid) to authenticated;
grant execute on function public.is_glass_revealed(uuid) to authenticated;
grant execute on function public.is_glass_open(uuid) to authenticated;
grant execute on function public.owns_participant(uuid) to authenticated;
