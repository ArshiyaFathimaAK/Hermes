# Sharad Rangaraju — UC-03 Manage User Profile and UC-04 Search for Destination

Author: Sharad Rangaraju (AI-assisted draft; author review pending).
Purpose: contribution, traceability and assistant-run evidence for Group 04 Assignment 4.
This document does not claim that Sharad personally ran or reviewed anything.

## 1. What I implemented

| Use case | Requirements | Code and endpoints |
|---|---|---|
| UC-03 Manage User Profile | FR-06 | `hermes/profile.py`, `GET /api/profile`, `PUT /api/profile`, Profile view in `web/profile_search.js` |
| UC-04 Search for Destination | FR-07, FR-08 | `hermes/search.py`, `GET /api/search?q=...`, header form and results view in `web/profile_search.js` |

Shared files touched, each with a Sharad contribution marker:

| File | Additive edit |
|---|---|
| `hermes/api.py` | Profile/search imports, services, routes and static-module/content-type entries; reuse existing exception handling |
| `web/app.js` | Profile/search views, profile-open hook, shared helpers through `window.hermes` |
| `web/details_weather.js` | Expose the existing `openDetails` through `window.hermes`; one line |
| `web/index.html` | Profile nav and form, always-visible header search, results view, footer credit and module script |
| `web/style.css` | One appended block for header wrapping, visible search labels and profile fieldset |
| `docs/test_cases.json` | Append Sharad's 18 automated and five browser cases, using the existing row shape; `creator` marks authorship because JSON cannot contain comments |
| `docs/rtm.json` | Append three FR rows; `scope` starts with `Sharad:` as the JSON contribution marker |

UC-03 flow: Profile loads the fixed demo account's saved values, or empty fields at version 0. Save sends the edited text and version. The service validates and trims; the repository saves in one SQLite transaction and increments the version. Success displays `Profile saved.` Invalid input and 409 conflicts leave the form unchanged. Returning to Profile keeps the draft; **Reload saved profile** explicitly discards it after confirmation when edited. Fields are disabled while loading/saving so an in-flight response cannot replace newly entered text.

UC-04 flow: the header form is outside all views and remains visible everywhere. Search splits the trimmed query into lowercase words. Every word must occur in the name, location, category or shared description. Scores add 3/2/1/1 per matching field and word, then sort by descending score, descending rating and name. Cards show the first 90 description characters and open Reynard's existing details page; Back returns to search. Request counters ignore superseded responses; dynamic card values use the shared escape helper. Arshiya's UC-05 catalog filters and endpoint retain their existing behavior.

## 2. Test cases (creator: Sharad Rangaraju, AI-assisted)

Executor: **assistant run**, Linux, Python 3.14.10, 2026-11-15 (America/Chicago).
Every new Python test uses a fresh temporary database; API tests start a real server on a free localhost port. Exact assertions cover all messages below. The initial restricted-sandbox attempt could not open localhost sockets; the complete rerun with socket access passed **79/79 tests: 61 existing + 18 new; 0 failures, 0 errors**. Full output is in `evidence/sr_test_results.txt`.

Five additional browser checks used installed headless Chromium with the Chrome DevTools Protocol, Node standard libraries, a temporary server and temporary database. The temporary harness was `/tmp/hermes-profile-search-ui.mjs`; it is not part of the application or staging list. Browser rows describe the concrete manual steps for a personal rerun. No package installation or application dependency was added. JavaScript syntax checks passed, as did the existing five auth validation tests (`node tests/auth_validation.test.js`). These checks do not establish a full accessibility audit or production performance.

Personal rerun: **[Sharad: date, OS, Python/browser version, results and evidence].**

| ID | UC | Purpose | Preconditions | Input data | Steps | Expected result (exact messages) | Actual result | Status | Creator |
|---|---|---|---|---|---|---|---|---|---|
| SR-TC01 | UC-03 | Trim and persist a valid profile | Fresh temporary SQLite database; fixed demo identity | Sharad Rangaraju / sharad@example.com / 972-555-0100 / version 0; spaces around all text fields; address = Sample address | Save with ProfileService; read using a NEW ProfileRepository instance. | Trimmed name Sharad Rangaraju, email sharad@example.com, phone 972-555-0100, address Sample address; version 1. | Trimmed name Sharad Rangaraju, email sharad@example.com, phone 972-555-0100, address Sample address; version 1. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC02 | UC-04 | Rank Austin lodging | Fresh temporary SQLite database; fixed demo identity; shared eight-place sample catalog | q="  AuStIn lodging  " | Search; inspect ordered IDs. | IDs [1, 2]: Lakeside House, then The Congress Stay. | IDs [1, 2]: Lakeside House, then The Congress Stay. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC03 | UC-03 | Reject invalid email formats and types | Fresh temporary SQLite database; fixed demo identity | Otherwise valid profile; emails sharad, a@b, empty, a@@b.com, a@b..com, a b@example.com, null, 12 | Attempt each save; inspect the exact exception and stored version. | Enter a valid email address. Version stays 0. | Enter a valid email address. Version stays 0. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC04 | UC-03 | Reject blank or long names | Fresh temporary SQLite database; fixed demo identity | Otherwise valid profile; name = space, 61 a characters, null, 12 | Attempt each save; inspect the exact exception and stored version. | Enter your name (1-60 characters). Version stays 0. | Enter your name (1-60 characters). Version stays 0. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC05 | UC-03 | Reject unsupported fields | Fresh temporary SQLite database; fixed demo identity | Sharad Rangaraju / sharad@example.com / 972-555-0100 / version 0; role=admin | Save; inspect exact exception and stored version. | Unsupported profile field: role. Version stays 0. | Unsupported profile field: role. Version stays 0. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC06 | UC-03 | Reject stale HTTP save | Real localhost server on a free port; fresh temporary database | Sharad Rangaraju / sharad@example.com / 972-555-0100 / version 0; first save succeeds, second uses display_name=Stale and version 0 | PUT valid; PUT stale; GET profile. | 200, then 409 with Your profile changed. Reload before saving again. Saved profile is unchanged at version 1. | 200, then 409 with Your profile changed. Reload before saving again. Saved profile is unchanged at version 1. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC07 | UC-04 | Match a description-only word | Fresh temporary SQLite database; fixed demo identity; shared catalog and descriptions | q=rooftop | Search; compare the entire preview. | Only id 2, The Congress Stay, Austin, lodging, rating 4.6, price 169; snippet: Boutique hotel near downtown with a rooftop pool and breakfast bar. | Only id 2, The Congress Stay, Austin, lodging, rating 4.6, price 169; snippet: Boutique hotel near downtown with a rooftop pool and breakfast bar. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC08 | UC-04 | Return an explicit empty state | Real localhost server on a free port; fresh temporary database | GET /api/search?q=zzzz | Send GET; compare the entire response. | 200; results []; message No results found. Try a different search term.; sample_data true. | 200; results []; message No results found. Try a different search term.; sample_data true. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC09 | UC-04 | Validate empty and oversized queries | Real localhost server on a free port; fresh temporary database | q = empty, three spaces, 81 a characters, and missing q | GET /api/search for each case. | 400 with Enter a search term. for empty, spaces or missing q; 400 with Search terms must be 80 characters or fewer. for 81 characters. | 400 with Enter a search term. for empty, spaces or missing q; 400 with Search terms must be 80 characters or fewer. for 81 characters. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC10 | UC-03 | Profile HTTP round trip | Real localhost server on a free port; fresh temporary database | Sharad Rangaraju / sharad@example.com / 972-555-0100 / version 0; then email=sharad at version 1 | GET; PUT valid; PUT invalid; GET again. | GET 200 with blank profile and version 0; PUT 200 with Profile saved. and version 1; invalid PUT 400 with Enter a valid email address.; stored profile unchanged. | GET 200 with blank profile and version 0; PUT 200 with Profile saved. and version 1; invalid PUT 400 with Enter a valid email address.; stored profile unchanged. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC11 | UC-03 | Phone, name and address boundaries | Fresh temporary SQLite database; fixed demo identity | Phone 6/7/20/21 chars, +1 (972) 555-0100, empty, dots, null, number; address 120/121 chars, null, array; trimmed name 60 chars | Try invalid fields, then save four valid boundary profiles at consecutive versions. | Invalid phone: Enter a valid phone number. Invalid address: Address must be 120 characters or fewer. Valid boundaries save trimmed at versions 1-4. | Invalid phone: Enter a valid phone number. Invalid address: Address must be 120 characters or fewer. Valid boundaries save trimmed at versions 1-4. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC12 | UC-03 | Reject malformed bodies and versions | Fresh temporary SQLite database; fixed demo identity | Body [], null, string; version null, true, -1, "0", 0.0, missing | Attempt each save; compare exact message; check version remains 0. | Body error: Send a JSON object. Version error: Send the current profile version. | Body error: Send a JSON object. Version error: Send the current profile version. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC13 | UC-03 | Blank defaults and user isolation | Fresh temporary SQLite database; fixed demo identity | Sharad Rangaraju / sharad@example.com / 972-555-0100 / version 0; second user other-user / Other / other@example.com (optional fields omitted) | Read absent profiles; save each user; reread original user. | Absent profile has empty text fields and version 0. Optional fields default to empty; separate users save at version 1 without changing the other profile. | Absent profile has empty text fields and version 0. Optional fields default to empty; separate users save at version 1 without changing the other profile. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC14 | UC-04 | Weighted scores, rating ties and all-word matching | Fresh temporary SQLite database; fixed demo identity; shared sample data | q = walk; Austin rooftop lodging; Dallas rooftop; 80 x; SQL-like text | Search each query; compare ordered IDs or empty results. | walk IDs [5, 3, 7, 1]; Austin rooftop lodging [2]; other queries []. 80 characters accepted. | walk IDs [5, 3, 7, 1]; Austin rooftop lodging [2]; other queries []. 80 characters accepted. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC15 | UC-03 | Atomic first save and stale update | Fresh temporary SQLite database; fixed demo identity | Two simultaneous saves at version 0; then Updated at version 1; then Stale at version 1 | Synchronize two threads; save; update; attempt stale update; reread. | One version-1 success and one Your profile changed. Reload before saving again. Updated profile reaches version 2; stale update conflicts and leaves it unchanged. | One version-1 success and one Your profile changed. Reload before saving again. Updated profile reaches version 2; stale update conflicts and leaves it unchanged. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC16 | UC-03 | Rollback and shared-database compatibility | Fresh temporary SQLite database; fixed demo identity | Sharad Rangaraju / sharad@example.com / 972-555-0100 / version 0; TripRepository in same DB; trigger aborts profile UPDATE | Save profile; install trigger; update at version 1; reread profile and list trips. | IntegrityError rolls back the update; original profile and version 1 persist; trip list remains []. | IntegrityError rolls back the update; original profile and version 1 persist; trip list remains []. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-TC17 | UC-04 | Search API contract and front-end static route | Real localhost server on a free port; fresh temporary database | q="  austin lodging  "; GET /profile_search.js | GET search; inspect ordered IDs, message and preview keys; GET static module. | 200; IDs [1, 2]; message 2 results for "austin lodging".; sample_data true; exact preview keys id/name/location/category/rating/price/snippet; module 200 text/javascript with author header. | 200; IDs [1, 2]; message 2 results for "austin lodging".; sample_data true; exact preview keys id/name/location/category/rating/price/snippet; module 200 text/javascript with author header. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-NF01 | UC-04 | Local search performance | Fresh temporary SQLite database; fixed demo identity; eight synthetic records, one process, no network | 100 searches for austin lodging | Measure the loop with perf_counter; divide elapsed milliseconds by 100; check every result. | IDs [1, 2] every time; average under 50 ms locally. | 100 correct searches; average 0.027 ms (assistant run), below 50 ms; Pass. Not a production benchmark. | Pass | Sharad Rangaraju |
| SR-UI01 | UC-03 | Profile editing and validation | Blank demo profile | Sharad Rangaraju / sharad@example.com / 972-555-0100, with spaces; then email sharad | Open Profile; save; enter invalid email; save; visit Explore and return. | Profile saved.; trimmed values; Enter a valid email address.; invalid input remains after error and navigation. | Profile saved.; trimmed values; Enter a valid email address.; invalid input remains after error and navigation. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-UI02 | UC-03 | Conflict and explicit reload | Browser has profile version 1 | External PUT: Other tab / other@example.com / version 1; browser saves original name | Save externally; save browser draft; reload and confirm discard. | Your profile changed. Reload before saving again.; draft remains; explicit reload shows Other tab. | Your profile changed. Reload before saving again.; draft remains; explicit reload shows Other tab. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-UI03 | UC-04 | Search previews and shared details page | Browser with sample catalog | austin lodging; rooftop | Search; inspect order; View details on Lakeside House; Back; search rooftop. | Lakeside House then The Congress Stay; message 2 results for "austin lodging".; details show Lakeside House; Back returns to search; rooftop shows only The Congress Stay. | Lakeside House then The Congress Stay; message 2 results for "austin lodging".; details show Lakeside House; Back returns to search; rooftop shows only The Congress Stay. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-UI04 | UC-04 | Empty and invalid search states | Browser with previous search cards | zzzz; three spaces | Submit each query using the header form. | No results found. Try a different search term.; then Enter a search term.; both show zero cards. | No results found. Try a different search term.; then Enter a search term.; both show zero cards. Assertions passed (assistant run). | Pass | Sharad Rangaraju |
| SR-UI05 | UC-04 | Header available on all views and mobile layout | Installed headless Chromium; localhost server; temporary DB | All nine views; viewport 390x844 for Explore/Create/My trips/Weather/Profile/Search | Navigate each view; check header visibility; inspect mobile overflow and JavaScript exceptions. | Header search visible on all nine views; six checked mobile pages have no horizontal overflow; no JavaScript exceptions. | Header search visible on all nine views; six checked mobile pages have no horizontal overflow; no JavaScript exceptions. Assertions passed (assistant run). | Pass | Sharad Rangaraju |

**Failures:** none in the successful assistant run. **SR-NF01:** 100 local searches averaged **0.027 ms/search**, below 50 ms, including result assertions. Only eight synthetic catalog records and one process were measured. Author review and a personal rerun remain pending.

## 3. RTM rows

| Requirement | UC / scope | Test IDs | Coverage |
|---|---|---|---|
| FR-06 | UC-03 profile | SR-TC01, SR-TC03-06, SR-TC10; extra SR-TC11-13, SR-TC15-16, SR-UI01-02 | Assistant persistence/validation/API/UI Pass; real Auth pending |
| FR-07 | UC-04 ranked search | SR-TC02, SR-TC07-09, SR-NF01; extra SR-TC14, SR-TC17, SR-UI03-04 | Assistant search/API/UI Pass; sample catalog only |
| FR-08 | UC-04 search from every view | SR-TC02, SR-TC07-09, SR-NF01, SR-UI03-05 | Search behavior Pass; browser header visible in all nine views; six mobile pages checked |

The Python service/API cases support search behavior; SR-UI05 is the direct evidence for always-visible header search. Corresponding rows are appended to `docs/rtm.json` without replacing teammates' rows.

## 4. Class additions and demo limits

`Profile` is a dataclass with user_id, display_name, email, phone, address and version. `ProfileService` validates and calls `ProfileRepository`; the repository creates only its own `profiles` table in the same SQLite database. `SearchService` reads `catalog.PLACES` and `PlaceDetailService.get`; it owns no catalog or description records. Existing class diagrams are unchanged.

Catalog, descriptions, prices, addresses and provider links remain synthetic samples. The profile is attached to the fixed server-side `DEMO_USER` (`demo-arshiya`); **real Supabase Auth is not implemented**. SQLite stands in for Supabase. Editing profile email does not create or change login credentials. No live provider, booking, account security or Supabase integration is claimed.

Conventions clarified against `prompt.md`: name/phone/address lengths are checked after trimming, as requested. Missing optional fields save as empty strings. Version is transport metadata allowed alongside the four editable fields; missing, negative, boolean or non-integer versions return `Send the current profile version.` Non-object bodies reuse `Send a JSON object.` Other unknown fields are rejected. File headers say **author review pending**, because no personal review may be claimed. This checkout's `.gitignore` does **not** currently ignore `evidence/`; the requested explicit `git add -f` still works and is retained below. No teammate behavior needed to change.

## 5. Contribution and AI use row

- **Tool:** OpenAI Codex assistant.
- **Prompt:** repository `prompt.md` plus “Implement what is the prompt.md”.
- **Assistant work:** read the existing services/UI/tests; drafted the additions, tests, docs and evidence; ran regression, JavaScript and browser checks; fetched origin for a read-only comparison. No commit, merge, branch, push or PR was performed.
- **Sharad's review / changes:** [Fill in the lines you reviewed, explanations and changes you made.]
- **Personal execution:** [Fill in commands, date, environment, pass counts and evidence after rerunning.]
- **AI-use wording required by the course:** [Confirm the course policy and add the required disclosure.]

## 6. Presentation and teammate handoff

UC-03: “The profile form loads the demo user's information. The server validates and trims the fields, then stores them in SQLite. Each save increases a version number so an old tab cannot overwrite a newer save. Errors keep the input available to correct or reload.”

UC-04: “The header search works from every page. It searches our teammates' shared place names, locations, categories and descriptions, requiring every word to match. It ranks the previews by relevance and rating. View details opens our existing details page.”

The minimum requested cases are SR-TC01 and SR-TC02; all requested cases and seven extra functional cases passed in the assistant run. Sharad must review and rerun them personally before claiming personal execution.

## 7. Git review and commands for Sharad to run

The assistant ran only permitted read-only git checks and the explicitly requested `git fetch origin`. After fetch, `git log HEAD..origin/main --oneline`, the reverse log and `git diff HEAD origin/main --stat` were empty: local main and origin/main agree. **No upstream commits or conflicts were found at check time.** Working files were not merged or staged. If teammates push later, a new check is needed.

Created files (relative to `modules/trip-planning/`):

- `hermes/profile.py`
- `hermes/search.py`
- `web/profile_search.js`
- `tests/test_profile_search.py`
- `docs/SR_contribution.md`
- `evidence/sr_test_results.txt`

Changed files:

- `hermes/api.py`
- `web/app.js`
- `web/details_weather.js`
- `web/index.html`
- `web/style.css`
- `docs/test_cases.json`
- `docs/rtm.json`

The explicit staging command below is the exact file list. Leave `prompt.md` untracked and omit databases, caches and temporary files. Review before running. If pull reports overlapping local edits, stop and inspect them; do not discard the working changes. `--ff-only` prevents an automatic merge commit.

Ready-to-paste commit message:

```text
Add UC-03 Manage Profile and UC-04 Search (Sharad Rangaraju)

- Add profile and ranked search services plus profile_search.js.
- Add marked API, navigation, details hook, header, CSS and docs edits.
- Add 18 tests; all 79 Python tests pass, including 61 existing tests.
- Record assistant-run evidence and five browser flow checks.
```

The assistant prepared `/tmp/hermes-sr-commit-message.txt` with that exact message for this session. If that temporary file is gone, create a message file with the text above and adjust the `-F` path.

Commands to run yourself, in order (none executed by the assistant):

```sh
cd /home/srang/Documents/Hermes
git pull --ff-only origin main
git add \
  modules/trip-planning/hermes/profile.py \
  modules/trip-planning/hermes/search.py \
  modules/trip-planning/web/profile_search.js \
  modules/trip-planning/tests/test_profile_search.py \
  modules/trip-planning/docs/SR_contribution.md \
  modules/trip-planning/hermes/api.py \
  modules/trip-planning/web/app.js \
  modules/trip-planning/web/details_weather.js \
  modules/trip-planning/web/index.html \
  modules/trip-planning/web/style.css \
  modules/trip-planning/docs/test_cases.json \
  modules/trip-planning/docs/rtm.json
git add -f modules/trip-planning/evidence/sr_test_results.txt
git commit -F /tmp/hermes-sr-commit-message.txt
git push origin main
```
