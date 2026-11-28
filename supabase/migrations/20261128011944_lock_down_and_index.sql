-- Found by Supabase's advisors after the first migrations were applied.

-- Supabase lets anyone call new functions through the API. These two are only for triggers.
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Removing a place from a trip deletes its items, found by (trip_id, place_id). This index serves
-- that and every "items in this trip" lookup, so it replaces the trip_id-only one.
drop index public.trip_items_trip_id;
create index trip_items_trip_place on public.trip_items (trip_id, place_id);
