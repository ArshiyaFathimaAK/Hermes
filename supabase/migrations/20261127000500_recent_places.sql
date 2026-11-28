-- UC-04 Search: places each person opened lately, shown under the search bar.
-- Name and region are copied in, so the list shows without asking the server.

create table public.recent_places (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  place_id text not null check (char_length(place_id) between 1 and 200),
  name text not null,
  region text not null default '',
  viewed_at timestamptz not null default now(),
  primary key (owner_id, place_id)
);

alter table public.recent_places enable row level security;

create policy "People manage their own recent places"
  on public.recent_places for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.recent_places from anon;
grant select, insert, update, delete on public.recent_places to authenticated;
