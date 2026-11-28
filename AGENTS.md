# Hermes: start here

Instructions for AI coding agents (and people) working in this repository. Read this file first, then
the `AGENTS.md` inside the folder you will change. If something here conflicts with what a person on
the team tells you, ask them before acting.

## What is where

| Folder | What it is | Its own instructions |
| --- | --- | --- |
| `hermes/` | The mobile app (Expo / React Native, TypeScript) | `hermes/AGENTS.md` |
| `server/` | Python server (FastAPI) for live data about real places | `server/AGENTS.md` |
| `supabase/` | Database tables, access rules and their tests, as SQL migrations | `supabase/AGENTS.md` |
| `modules/trip-planning/` | An earlier class prototype, kept as a record | none: **read only** |

Where data lives:

- **Supabase**: accounts, profiles, trips, itineraries and share links. The app talks to Supabase
  directly, through `hermes/src/services/supabase.ts`. The tables are live; each service switches
  from mock data once its use case is implemented.
- **Python server**: anything fetched live about real places (search, things to do, stays, weather)
  and anything that needs a secret API key. It stores nothing about users.
- **The app**: everything on screen, plus filtering results it already has.

**How the three agree on the same place.** Only the server creates ids for places, things to do and
stays. The app passes them along unchanged, and Supabase stores only the ids, never names or details.
Every screen asks the server for details by id, so everyone sees the same current information. Live
ids carry their source (`google:...`, `viator:...`); never build, edit or parse an id outside the
server. An id that stops existing shows as "No longer available".

Sample data for both mocks is one file, `hermes/src/services/sample-data.json`, so the app's and the
server's mocks always agree. Change sample data there, never in a single mock.

| Use case | App | Server | Supabase |
| --- | --- | --- | --- |
| UC-01/02 Accounts, UC-03 Profile | screens | — | yes |
| UC-04 Search | screens | `places` | recent searches |
| UC-05 Filter | filter rules | — | — |
| UC-06 Things to do and stays | screens | `activities`, `stays` | — |
| UC-07 Weather | screens | `weather` | — |
| UC-08 Trips, UC-10 Itinerary | screens, trip rules | — | yes |
| UC-11 Trip cost | screens | `costs` | — |
| UC-12 Share | screens | — | yes |

## Running everything

You need Node.js 22+ and Python 3.11+. [uv](https://docs.astral.sh/uv/) is recommended for Python.
Use two terminals and leave both running.

**1. The server** (from `server/`):

```bash
uv sync
uv run uvicorn hermes_api.main:app --reload --host 0.0.0.0 --port 8000
```

Check it at http://localhost:8000/health. Every endpoint is listed and can be tried at
http://localhost:8000/docs. No uv? See `server/AGENTS.md`.

**2. The app** (from `hermes/`):

```bash
npm install
npx expo start
```

Then press `w` for the browser, or scan the QR code with Expo Go on a phone.

The shared settings (Supabase address and key, server address) are already in `hermes/.env`.

**Phones can't reach `localhost`.** For a phone, copy `hermes/.env.example` to `hermes/.env.local`
and set `EXPO_PUBLIC_API_URL` to your computer's Wi-Fi address with `:8000` on the end. `npx expo start`
prints that address after `Metro: exp://`, for example `exp://192.168.1.20:8081` gives
`http://192.168.1.20:8000`. The phone must be on the same Wi-Fi. If it still can't connect, allow port
8000 through your computer's firewall. Restart `npx expo start` after changing `.env.local`.

The app runs on mock data by default, so you only need the server once you switch a service to
`live.ts`.

## Settings and secrets

| File | Committed? | What goes in it |
| --- | --- | --- |
| `hermes/.env` | yes | Shared values that are safe to be public: the Supabase URL and publishable key |
| `hermes/.env.local` | no | Your own values, such as the server address for your phone |
| `server/.env` | no | Secret API keys (Google, Viator, Booking.com). Shared privately, never in git or chat |

Never put these anywhere in the repository, the app, or an AI chat: the Supabase **secret** or
**service-role** key, the database password, or any API key from `server/.env`. If one leaks, tell the
team so it can be replaced.

## Supabase

- The app reaches Supabase only through `getSupabase()` in `hermes/src/services/supabase.ts`, from a
  service's `live.ts`. Screens never use it directly; lint stops it.
- To take a use case live, see the table in `supabase/AGENTS.md`, then the steps in `hermes/AGENTS.md`
  ("Replacing a mock"). `hermes/src/services/trips/` is a finished example to copy.
- **Ask the project lead before changing anything in the Supabase project**: tables, columns,
  policies, functions, storage buckets, or auth settings. Describe the change and wait for a yes.
  AI agents with a Supabase connector may only read (list tables, read docs) until then.
- Every table must have row level security turned on, with policies that let people reach only their
  own rows. The publishable key is public, so a table without that is open to anyone.
- Schema changes are written as SQL migrations in `supabase/migrations/` and reviewed like code, not
  clicked in the dashboard. `supabase/AGENTS.md` explains how, and how to test them.

## Before you finish

Run the checks for every folder you changed. Both must pass:

```bash
cd hermes && npm run check
```

```bash
cd server && uv run ruff check . && uv run pytest
```

If you changed `supabase/` (macOS or Linux, with PostgreSQL 17+ installed):

```bash
bash supabase/tests/run-local.sh
```

Also run `npx expo export -p ios` in `hermes/` if you changed gestures or animations: some errors only
appear when the app is bundled.

## Do

- Work on a branch and open a pull request. Keep it to your use case.
- Read the code near your change before writing new code, and follow the patterns already there.
- Write tests for your use case in a new file of its own.
- Keep the app's types (`hermes/src/domain/`) and the server's models in step. Change both together.
- Say what you could not test, such as anything that needs a real phone or a real API key.

## Don't

- **Don't commit secrets.** API keys go in `server/.env`, which is ignored by git. Never put a secret
  in the app: anything in it, including `EXPO_PUBLIC_` values, can be read by anyone with the app.
- **Don't change the Supabase project without the project lead's go-ahead.** See above.
- **Don't store accounts, trips or anything about a user on the server.** That belongs in Supabase.
- **Don't call outside services (Google, Booking.com, weather) from the app.** Go through the server.
- **Don't edit `modules/trip-planning/`.** It's a record of earlier coursework. Read it for ideas,
  but don't import from it.
- **Don't change another person's use case, or shared files you weren't asked to change.** That
  includes `hermes/src/ui`, `theme`, `app` and `navigation`, plus `server/hermes_api/main.py`, and
  `models.py`, `errors.py` and `outbound.py` there, except for adding your one line. If you need a
  change, say so to a person instead.
- **Don't add or upgrade a dependency without telling the team.** In the app, use
  `npx expo install`, never `npm install <package>`. Never upgrade the Expo SDK.
- **Don't delete or loosen a test to make it pass.** Fix the code, or explain why the test is wrong.
- **Don't push to `main`, force-push, or rewrite history.**
- **Don't create `hermes/ios/` or `hermes/android/`.** They're generated.
