-- Policy and rule tests. Run with: bash supabase/tests/run-local.sh
\set ON_ERROR_STOP 1
create schema t;
-- helpers: run SQL as a person, and check it succeeds, fails, or returns n rows
create function t.as_user(who text) returns void language plpgsql as $$
begin
  if who = 'anon' then
    perform set_config('request.jwt.claim.sub', '', false); execute 'set role anon';
  else
    perform set_config('request.jwt.claim.sub', who, false); execute 'set role authenticated';
  end if;
end $$;
create function t.must_fail(label text, stmt text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'PASS refused  %: %', label, sqlerrm; return; end;
  raise exception 'FAIL: % was allowed', label;
end $$;
create function t.rows(label text, stmt text, expected int) returns void language plpgsql as $$
declare n int;
begin
  execute format('select count(*) from (%s) q', stmt) into n;
  if n <> expected then raise exception 'FAIL: % gave % rows, wanted %', label, n, expected; end if;
  raise notice 'PASS %: % rows', label, n;
end $$;
create function t.changed(label text, stmt text, expected int) returns void language plpgsql as $$
declare n int;
begin
  execute stmt; get diagnostics n = row_count;
  if n <> expected then raise exception 'FAIL: % changed % rows, wanted %', label, n, expected; end if;
  raise notice 'PASS %: changed % rows', label, n;
end $$;
grant usage on schema t to anon, authenticated;
grant execute on all functions in schema t to anon, authenticated;

-- Sign-up: Supabase Auth inserts these; profiles must appear on their own.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'ana@example.com', '{"name":"Ana"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'ben@example.com', '{}');
select t.rows('profile made at sign-up, with name', $$select 1 from profiles where display_name = 'Ana'$$, 1);

-- ===== Ana builds a trip
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into trips (id, name, start_date, end_date) values
  ('11111111-0000-0000-0000-000000000001', 'Lisbon', '2026-12-03', '2026-12-07');
select t.rows('owner filled in automatically', $$select 1 from trips where owner_id = auth.uid()$$, 1);
insert into trip_places (trip_id, place_id, position) values
  ('11111111-0000-0000-0000-000000000001', 'lisbon', 0);
insert into trip_items (trip_id, place_id, activity_id, day, slot, sort_order) values
  ('11111111-0000-0000-0000-000000000001', 'lisbon', 'belem', 0, 'morning', 1),
  ('11111111-0000-0000-0000-000000000001', 'lisbon', 'lxf', 0, 'morning', 2),
  ('11111111-0000-0000-0000-000000000001', 'lisbon', 'market', null, null, 0),
  ('11111111-0000-0000-0000-000000000001', 'lisbon', 'alfama', 0, 'afternoon', 0);
-- reorder by giving lxf a number between: no other row changes
select t.changed('move one item before another', $$update trip_items set sort_order = 0.5 where activity_id = 'lxf'$$, 1);
update trip_places set stay_id = 'river' where place_id = 'lisbon';
select t.must_fail('item for a place not in the trip', $$insert into trip_items (trip_id, place_id, activity_id) values ('11111111-0000-0000-0000-000000000001', 'kyoto', 'temple')$$);
select t.must_fail('same thing saved twice', $$insert into trip_items (trip_id, place_id, activity_id) values ('11111111-0000-0000-0000-000000000001', 'lisbon', 'belem')$$);
select t.must_fail('day without a time of day', $$update trip_items set day = 1 where activity_id = 'market'$$);
select t.must_fail('only one trip date', $$insert into trips (name, start_date) values ('Half', '2026-12-01')$$);
select t.must_fail('dates backwards', $$insert into trips (name, start_date, end_date) values ('Back', '2026-12-05', '2026-12-01')$$);
select t.must_fail('empty trip name', $$insert into trips (name) values ('')$$);
select t.must_fail('making a trip for someone else', $$insert into trips (name, owner_id) values ('Theirs', 'bbbbbbbb-0000-0000-0000-000000000002')$$);
select t.must_fail('giving my trip away', $$update trips set owner_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$);
select t.changed('rename own profile', $$update profiles set display_name = 'Ana B'$$, 1);
select t.must_fail('change own profile id', $$update profiles set id = 'bbbbbbbb-0000-0000-0000-000000000003'$$);
select t.must_fail('create a second profile', $$insert into profiles (id) values ('aaaaaaaa-0000-0000-0000-000000000001')$$);
insert into recent_places (place_id, name, region) values ('lisbon', 'Lisbon', 'Portugal');
insert into share_links (trip_id) values ('11111111-0000-0000-0000-000000000001');
select token as share_token from share_links \gset
reset role;

-- ===== Ben, signed in, sees none of it and can change none of it
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.rows('Ben sees Ana''s trips', 'select 1 from trips', 0);
select t.rows('Ben sees Ana''s places', 'select 1 from trip_places', 0);
select t.rows('Ben sees Ana''s items', 'select 1 from trip_items', 0);
select t.rows('Ben sees Ana''s share links', 'select 1 from share_links', 0);
select t.rows('Ben sees Ana''s recent places', 'select 1 from recent_places', 0);
select t.rows('Ben sees only his own profile', 'select 1 from profiles', 1);
select t.changed('Ben renames Ana''s trip', $$update trips set name = 'Mine' where id = '11111111-0000-0000-0000-000000000001'$$, 0);
select t.changed('Ben deletes Ana''s trip', $$delete from trips where id = '11111111-0000-0000-0000-000000000001'$$, 0);
select t.changed('Ben renames Ana', $$update profiles set display_name = 'x' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$, 0);
select t.must_fail('Ben adds to Ana''s trip', $$insert into trip_items (trip_id, place_id, activity_id) values ('11111111-0000-0000-0000-000000000001', 'lisbon', 'sintra')$$);
select t.must_fail('Ben shares Ana''s trip', $$insert into share_links (trip_id) values ('11111111-0000-0000-0000-000000000001')$$);
reset role;

-- ===== Someone signed out
select t.as_user('anon');
select t.must_fail('signed out reads trips', 'select 1 from trips');
select t.must_fail('signed out reads profiles', 'select 1 from profiles');
select t.must_fail('signed out lists share links', 'select 1 from share_links');
select t.must_fail('signed out checks trip ownership', $$select public.is_trip_owner('11111111-0000-0000-0000-000000000001')$$);


select t.rows('link shows morning before afternoon, in the chosen order', format(
  $$select 1 where (select array_agg(e ->> 'activityId')
     from jsonb_array_elements(public.get_shared_trip(%L) -> 'items') e)
     = array['lxf', 'belem', 'alfama', 'market']$$, :'share_token'), 1);
select t.rows('wrong token shows nothing', $$select 1 where public.get_shared_trip('guess') is not null$$, 0);
reset role;

-- ===== Deleting a trip takes everything in it, and turns its link off
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select t.changed('Ana deletes her trip', $$delete from trips$$, 1);
select t.rows('its places, items and link went too', 'select 1 from trip_places union all select 1 from trip_items union all select 1 from share_links', 0);
reset role;
select t.rows('old link shows nothing', $$select 1 where public.get_shared_trip('$$ || :'share_token' || $$') is not null$$, 0);
-- ===== Rules every table and function must follow, including ones added later
reset role;
select t.rows('tables without row level security',
  $$select 1 from pg_tables where schemaname = 'public' and not rowsecurity$$, 0);
-- Tables are referred to by oid: by name, Postgres may check other schemas' tables first.
select t.rows('tables signed-out visitors can read or change',
  $$select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p')
       and (has_table_privilege('anon', c.oid, 'SELECT') or has_table_privilege('anon', c.oid, 'INSERT')
         or has_table_privilege('anon', c.oid, 'UPDATE') or has_table_privilege('anon', c.oid, 'DELETE'))$$, 0);
select t.rows('tables with row level security on but no policies (nobody could use them)',
  $$select 1 from pg_tables p where schemaname = 'public'
     and not exists (select 1 from pg_policies q where q.schemaname = 'public' and q.tablename = p.tablename)$$, 0);
select t.rows('security definer functions without a fixed search_path',
  $$select 1 from pg_proc f join pg_namespace n on n.oid = f.pronamespace
     where n.nspname = 'public' and f.prosecdef
       and not exists (select 1 from unnest(coalesce(f.proconfig, '{}')) c where c like 'search_path=%')$$, 0);
select t.rows('updated_at columns that never update',
  $$select 1 from pg_attribute a join pg_class c on c.oid = a.attrelid
       join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and a.attname = 'updated_at' and not a.attisdropped
       and not exists (
         select 1 from pg_trigger g join pg_proc f on f.oid = g.tgfoid
          where g.tgrelid = c.oid and f.proname = 'set_updated_at')$$, 0);

\echo ALL TESTS PASSED
