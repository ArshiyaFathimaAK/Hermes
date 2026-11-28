-- UC-08 Create Trip, UC-09 View Saved Trips.
-- A trip, and the places in it. Things to do are in trip_items; share links in share_links.
-- Places, activities and stays are ids from the Python server, stored as text.

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  -- Dates are optional, but come as a pair.
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_dates_pair check ((start_date is null) = (end_date is null)),
  constraint trips_dates_order check (end_date >= start_date),
  constraint trips_dates_length check (end_date - start_date < 366)
);

create index trips_owner_id on public.trips (owner_id);

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

-- Each place in a trip, in the order they were added, with the stay chosen there.
create table public.trip_places (
  trip_id uuid not null references public.trips (id) on delete cascade,
  place_id text not null check (char_length(place_id) between 1 and 200),
  position integer not null default 0,
  -- UC-06: the stay chosen for this place. Null until one is picked.
  stay_id text check (char_length(stay_id) between 1 and 200),
  created_at timestamptz not null default now(),
  primary key (trip_id, place_id)
);

-- True when the signed-in person owns the trip. Every table that belongs to a trip uses this in its
-- policies, so the ownership rule is written once. It runs with the table owner's rights so policies
-- don't have to read trips through trips' own policies.
create function public.is_trip_owner(trip uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trips t where t.id = trip and t.owner_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_trip_owner(uuid) from public, anon;
grant execute on function public.is_trip_owner(uuid) to authenticated;

alter table public.trips enable row level security;
alter table public.trip_places enable row level security;

create policy "Owners read their trips"
  on public.trips for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "People create trips for themselves"
  on public.trips for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners edit their trips"
  on public.trips for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners delete their trips"
  on public.trips for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners manage the places in their trips"
  on public.trip_places for all to authenticated
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

revoke all on public.trips, public.trip_places from anon;
grant select, insert, update, delete on public.trips, public.trip_places to authenticated;
