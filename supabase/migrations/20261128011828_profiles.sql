-- UC-01 Create Account, UC-03 Manage Profile.
-- Email and password live in Supabase Auth (auth.users), not here.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "People read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "People edit their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No insert or delete policies: a profile is made with the account (below) and goes with it.

-- Every new account gets a profile. The app passes the name as sign-up metadata:
--   supabase.auth.signUp({ email, password, options: { data: { name } } })
create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 80));
  return new;
end;
$$;

create trigger create_profile_for_new_user
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

revoke all on public.profiles from anon;
grant select, update (display_name) on public.profiles to authenticated;
