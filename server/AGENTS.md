# Hermes server

FastAPI server for **live data about real places**: search, things to do, stays, weather and cost
estimates. It runs on mock data until each use case is implemented. Read `../AGENTS.md` first.

It does **not** store users, accounts or trips. Those are in Supabase, which the app talks to directly.

## Running it

With [uv](https://docs.astral.sh/uv/) (recommended), from this folder:

```bash
uv sync
uv run uvicorn hermes_api.main:app --reload --host 0.0.0.0 --port 8000
```

Without uv, macOS or Linux:

```bash
python3 -m venv .venv && source .venv/bin/activate && pip install -e . --group dev
uvicorn hermes_api.main:app --reload --host 0.0.0.0 --port 8000
```

Without uv, Windows (PowerShell):

```powershell
py -m venv .venv; .venv\Scripts\Activate.ps1; pip install -e . --group dev
uvicorn hermes_api.main:app --reload --host 0.0.0.0 --port 8000
```

`--host 0.0.0.0` lets a phone on the same Wi-Fi reach it. Try every endpoint at
http://localhost:8000/docs. Keys go in `.env`; copy `.env.example` to start.

Checks, which must pass before a pull request (drop `uv run` without uv):

```bash
uv run ruff check . && uv run ruff format --check . && uv run pytest
```

## How it's organized

```
hermes_api/
  main.py        Lists each feature's router. Add yours here, nothing else.
  config.py      Settings and API keys, read from .env.
  errors.py      ApiError, NotFound, UpstreamUnavailable. Every error is {"error": "message"}.
  models.py      ApiModel: snake_case in Python, camelCase in JSON.
  outbound.py    get_json(): call an outside service with a timeout and a friendly error.
  features/
    <feature>/
      models.py    Request and response shapes. Must match hermes/src/domain/.
      provider.py  The interface (a Protocol), and get_<feature>_provider(): which one is used.
      mock.py      Reads the shared sample data. Keep it working.
      router.py    The HTTP endpoints. Thin: check input, call the provider, return.
      live.py      Yours to write: the real implementation.
  ids.py         make_id / split_id: live ids carry their source (google:..., viator:...).
  sample_data.py Loads ../hermes/src/services/sample-data.json, shared with the app's mocks.
tests/           One test file per feature. They use the mocks, so they need no network or keys.
```

| Use case | Feature | Endpoints |
| --- | --- | --- |
| UC-04 Search | `places` | `GET /places/search?q=`, `GET /places/{id}` |
| UC-06 Things to do | `activities` | `GET /places/{id}/activities`, `GET /activities?ids=a,b`, `GET /activities/{id}` |
| UC-06 Stays | `stays` | `GET /places/{id}/stays`, `GET /stays?ids=a,b` |
| UC-07 Weather | `weather` | `GET /places/{id}/weather/current`, `GET /places/{id}/weather/daily?start=&end=` |
| UC-11 Trip cost | `costs` | `POST /costs/estimate` |

## Implementing your use case

1. Write `features/<feature>/live.py`: a class with the same methods as the Protocol in `provider.py`.
   Call outside services with `outbound.get_json()`, and read keys from `get_settings()`.
2. Point `get_<feature>_provider()` in `provider.py` at it. That one line switches the server over.
   If your provider needs a key that isn't set, fall back to the mock, so teammates without the key
   can still run everything.
3. Give every id its source with `make_id("google", place_id)` from `ids.py`, and read it back
   with `split_id` to know which service to ask. Ids must stay the same for the same thing: the app
   saves them in Supabase and asks for them again later.
   Map the outside service's data into this feature's models. Leave a field empty (`None`) when the
   source has no value: the app hides it. Never invent a value.
4. Raise `NotFound` for unknown ids and `ApiError("...")` for bad input. Outside failures come from
   `get_json` as `UpstreamUnavailable`. Messages are shown to people, so write them for people.
5. Add tests in `tests/test_<feature>.py`. To test your router without calling the real service,
   replace the provider: `app.dependency_overrides[get_place_provider] = FakeProvider`
   (see `tests/test_places.py`). Test your mapping code with saved sample responses, not live calls.
6. Switch the app over: copy `hermes/src/services/places/live.ts`, then change that service's
   `index.ts`. See `hermes/AGENTS.md`.

### A new endpoint or field

- Field names match the app: `review_count` in Python is `reviewCount` in JSON and in
  `hermes/src/domain/`. Add new fields as **optional** on both sides, in the same pull request.
- Never rename or remove a field, or change what an endpoint returns, without the team agreeing. The
  app and teammates depend on it.
- A brand new feature: copy a folder in `features/`, then add its router to `FEATURE_ROUTERS` in `main.py`.

## Don't

- Don't use Supabase from the server unless the team agrees, and never with the secret or
  service-role key without the project lead's approval.
- Don't store or accept user data (accounts, trips, profiles). If an endpoint ever needs to know who is
  asking, it must check their Supabase login token. Ask the team before adding that.
- Don't put a key in code, tests, logs or responses. Use `.env` and `config.py`.
- Don't make the tests call real services. They must pass offline, without keys.
- Don't put logic in `router.py`. It belongs in the provider, where it can be tested and swapped.
- Don't add a dependency without telling the team. Use `uv add <package>`, which updates `uv.lock`.
