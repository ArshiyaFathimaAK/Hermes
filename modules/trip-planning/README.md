# Project Hermes — Arshiya's Assignment 4 contribution

Includes UC-05 Filter Search Results, UC-08 Create Trip, and the assigned
UC-10 Build Itinerary subset. Prepared for Arshiya Fathima with ChatGPT/Codex assistance.

## Run on Windows, macOS, or Linux

1. Extract this archive into a folder.
2. Open a terminal in the folder containing `server.py`.
3. Run `python server.py` (Windows also supports `py server.py`).
4. Open **http://127.0.0.1:8000** in your browser.
5. Keep the terminal open. Press Ctrl+C to stop.

Python 3.10+ with the standard-library sqlite3 module is required. No pip installs
are needed to run the application or the 28 unit/API tests. SQLite creates
`hermes.db` automatically. The application binds only to localhost.

## What works

- Search cards with keyword, location, category, price, rating, and amenity filters.
- Active-filter chips, clear filters, explicit no-results and validation messages.
- Create and review a named trip with multiple selected destinations and dates.
- Persist trips in SQLite; reopen them through My trips after restarting.
- Day-specific itinerary stops, destination/lodging selection, drag ordering,
  Up/Down controls, removal, and explicit Save itinerary.
- Atomic itinerary replacement with rollback and optimistic version checking.
- Preserves a draft on save error and guards navigation away from unsaved itinerary.

## Demo boundaries and integration work

- Catalog is 8 explicitly synthetic records in 3 supported cities. No live search,
  bookings, weather, AI suggestions, or map API is connected.
- The API uses a fixed server-side demo identity. **Real Supabase Auth is not
  implemented.** Repository owner checks are tested but do not replace authentication.
- SQLite replaces the proposed Supabase data adapter for this standalone demo.
  `hermes/repository.py` is the integration boundary; do not represent this as a
  completed Supabase integration or a mobile-native build.
- Trip privacy stores a preference only; share-link generation belongs to UC-12.
- Demo policy: trip name <=80 characters, <=366 inclusive days, <=200 stops.
  These are added limits, not claims about approved Hermes requirements.
- “Clear filters” resets all filters and the search query.
- A 409 version conflict retains the draft; reload explicitly to discard it and
  get the latest version. Concurrent editing does not silently overwrite data.
- After an ambiguous network error during trip creation, check My trips before
  retrying: automatic request deduplication is not implemented.

## Run the tests

```text
python -m unittest discover -s tests -v
```

28 unit/API tests passed in the assistant environment. Full output is in
`evidence/unit_api_tests.txt`. This does not assert that Arshiya personally ran them.
Run them yourself, review the code, and record your own execution before submission.

Optional UI checks (not executed successfully here due to Chromium environment
restrictions):

```text
python -m pip install playwright
python -m playwright install chromium
python tests/ui_browser.py
```

For an existing Chromium installation, set `HERMES_CHROMIUM` to its executable
path. The UI test script uses a temporary database and removes temporary
screenshots on completion. Its dependency is optional and is not needed by the app.
See `docs/test_cases.json` for all test cases, including Not Run cases.

## Files and how they work

- `server.py`: starts the local server.
- `hermes/api.py`: maps JSON requests to services and returns explicit errors.
- `hermes/catalog.py`: validates filters and searches the synthetic catalog.
- `hermes/models.py`: Place, Trip and ItineraryItem value objects.
- `hermes/services.py`: validates trip fields and itinerary data.
- `hermes/repository.py`: SQLite schema, owner checks, transactions and version checks.
- `web/`: responsive HTML, CSS and JavaScript interface.
- `tests/test_features.py`: executable unit, persistence and API tests.
- `tests/ui_browser.py`: optional browser test plan.
- `docs/`: report, personal slides, diagrams, test cases and traceability.
- `evidence/`: actual automated test output and execution details.

## Team handoff

This is an individual contribution, not the complete team submission.
Merge the report sections and slides into Assignment 3's shared artifacts.
Confirm the team's implementation language/framework before integrating this
Python reference module. Preserve the API contracts if porting to another stack.
Upload the source to the team's repository and insert the actual accessible code
URL into BOTH the document and presentation. No upload or team message has been sent.
Compare the included class model with the team's actual Phase 2 class diagram,
resolve overlaps with teammates, and address instructor feedback.

## Explain it in your presentation

1. Filter: UI submits criteria. CatalogService validates and combines them with AND.
2. Create: UI collects and reviews input. TripService revalidates on the server.
   Repository saves the trip against the fixed demo identity, then API returns 201.
3. Build itinerary: each item links a Trip and Place with day and position.
   Changes stay in the browser until Save. The server validates them and replaces
   the saved itinerary in one transaction. Any insert failure rolls back all changes.
4. A version number prevents stale tabs from silently overwriting another save.

## AI disclosure

ChatGPT/Codex drafted the code, tests, documentation and class model. The assistant
executed the included unit/API suite and JavaScript syntax check. It added date and
filter validation, transaction rollback, ownership checks and stale-version handling.

