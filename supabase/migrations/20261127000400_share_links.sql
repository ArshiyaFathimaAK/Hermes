-- UC-12 Share Trip. One link per trip; anyone with the token can view that trip, without signing in.

create table public.share_links (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  -- 122 random bits. Deleting the row turns the link off.
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

alter table public.share_links enable row level security;

create policy "Owners manage their trips' share links"
  on public.share_links for all to authenticated
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

revoke all on public.share_links from anon;
grant select, insert, delete on public.share_links to authenticated;

-- What a link shows, shaped like SharedTrip in hermes/src/services/sharing/contract.ts.
-- It leaves out the owner and the trip id. Null when the token doesn't match a link.
--   supabase.rpc('get_shared_trip', { share_token: token })
create function public.get_shared_trip(share_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', t.name,
    'placeIds', coalesce(
      (select jsonb_agg(p.place_id order by p.position, p.created_at)
         from public.trip_places p where p.trip_id = t.id),
      '[]'::jsonb),
    'dates', case when t.start_date is null then null
      else jsonb_build_object('start', t.start_date, 'end', t.end_date) end,
    'items', coalesce(
      (select jsonb_agg(
          jsonb_strip_nulls(jsonb_build_object(
            'activityId', i.activity_id,
            'placeId', i.place_id,
            'schedule', case when i.day is null then null
              else jsonb_build_object('day', i.day, 'slot', i.slot) end))
          order by i.day nulls last,
            array_position(array['morning', 'afternoon', 'evening'], i.slot),
            i.sort_order, i.created_at)
         from public.trip_items i where i.trip_id = t.id),
      '[]'::jsonb),
    'stayIds', coalesce(
      (select jsonb_object_agg(p.place_id, p.stay_id)
         from public.trip_places p where p.trip_id = t.id and p.stay_id is not null),
      '{}'::jsonb)
  )
  from public.share_links s
  join public.trips t on t.id = s.trip_id
  where s.token = share_token;
$$;

revoke execute on function public.get_shared_trip(text) from public;
grant execute on function public.get_shared_trip(text) to anon, authenticated;
