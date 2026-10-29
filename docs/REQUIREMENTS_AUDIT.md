# DEV-P05 Requirements Audit

## Scope and evidence rules

This register maps the acceptance criteria supplied for DEV-P05 — Public
Transit Route Assistant. The official organizer statement was not provided as
a source URL/document in the task, so direct traceability to its canonical
wording remains unverified. Where the application uses the local synthetic
dataset, results are demo-only and not real-world transit advice.

**Status meanings:** PASS = acceptance behavior has been exercised and passed;
PARTIAL = some behavior exists or passes but the full criterion is not
verified; FAIL = an exercised acceptance check failed; BLOCKED = an external
dependency prevents the check; NOT TESTED = no acceptance evidence yet.

Files or endpoints listed in a row identify primary implementation locations,
not proof by themselves. Evidence is based on the actual test/build/API runs
listed below. Requirement statuses are refreshed as iterations add evidence.

## Stable completion weights

Weights total 100 points and are held stable during normal development.

| Category | Requirement weights | Subtotal |
|---|---|---:|
| Passenger | P1 6, P2 7, P3 8, P4 8, P5 5, P6 5, P7 4, P8 5, P9 4, P10 4, P11 4 | 60 |
| Fleet intelligence | F1 3, F2 3, F3 4, F4 3, F5 3, F6 4, F7 3, F8 2 | 25 |
| Integration and quality | I1 2, I2 2, I3 2, I4 2, I5 2, I6 3, I7 2 | 15 |

Weights reflect user-visible and operational importance: schedule-aware
journey planning and feasible transfers receive the largest passenger weights;
comparison, metric, and cross-component integration evidence receive more
weight than optional presentation details.

**Scoring:** PASS = 1.0; PARTIAL = 0.5; FAIL/BLOCKED/NOT TESTED = 0.0.
Verified completion is `sum(weight × status multiplier)` out of 100. This
measures verified requirement coverage, not implementation quantity.

## Passenger module — 60 points

| ID / weight | Expected behavior | Current implementation and primary location | Verification method and evidence | Status | Remaining defect / priority |
|---|---|---|---|---|---|
| P1 / 6 | Plan public-transport journeys within the supplied city network. | Synthetic stop/trip CSVs; `GET /api/stops`, `GET /api/routes`, `POST /api/journeys/search`; passenger page. | API smoke: 15 stops, 4 routes, and a sample `S01`→`S05` query returned an option. | PASS | Network is fictional and limited; keep provenance visible. |
| P2 / 7 | Provide separate fastest and cheapest options when supported by data. | `RoutingService.search`, fastest and cheapest scans; result cards. | Existing cheapest-preference test passes but does not assert minimum cost or distinct alternatives. | PARTIAL | Add test networks with distinct optimal times/fares and missing-fare cases; high. |
| P3 / 8 | Calculate journeys from scheduled departure/arrival times. | Connection scan in `routing_service.py`; trip stop-times CSV. | Direct and transfer tests pass; live sample journey returned. | PASS | Search has no service-date input, so weekday/weekend filtering is not proven. |
| P4 / 8 | Permit feasible transfers and include required wait. | Two-minute transfer buffer and transfer assembly in `routing_service.py`. | Existing multi-leg transfer test passes. | PARTIAL | Verify exact buffer boundaries, temporal ordering after delays, and reported wait; highest. |
| P5 / 5 | Chat answers use transport data rather than fabricate network facts. | `chat.py`, `chat_service.py`; intent handlers use shared transport/routing data. | API test checks response shape and intent only; no grounded content assertions. | PARTIAL | Add intent/content assertions and unknown-data behavior; medium. |
| P6 / 5 | Journey search reflects and labels simulated delays. | Delay API/service and routing delay parameter. | Delay service and one routing delay test pass; API delay CRUD test passes. | PARTIAL | Verify effective connection ordering, warning/times, and a full UI workflow; high. |
| P7 / 4 | Use available sample occupancy and communicate crowding or missing data honestly. | Occupancy CSV and `_assemble_option` warning logic. | Code inspection only; no focused test or API/browser assertion. | PARTIAL | Test high/low/missing occupancy and make unknown data behavior explicit; medium. |
| P8 / 5 | Create, retrieve/reopen, and delete saved journeys. | SQLite service and `/api/saved-routes` CRUD; `SavedRoutes` UI. | API CRUD test creates, lists, reads, and deletes successfully. | PARTIAL | UI reopen/re-search and persistence across app restart not tested; medium. |
| P9 / 4 | Show the journey/network on Leaflet/OpenStreetMap map. | `TransportMap.tsx`, Leaflet tile layer, route and selected journey layers. | Production build passes; no browser/map tile interaction test. | PARTIAL | Verify rendering, selection highlighting and external tile availability in browser; medium. |
| P10 / 4 | Use GTFS where available or document sample data if not. | Simplified CSV data and `backend/app/data/README.md`. | Dataset docs explicitly state synthetic data and that no GTFS feed is consumed. | PASS | GTFS ingestion remains out of scope until suitable source data is provided. |
| P11 / 4 | Validate inputs and handle missing/unavailable journeys clearly. | Pydantic request validation and route API error/no-route response. | Invalid stop, no-route and same-stop service tests; API invalid/no-route tests pass. | PARTIAL | Time values such as out-of-range HH:MM and malformed input edge cases need validation. |

**Passenger earned points: 39 / 60.**

## Fleet intelligence — 25 points

| ID / weight | Expected behavior | Current implementation and primary location | Verification method and evidence | Status | Remaining defect / priority |
|---|---|---|---|---|---|
| F1 / 3 | Display the simulated fleet state. | `GET /api/fleet/state`, `FleetDashboard`. | API smoke returned 21 buses; fleet endpoint test passes. | PARTIAL | Browser rendering and state consistency not verified; medium. |
| F2 / 3 | Evaluate breakdown and delay scenarios. | `POST /api/fleet/disruption`, `FleetSimulator`. | Existing breakdown and delay service tests pass. | PARTIAL | Validate bad type/bus handling and visible UI flows; medium. |
| F3 / 4 | Compare a no-action baseline with evaluated alternatives. | `evaluate_disruption` baseline and response generation. | Tests assert baseline/responses exist but not metric correctness or comparable states. | PARTIAL | Add deterministic scenario metric comparisons; high. |
| F4 / 3 | Reject interventions that are not feasible. | Response feasibility and approve endpoint guard. | Existing infeasible-response test has a narrow spare-unavailable setup. | PARTIAL | Cover every infeasible action and API approval rejection; high. |
| F5 / 3 | Coordinate multiple buses when the scenario supports it. | Basic spare assignment and same-route short-turn proposal. | Code inspection only; a multi-bus coordinated scenario is not demonstrated. | PARTIAL | Either implement/test a defensible coordination case or explicitly scope it out. |
| F6 / 4 | Calculate before/after metrics from scenario outcomes. | `ScenarioMetrics` and `_calculate_metrics`. | Metrics appear in API output, but formulas and effects are not independently tested. | PARTIAL | Test formulas, state changes, and metric invariants; high. |
| F7 / 3 | Explain recommendations and trade-offs. | Recommendation selection and response explanations/tradeoffs. | Code inspection; no assertions that recommendation follows stated criteria. | PARTIAL | Test recommendation criteria and explanation consistency; medium. |
| F8 / 2 | Approve or reject a proposed response consistently. | `POST /api/fleet/approve`. | No approval/rejection test was present in the baseline suite. | PARTIAL | Add approval, rejection, missing evaluation, and infeasible approval tests; medium. |

**Fleet earned points: 12.5 / 25.**

## Integration and quality — 15 points

| ID / weight | Expected behavior | Current implementation and primary location | Verification method and evidence | Status | Remaining defect / priority |
|---|---|---|---|---|---|
| I1 / 2 | Share a consistent transport model across features. | `TransportData` is loaded at startup and injected into routing/chat APIs. | Architecture/code inspection and successful API startup; cross-feature assertions absent. | PARTIAL | Prove same IDs/data are used in API, route results, chat, and map; medium. |
| I2 / 2 | Handle delays consistently wherever applicable. | Shared passenger `DelayService`; fleet has separate scenario delay values. | Delay API and routing unit tests pass; fleet is an independent simulation. | PARTIAL | Specify and test intended shared-vs-isolated delay semantics; high. |
| I3 / 2 | Keep route info consistent across API, frontend, map, and chat. | Shared API types/data and route result/map components. | API smoke/build only; cross-surface/browser equality not tested. | PARTIAL | Add end-to-end consistency checks; medium. |
| I4 / 2 | Keep fleet state and scenario calculations internally consistent. | Shared `FleetSimulator`, endpoint and dashboard. | State endpoint and service tests pass but detailed state/metric invariants are not proven. | PARTIAL | Add state-transition and result-vs-dashboard tests; high. |
| I5 / 2 | Start reliably with documented setup instructions. | README commands; FastAPI lifespan; Vite development configuration. | Backend launched, health returned OK; frontend type-check/build passed. | PASS | Full frontend dev-server/browser launch remains separately untested. |
| I6 / 3 | Provide regression, integration, and frontend verification. | Pytest backend tests; TypeScript/Vite frontend build. | 49 backend tests pass, build passes; five manual API smoke checks pass. | PARTIAL | Browser/E2E acceptance and coverage measurement remain outstanding. |
| I7 / 2 | Label sample/simulated data and provenance accurately. | README, data README, API `simulated` flags and UI text. | Documentation/code inspection; labels exist and synthetic source documented. | PARTIAL | Verify every user-facing surface, especially crowd and route provenance; medium. |

**Integration/quality earned points: 8.5 / 15.**

## Current verified score

| Category | Earned | Available |
|---|---:|---:|
| Passenger | 39 | 60 |
| Fleet | 12.5 | 25 |
| Integration and quality | 8.5 | 15 |
| **Total** | **60** | **100** |

**Verified requirement completion: 60%.** The estimate does not include
implementation-only claims outside this register. No browser check or test
coverage percentage is included in this score.

## Baseline verification commands and outcome

- Backend: `.\backend\.venv\Scripts\python.exe -m pytest .\backend\tests -q`
  — 49 passed, 0 failed, one deprecation warning.
- Frontend from `frontend`: `npm run build` — TypeScript and Vite build passed.
- Local API smoke: health, stops, routes, one journey query, and fleet state —
  passed.
- Browser workflow — NOT TESTED.

## Next audit actions

1. Add adversarial timetable tests for delayed scan order, distinct fare/time
   optima, transfer boundaries, and valid service-day semantics.
2. Fix routing behavior only where a regression reproduces an actual defect.
3. Add fleet scenario invariant and API approval/rejection tests.
4. Exercise complete browser workflows and refresh statuses based on observed
   results.
5. Retrieve/record the canonical DEV-P05 statement source if available.
