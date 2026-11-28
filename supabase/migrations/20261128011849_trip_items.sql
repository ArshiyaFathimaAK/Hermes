-- UC-10 Build Itinerary: the things to do saved in a trip, and when.

create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  place_id text not null,
  activity_id text not null check (char_length(activity_id) between 1 and 200),
  -- Both empty until it's put on a day. day 0 is the trip's first day.
  day integer check (day >= 0),
  slot text check (slot in ('morning', 'afternoon', 'evening')),
  -- Order within a slot, lowest first. To move an item between two others, give it any number
  -- between theirs (for example the average), so no other row has to change.
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  constraint trip_items_schedule_pair check ((day is null) = (slot is null)),
  -- Something can be saved in a trip once.
  constraint trip_items_once unique (trip_id, activity_id),
  -- Its place must be one of the trip's places. Removing the place removes its items.
  constraint trip_items_place foreign key (trip_id, place_id)
    references public.trip_places (trip_id, place_id) on delete cascade
);

create index trip_items_trip_id on public.trip_items (trip_id);

alter table public.trip_items enable row level security;

create policy "Owners manage the items in their trips"
  on public.trip_items for all to authenticated
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

revoke all on public.trip_items from anon;
grant select, insert, update, delete on public.trip_items to authenticated;
