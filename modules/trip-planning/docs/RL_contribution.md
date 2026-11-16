# Reynard Landreneau — UC-06 View Destination/Lodging and UC-07 View Weather

Paste-ready material for the Group 04 Assignment 4 document. Items in [brackets] still need your input.

## 1. What I implemented

| Use case | Requirements (from team table; confirm against baseline) | Code |
|---|---|---|
| UC-06 View Destination/Lodging | FR-11–13 | `hermes/details.py`, `GET /api/places/{id}`, details page in `web/details_weather.js` |
| UC-07 View Weather | FR-22/23 | `hermes/weather.py`, `GET /api/weather`, Weather page in `web/details_weather.js` |

Shared files touched (small additive edits): `hermes/api.py` (2 routes, 1 error handler, 1 optional `weather_provider` argument, 1 static file entry), `web/app.js` (3 hooks), `web/index.html` (Weather nav, 2 sections, 2 buttons), `web/style.css` (appended block).

Behavior: a **View details** button on each search card opens description, price, rating, hours or check-in times, address, amenities and a provider link. **Weather** (nav, the details page, or the itinerary page) shows a daily forecast. Weather failure shows an error and never a made-up forecast.

Demo limits (say these in the document): all place data and forecasts are synthetic; provider links point at example.com; weather is limited to 16 days per request (demo policy, not an approved requirement); multi-city trips open weather for the first destination and the user can switch city.

## 2. Test cases (creator: Reynard Landreneau, AI-assisted)

Fixture: fresh server, 8-place catalog. Executor/environment for the Status column: assistant run, Python 3.12.3, Linux, 2026-11-15. **Personal rerun: Python 3.15.2, Windows, 2026-11-15.**

| ID | UC | Purpose | Preconditions / data | Steps | Expected | Status |
|---|---|---|---|---|---|---|
| RL-TC01 | UC-06 | Lodging details | Place id 1 | `get(1)` | Lakeside House, Austin, lodging; "$145 / night"; amenities wifi, parking; "Check-in 3:00 PM · Check-out 11:00 AM"; provider Sample Stays with `https://example.com/stays/lakeside-house` | Pass |
| RL-TC02 | UC-07 | Forecast for trip dates | Austin, 2026-11-20 to 2026-11-22 | Request forecast | 3 days dated 11-20, 11-21, 11-22; each has high, low, condition, precip chance; low ≤ high; unit F | Pass |
| RL-TC03 | UC-06 | Destination details | Ids 3 and 4 | `get(3)`, `get(4)` | "Free" with "Open daily · 5:00 AM–10:00 PM"; id 4 "$28 estimated" | Pass |
| RL-TC04 | UC-06 | Unknown place | ids 999, 0, -1, "1", None, True, 1.0 | `get` each | "Destination or lodging not found." | Pass |
| RL-TC05 | UC-06 | API bad id | `/api/places/999`, `/abc`, `/-1`, `/` | GET each | 404; 999 returns "Destination or lodging not found." | Pass |
| RL-TC06 | UC-06 | Catalog consistency | all 8 places | compare to catalog | id, name, price, rating equal catalog; https provider link | Pass |
| RL-TC07 | UC-07 | Bad location | "Paris", "", missing | forecast | "Choose a supported location." | Pass |
| RL-TC08 | UC-07 | Reversed dates | start 2026-11-22, end 2026-11-20 | forecast | "End date must be on or after start date." | Pass |
| RL-TC09 | UC-07 | Invalid dates | 2026-02-30, "tomorrow", missing, "" | forecast | "Enter valid dates in YYYY-MM-DD format." | Pass |
| RL-TC10 | UC-07 | Range limit | 16 days, then 17 days | forecast | 16 returns 16 days; 17 rejected: "Weather can be shown for at most 16 days at a time." | Pass |
| RL-TC11 | UC-07 | One-day range | 2026-11-20 both | forecast | exactly 1 day | Pass |
| RL-TC12 | UC-07 | Provider outage | provider raises timeout, connection error, runtime error, or returns [] | forecast | `WeatherUnavailable`: "Weather is temporarily unavailable. Please retry."; no forecast data | Pass |
| RL-TC13 | UC-07 | Stable sample data | same request twice | compare | identical output | Pass |
| RL-TC14 | UC-06 | API details success | `/api/places/1` | GET | 200, Lakeside House, provider URL as above | Pass |
| RL-TC15 | UC-07 | API weather | valid request; reversed dates; no params | GET | 200 with 3 days; 400 "End date must be on or after start date."; 400 | Pass |
| RL-TC16 | UC-07 | No wasted provider call | location "Paris" | forecast with mock provider | validation error; provider never called | Pass |
| RL-TC17 | UC-07 | API outage | provider times out | GET weather | 503 with exactly `{"error": "Weather is temporarily unavailable. Please retry."}` | Pass |
| RL-UI01 | UC-06 | Open details from search | browser at localhost:8000 | Search "Lakeside"; click View details | page shows all fields; listing link opens in a new tab; Back returns to results | **Not Run** |
| RL-UI02 | UC-07 | Weather from details | on details for id 1 | click "See weather in Austin"; pick 2026-11-20 to 2026-11-22; Show forecast | 3 day cards with °F and % precipitation | **Not Run** |
| RL-UI03 | UC-07 | Weather error display | stop provider / invalid range 2026-11-22 to 2026-11-20 | submit | red message, no cards | **Not Run** |

Executed-by-me tests for the grading requirement: **RL-TC01 and RL-TC02**. Evidence: `evidence/rl_test_results.txt`.

**Failures:** none in the assistant run. **Mutation check:** I deliberately broke the range limit, the outage handling and the "Free" label; tests failed each time, then I restored the code. **Remaining:** browser UI tests, real weather/lodging providers, Supabase integration, accessibility audit.

In Reynard's run: all normal test cases passed.

## 3. RTM rows

| Requirement | UC / scope | Test IDs | Coverage |
|---|---|---|---|
| FR-11–13 | UC-06 | RL-TC01, 03–06, 14, RL-UI01 | API/unit Pass; UI Not Run |
| FR-22/23 | UC-07 | RL-TC02, 07–13, 15–17, RL-UI02–03 | API/unit Pass; UI Not Run |
| NFR-07 (local part only) | Weather provider failure | RL-TC12, RL-TC17; SYS-NF03 | Local error handling Pass; real provider Not Run |

Replace the "Planned / Not Run" rows for `FR-11–13, 22/23` in the team RTM with these.

## 4. Class diagram additions (for the Phase 2 comparison)

Added: `PlaceDetailService` (get(placeId)), `WeatherService` (forecast(params)), `WeatherProvider` interface implemented by `SampleWeatherProvider` (forecast(location, start, end)), and a `DailyForecast` value (date, highF, lowF, condition, precipChance). `PlaceDetailService` reads `Place`; `WeatherService` uses a provider and is independent of `Trip`. Reason: provider adapter lets a live weather service replace the sample one without touching validation or the UI.

## 5. Contribution and AI use row

Code: `hermes/details.py`, `hermes/weather.py`, `web/details_weather.js`, `tests/test_details_weather.py`, the small hooks listed above. AI: Claude (Anthropic) drafted the code and tests. Example prompt: "Add UC-06 View Destination/Lodging and UC-07 View Weather to this module, following its existing service/API/test structure, with no live providers." Verification: ran all 45 tests, mutation-checked three behaviors, ran the server and exercised every endpoint, `node --check` on both JS files, checked that all element IDs exist.

## 6. Planned teammate rows to replace in section 7 of the team document

RL-TC01 and RL-TC02 above replace the bracketed placeholders.
