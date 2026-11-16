# Prompt for AI coding assistant: Sharad Rangaraju, UC-03 and UC-04 (Project Hermes, Group 04)

You are helping me, Sharad Rangaraju, implement my two assigned use cases in my team's existing codebase for a university software engineering course (CS 3354, Assignment 4). I must be able to explain every line, so keep the code simple, readable and commented. Do not rewrite or restyle teammates' code.

## 1. The codebase (read it before writing anything)

- Repo: https://github.com/ArshiyaFathimaAK/Hermes. All app code is in `modules/trip-planning/`.
- Stack: **Python 3.10+ standard library only** (no pip packages), `http.server` JSON API, SQLite (`sqlite3`), and a plain HTML/CSS/JavaScript front end in `web/`. Tests use `unittest`.
- Run: `python server.py`, then open http://127.0.0.1:8000. Tests: `python -m unittest discover -s tests -v` (run from `modules/trip-planning/`).
- Existing work you must not break:
  - Arshiya: UC-05 filter search (`hermes/catalog.py`, `GET /api/catalog`), UC-08 create trip, and UC-10 itinerary (`services.py`, `repository.py`).
  - Reynard: UC-06 place details (`hermes/details.py`, `GET /api/places/{id}`) and UC-07 weather (`hermes/weather.py`). His front end is `web/details_weather.js`.
- Identity: there is no real login. The API uses a fixed `DEMO_USER` in `hermes/api.py`. Keep using it, and say clearly in comments and docs that real Supabase Auth is not implemented.
- **Follow Reynard's pattern for adding a feature.** Put new logic in new files, and make only small additive edits to shared files (`hermes/api.py`, `web/app.js`, `web/index.html`, `web/style.css`), each marked with a comment like `# Sharad: UC-03` or `/* Sharad: UC-04 */`. Look at how he added his routes, error handler, nav view and `window.hermes` hook, and do the same.

## 2. Follow the repo's existing conventions (most important rule)

Before writing code, read every file in `modules/trip-planning/` and match how it is already done. My code should look like it was written by the same team. When this prompt and the repo's conventions differ on **style or structure**, follow the repo. When they differ on **behavior** (features, messages, test cases), follow this prompt and tell me about the difference.

Conventions observed in the repo. Confirm each one yourself and follow any others you find:

- **Python style:** compact code with short methods and a module docstring at the top of every file. Use dataclasses for domain objects (see `models.py`) and plain dicts in API responses (`asdict`). Use standard library only, with no new dependencies or files like `requirements.txt`.
- **Layering:** the service validates, the repository does SQL, and `api.py` only routes. Mirror `CatalogService` / `TripService` / `TripRepository` / `PlaceDetailService`.
- **Errors:** raise the existing exception classes (`ValidationError`, `NotFoundError`, `ConflictError`). Let `handle_request` in `api.py` map them to 400/404/409. Do not create new error-response code paths. If a new exception type is truly needed, add one `except` branch the way Reynard added `WeatherUnavailable`.
- **Messages:** user-facing messages are short full sentences that end with a period and tell the user what to do (e.g. `Choose a supported location.`). Never show stack traces or internal details.
- **SQLite:** use the `connection()` context-manager pattern, parameterized queries only, `CREATE TABLE IF NOT EXISTS`, and transactions for multi-step writes.
- **API routing:** add routes the same way the existing `route()` method does (path checks, `parse_qs` for query strings, `self.send_json(status, body)`, `self.read_json()` for bodies). Register new static files in the existing file map and content-type map.
- **JavaScript:** use ES modules loaded at the bottom of `index.html`, the `$` id helper, the escape helper for every value inserted into HTML, the `status(id, message, error)` helper with `role="status"` elements, and a request counter to ignore stale responses (see `searchRequest` / `detailsRequest`). Share functions across files through `window.hermes` (see `app.js` line ~110) instead of using globals or duplicating code.
- **HTML/CSS:** each view is a `<section id="..." hidden aria-labelledby="...">` with the same heading pattern (`eyebrow` text, `h1`, short line). Forms use visible `<label for>`s. Reuse existing CSS classes (`trip-form`, `results`, `result`, `secondary`, `full`, `two`, `chip`). Append any new CSS as one marked block at the end of `style.css`.
- **Tests:** `unittest` with a temporary database per test (`tempfile.TemporaryDirectory`), a real server on a free port for API tests (see `test_details_weather.py`), concrete fixtures, exact expected values and messages. Names follow `test_<ID>_<short_description>`, so mine are `test_SR_TC01_...`. Use mocks only where existing tests do.
- **Data honesty:** keep the existing "synthetic / sample data" and "demo identity, not real auth" disclaimers in docstrings, the UI and docs. Do not invent real addresses, links or providers.
- **Evidence and docs:** match the first-line header format of `evidence/rl_test_results.txt`, the JSON shape of `docs/test_cases.json` and `docs/rtm.json`, and the section layout of `docs/RL_contribution.md`.
- **Contribution markers:** add a short author comment at each edit in a shared file, as Reynard did (`# Reynard: UC-06/07`).

## 3. File header rule (required for grading)

Every new file starts with a header like this:

```
"""UC-03 Manage User Profile.

Author: Sharad Rangaraju (AI-assisted draft, reviewed by author).
Purpose: <one or two sentences on what this module does and what it does not do>.
"""
```

Use the same idea for JavaScript (`// Sharad Rangaraju: ...`).

## 4. UC-03 Manage User Profile (FR-06)

Behavior (matches my sequence diagram): the user opens their profile, the app loads it, the user edits fields and taps Save, the server validates, then it either saves and shows "Profile saved." or shows a specific field error. Unsaved input must stay in the form after an error.

Create `hermes/profile.py` with:

- A `Profile` dataclass with fields `user_id`, `display_name`, `email`, `phone`, `address`, `version`.
- `ProfileRepository(db_path)`. It creates its own table `profiles` in the same SQLite file (`CREATE TABLE IF NOT EXISTS`, primary key `user_id`). Copy the connection pattern from `TripRepository`. It has `get(user_id)` (returns an empty profile with `version` 0 if no row exists) and `save(user_id, data, expected_version)`. `save` inserts or updates and bumps `version`, and raises the existing `ConflictError` if the version does not match.
- `ProfileService` validates input and raises the existing `ValidationError` from `hermes/catalog.py` with these **exact** messages:
  - Name missing or longer than 60 characters after trimming: `Enter your name (1-60 characters).`
  - Email missing or not a basic `name@domain.tld` shape: `Enter a valid email address.`
  - Phone (optional) not 7-20 characters of digits, spaces, `+ - ( )`: `Enter a valid phone number.`
  - Address (optional) longer than 120 characters: `Address must be 120 characters or fewer.`
  - Any field outside the list above: `Unsupported profile field: <name>.`
  - Trim whitespace before saving.

API (add to `hermes/api.py`, using `DEMO_USER`):

- `GET /api/profile` returns 200 `{"profile": {...}}`.
- `PUT /api/profile` with body `{"display_name", "email", "phone", "address", "version"}` returns 200 `{"profile": {...}, "message": "Profile saved."}`. Validation errors return 400. A version mismatch returns 409 `Your profile changed. Reload before saving again.`

UI: add a **Profile** nav button and a `<section id="profile">` with labeled inputs, a Save button and a `role="status"` message. Add `'profile'` to the view list in `navigate()` in `app.js`.

## 5. UC-04 Search for Destination (FR-07, FR-08)

This is different from Arshiya's UC-05 filter search, so do not modify `CatalogService` or `/api/catalog`. My use case adds:

- A search bar that is **always visible in the header on every page** (FR-08).
- A dedicated search results page with preview cards.
- Search that covers names, locations, categories **and** Reynard's place descriptions, with ranked results. Search pulls from the other modules' data and does not own any data itself.

Create `hermes/search.py` with `SearchService.search(q)`:

- Trim `q`. Empty or whitespace-only raises `ValidationError('Enter a search term.')`. More than 80 characters raises `ValidationError('Search terms must be 80 characters or fewer.')`.
- Split into lowercase words. A place matches only if **every** word appears in its name, location, category, or description. Read places from `hermes.catalog.PLACES` and descriptions through `PlaceDetailService().get(id)` from `hermes/details.py`. Do not copy the data.
- Score: +3 per word found in the name, +2 per word in the location, +1 per word in the category, +1 per word in the description. Sort by score (high first), then rating (high first), then name.
- Return preview dicts: `id`, `name`, `location`, `category`, `rating`, `price` and `snippet` (first ~90 characters of the description).

API: `GET /api/search?q=...` returns 200 `{"results": [...], "message": ..., "sample_data": true}`. The message is `"<n> results for \"<q>\"."` when there are results and `No results found. Try a different search term.` when there are none. Validation errors return 400.

UI: put the header search form in `index.html` (visible on every view) and add a `<section id="search">` results view with cards. Each card has a **View details** button that opens Reynard's details page. Expose his existing open-details function through `window.hermes` with a `/* Sharad */` comment instead of duplicating it. Put my front-end code in a new `web/profile_search.js` loaded like `details_weather.js`, and register it in the static-file map in `api.py`. Escape all text inserted into HTML, the same way the existing code does.

## 6. Tests (required: at least 2, aim for all of these)

Create `tests/test_profile_search.py`. Each test uses a temporary database, concrete data and an exact expected result, as in `tests/test_details_weather.py`. Name tests `test_SR_TCxx_...`:

| ID      | UC    | Case                                                                                                                                 | Expected                                                                             |
| ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| SR-TC01 | UC-03 | Save a valid profile (Sharad Rangaraju / sharad@example.com / 972-555-0100), then read it back through a **new** repository instance | Fields persisted and trimmed, version 1                                              |
| SR-TC02 | UC-04 | Search `austin lodging`                                                                                                              | Results are ids [1, 2] (Lakeside House, then The Congress Stay). Confirm by running. |
| SR-TC03 | UC-03 | Invalid emails (`sharad`, `a@b`, ``)                                                                                                 | `Enter a valid email address.`                                                       |
| SR-TC04 | UC-03 | Name blank or 61 characters                                                                                                          | `Enter your name (1-60 characters).`                                                 |
| SR-TC05 | UC-03 | Unknown field `role`                                                                                                                 | `Unsupported profile field: role.`                                                   |
| SR-TC06 | UC-03 | Save with a stale version                                                                                                            | 409 conflict message, stored data unchanged                                          |
| SR-TC07 | UC-04 | Search `rooftop` (description-only match)                                                                                            | Only The Congress Stay (id 2)                                                        |
| SR-TC08 | UC-04 | Search `zzzz` through the API                                                                                                        | 200, empty results, the "No results found..." message                                |
| SR-TC09 | UC-04 | Search ``, `   ` and 81 characters through the API                                                                                   | 400 with the exact messages                                                          |
| SR-TC10 | UC-03 | HTTP round trip: GET, then PUT valid, then PUT invalid                                                                               | 200 / 200 "Profile saved." / 400 with message                                        |
| SR-NF01 | UC-04 | 100 searches in a loop                                                                                                               | Average under 50 ms locally (report the measured number)                             |

Then run the **whole** suite, not just mine, and confirm every existing test still passes. Save the full output to `evidence/sr_test_results.txt` with a first line stating the date, OS and Python version, and that it is an assistant run, not my personal run. `evidence/` files are in `.gitignore`, so I will add it with `git add -f` when I commit (see section 8).

## 7. Docs to produce

Create `docs/SR_contribution.md` modeled on `docs/RL_contribution.md`. It should cover:

1. What I implemented: use case, FR IDs, files and endpoints, and every shared file I touched.
2. A test case table with these columns: ID, UC, purpose, preconditions, input data, steps, expected result (exact messages), actual result, status (Pass/Fail/Not Run), creator (Sharad Rangaraju).
3. RTM rows: FR-06 → UC-03 → SR-TC01, 03-06, 10. FR-07/FR-08 → UC-04 → SR-TC02, 07-09, SR-NF01.
4. Demo limits: synthetic catalog, fixed demo identity (no real Supabase Auth), SQLite instead of Supabase.
5. An AI-use section with placeholders for me to fill in.

Also append my rows to `docs/test_cases.json` and `docs/rtm.json` in the existing format, and add `Sharad Rangaraju · UC-03 / UC-04` to the footer in `index.html`.

## 8. Git

**Do not run any git command that changes the repository.** That means no `git checkout -b`, `branch`, `add`, `commit`, `stash`, `merge`, `rebase`, `pull`, `push`, `reset` or `restore`, and no pull requests. Just edit the files in my working copy on `main`. I will commit and push to `main` myself.

Read-only git commands are fine: `git status`, `git diff`, `git log`, `git fetch`.

When the code and tests are done, check for merge conflicts without changing anything:

1. Run `git fetch origin`, then `git log HEAD..origin/main --oneline` to see whether teammates pushed new commits after my copy was made.
2. If there are new commits, run `git diff HEAD origin/main --stat` and compare their changed files with mine. Pay special attention to the shared files (`hermes/api.py`, `web/app.js`, `web/index.html`, `web/style.css`, `docs/test_cases.json`, `docs/rtm.json`). For each overlapping file, show me both versions of the conflicting area and the exact combined text I should keep. Do not apply it yourself.
3. If there are no new commits, tell me there are no conflicts.

Then give me:

- The exact list of files I should stage, including `git add -f evidence/sr_test_results.txt` because `evidence/` is gitignored. Leave out `hermes.db`, `__pycache__/` and any temporary files.
- A ready-to-paste commit message: a one-line summary under 72 characters (e.g. `Add UC-03 Manage Profile and UC-04 Search (Sharad Rangaraju)`), a blank line, then short bullet points covering the new files, the shared-file edits, the tests added and the pass count.
- The commands to run in order (`git pull`, `git add ...`, `git commit`, `git push`), so I can review and run them myself.

## 9. Rules

- Do not claim I ran or reviewed anything. Say "assistant run" wherever applicable, and I will rerun the tests myself.
- If something in the existing code conflicts with these instructions, stop and tell me rather than changing a teammate's behavior.
- Before finishing, re-read your diff against section 2 and fix anything that doesn't match the repo's conventions.
- Never commit, push, branch or open a pull request, even if it seems helpful. Section 8 lists the only git commands you may run.
- When done, give me: a list of files created and changed, the test output summary (pass/fail counts), and a short plain-English explanation of how each use case works, which I can use when presenting.
