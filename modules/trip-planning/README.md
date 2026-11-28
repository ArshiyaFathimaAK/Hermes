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


---

# Spenser's Assignment 4 contribution: UC-11 and UC-12

Prepared for Spenser Saunders with Claude (Anthropic) assistance. Builds on Arshiya's
module above and follows the same layers: `web/` → `api.py` → service → `repository.py` → SQLite.

## What it adds

- **UC-11 View Estimated Trip Cost (FR-27).** The itinerary screen shows an estimated
  total, lodging vs. activities, and a subtotal for each day that has stops.
- **UC-12 Share Trip (FR-28, FR-29).** The itinerary screen has a **Create share link**
  button. Anyone opening `http://127.0.0.1:8000/?share=<token>` sees that one trip, read-only.

## Rules chosen for the demo

- Estimate = sum of the catalog price of every stop in the **saved** itinerary. A lodging
  placed on a day counts as one night. Free places count as $0. Unsaved edits are not
  included; the panel says so until you save.
- One share link per trip; asking again returns the same link. Creating a link sets the
  trip's privacy to `link`. Only the owner can create it (NFR-04).
- Tokens come from `secrets.token_urlsafe(16)` (128 random bits). The shared view returns
  only the trip name, cities, dates and stops: no owner ID, trip ID or other trips (FR-29).
- Unknown and malformed links both get "This share link is not valid."
- No way to turn a link off yet (not required by FR-28/FR-29).

## Files

| File | Change |
| --- | --- |
| `hermes/cost.py` | New. `CostService.estimate(user_id, trip_id)` |
| `hermes/sharing.py` | New. `ShareService.create_link(...)`, `ShareService.view(token)` |
| `hermes/repository.py` | Added `share_links` table, `get_or_create_share_token`, `get_shared` |
| `hermes/api.py` | Added `GET /api/trips/<id>/cost`, `POST /api/trips/<id>/share`, `GET /api/shared/<token>` |
| `web/index.html`, `web/app.js`, `web/style.css` | Cost panel, Share panel, read-only shared view (marked "Spenser") |
| `tests/test_cost_share.py` | New. 16 unit and API tests |
| `tests/ui_cost_share.py` | New. 7 browser checks with screenshots (optional, needs Playwright) |
| `docs/test_cases.json`, `docs/rtm.json` | Added TC-UC11-*, TC-UC12-*, UI-UC11/12-* and RTM rows for FR-27, FR-28, FR-29, NFR-04, NFR-08 |
| `docs/design_classes.*` | Added CostService, ShareService, ShareLink (blue) |
| `evidence/spenser_*` | Test output, browser results and screenshots |

## Run the tests

```text
python -m unittest tests.test_cost_share -v      # the 16 new tests
python -m unittest discover -s tests -v          # everything: 61 tests
python tests/ui_cost_share.py                    # optional browser checks
```

All 61 unit/API tests (Arshiya 28, Reynard 17, Spenser 16) and all 7 browser checks passed
in the assistant environment on 2026-11-15, after rebasing onto Reynard's UC-06/UC-07 commit (`evidence/spenser_*`). That run does not count as the student's own run:
rerun them on your computer and record the results before submission.

## AI use (Assignment 4 disclosure, draft for Spenser to edit)

- **Tool:** Claude (Anthropic), in a claude.ai session with the course slides, the SE
  document, and this repository.
- **Example prompts:** "What will the process be to create those 2 UC's in this code base
  as an agent?" · "Begin building, ask questions as needed."
- **What the assistant did:** proposed the cost and sharing rules, wrote the services,
  routes, UI and tests, and ran the full suite and a browser click-through.
- **How it was checked:** the new tests follow Ch13.2 (equivalence classes and boundaries
  for cost; a decision table for sharing); Arshiya's 28 tests were rerun to catch
  regressions; the screens were checked with screenshots.
- **Still to do by Spenser:** [ ] read the diff · [ ] run the tests locally and record
  results · [ ] confirm the cost rule with the team · [ ] agree the merge with Arshiya.
