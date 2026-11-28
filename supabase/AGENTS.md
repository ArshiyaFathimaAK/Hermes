# Hermes database (Supabase)

Read `../AGENTS.md` first. **These migrations are a proposal until the project lead applies them.**
Nothing here changes the Supabase project by itself.

## Ask first

Don't change the Supabase project (tables, columns, policies, functions, storage, auth settings)
without the project lead's go-ahead. That includes applying a migration through a Supabase connector,
the CLI or the dashboard. AI agents may read: list tables, read docs, write migration files for review.

## The tables

Each use case has its own table and its own migration file, so people don't edit the same file.

| Migration | Tables | Use case | Who may use it |
| --- | --- | --- | --- |
| `..._shared_helpers` | — (helpers) | everyone | project lead changes it |
| `..._profiles` | `profiles` | UC-01, UC-03 | each person: own row, name only |
| `..._trips` | `trips`, `trip_places` | UC-08, UC-09, UC-06 stays | the trip's owner |
| `..._trip_items` | `trip_items` | UC-10 | the trip's owner |
| `..._share_links` | `share_links`, `get_shared_trip()` | UC-12 | owner; anyone with the token can view |
| `..._recent_places` | `recent_places` | UC-04 | each person: own rows |

What's stored where:

- **Supabase Auth** (`auth.users`) holds email and password. A `profiles` row is made automatically
  at sign-up, from `supabase.auth.signUp({ email, password, options: { data: { name } } })`.
- **Places, activities and stays are not stored here.** They come live from the Python server. Tables
  keep only their ids, as text (`place_id`, `activity_id`, `stay_id`).
- A trip's place order is `trip_places.position`, and its chosen stays are `trip_places.stay_id`.
- An item's `day` and `slot` are both empty until it's put on a day. Order within a slot is
  `sort_order`: to move an item between two others, give it a number between theirs. Nothing else
  changes, so two devices editing one trip rarely collide.
- A share link is one row per trip. Delete it to turn the link off. People without an account view a
  shared trip with `supabase.rpc('get_shared_trip', { share_token })`, never by reading tables.
- Deleting a trip deletes its places, items and link. Deleting an account deletes everything it owns.

## Taking a use case live

Ask your AI for the use case, for example "Implement UC-10 on Supabase, following the AGENTS.md
files". It needs these files; everything else stays as it is.

| Use case | Tables | App service to write (`hermes/src/services/`) |
| --- | --- | --- |
| UC-01 Create account, UC-02 Log in | Supabase Auth, `profiles` | `auth/live.ts` |
| UC-03 Manage profile | `profiles` | `profile/live.ts` |
| UC-04 Recent places | `recent_places` | `places/live.ts` (only `recent()`) |
| UC-08, UC-09, UC-10 Trips | `trips`, `trip_places`, `trip_items` | `trips/live.ts`: already written |
| UC-12 Share trip | `share_links`, `get_shared_trip()` | `sharing/live.ts` |

The tables only work once the project lead has applied the migrations. After that, regenerate
`hermes/src/services/database.types.ts` (see the top of that file).

## Rules for every table

- Turn on row level security, and add policies so people reach only their own rows. Tables that
  belong to a trip use `public.is_trip_owner(trip_id)` in their policies.
- `revoke all ... from anon`, then grant `authenticated` only what the app needs. Supabase lets
  signed-out visitors reach new tables unless you do this.
- Functions that bypass security (`security definer`) set `search_path = ''` and are granted only to
  the roles that need them.
- Checks belong in the database too (`check`, `unique`, foreign keys), not only in the app.
- A table with an `updated_at` column needs the `set_updated_at` trigger.

The tests check all of these for **every** table and function automatically, including new ones.

## Changing the schema

1. Never edit a migration that has been applied: the project already ran it. Add a new file:
   `migrations/<YYYYMMDDHHMMSS>_<what_it_does>.sql`, with the current time, so files sort in order.
   If someone else's new migration lands with a later time than yours, rename yours to the current
   time before it's applied.
   - **Add columns as nullable or with a default.** Copies of the app that people already have don't
     send the new column, so a required one without a default makes their saves fail.
   - **Don't rename or remove a column or table** that the app uses. Add the new one, move the app
     over, and remove the old one later, after asking.
   - Remember what deletes with what: deleting a trip deletes its places, items and link; removing a
     place from a trip deletes its items.
2. Add rules to `tests/policies-test.sql` for your table: what its owner can do, and what someone
   else and a signed-out visitor can't.
3. Run the tests. They use a throwaway local Postgres and never touch Supabase. They need
   PostgreSQL 17 or newer on macOS or Linux, so on Windows ask someone else to run them:

   ```bash
   bash supabase/tests/run-local.sh
   ```

4. Open a pull request and ask the project lead to apply it.
5. After it's applied, regenerate `hermes/src/services/database.types.ts`, then fix whatever
   TypeScript reports, usually a `rows.ts` mapping. Update `hermes/src/domain/` if the app needs the
   new data.
