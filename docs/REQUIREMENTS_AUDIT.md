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
| P2 / 7 | Provide separate fastest and cheapest options when supported by data. | `RoutingService.search`, fastest and fare/arrival-label search; result cards. | Synthetic timetable tests verify distinct fastest/cheapest itineraries, minimum fare, and one fare per ride leg. Full real-network validation remains unavailable. | PASS | Validate against organizer-provided data when available. |
| P3 / 8 | Calculate journeys from scheduled departure/arrival times. | Connection scan in `routing_service.py`; trip stop-times CSV. | Direct and transfer tests pass; live sample journey returned. | PASS | Search has no service-date input, so weekday/weekend filtering is not proven. |
| P4 / 8 | Permit feasible transfers and include required wait. | Two-minute transfer buffer and transfer assembly in `routing_service.py`. | Synthetic tests verify a 1-minute connection is missed, a 2-minute buffer is feasible and reported, and a delayed incoming trip selects a later service. | PASS | Validate station-specific transfer times if such data is added. |
| P5 / 5 | Chat answers use transport data rather than fabricate network facts. | `chat.py`, `chat_service.py`; intent handlers use shared transport/routing data. | Browser query “Tell me about route R01” returned the Blue Line and its matching stop sequence; API intent test also passes. | PASS | Keyword/intent-based; requests outside supported patterns may not be understood. |
| P6 / 5 | Journey search reflects and labels simulated delays. | Delay API/service and routing delay parameter. | Browser applied a temporary 15-minute T02 delay; a Rajouri Garden → Rajiv Chowk search changed to 09:21–09:45 and showed the simulated warning. Delay was cleared and empty state confirmed. | PASS | Simulation only; no live delay feed. |
| P7 / 4 | Use available sample occupancy and communicate crowding or missing data honestly. | Occupancy CSV and `_assemble_option` warning logic. | Browser search at a sample high-load boarding stop displayed T02 high load (~70%); API regression covers crowd warning. Missing-data UI behavior has not passed acceptance. | PARTIAL | Surface unknown occupancy when sample data is absent; medium. |
| P8 / 5 | Create, retrieve/reopen, and delete saved journeys. | SQLite service and `/api/saved-routes` CRUD; `SavedRoutes` UI. | Browser created a route, listed it, clicked Search to reopen it, then deleted it and returned to the empty state; API CRUD test also passes. | PASS | Persistence across a full application restart was not tested. |
| P9 / 4 | Show the journey/network on Leaflet/OpenStreetMap map. | `TransportMap.tsx`, Leaflet tile layer, trip-ordered journey stop IDs and selected journey layers. | Browser showed OSM tiles and the selected five-stop T02 path. The path now includes intermediate stops in actual trip order rather than connecting only the endpoints. | PASS | Tile availability depends on the external OSM tile service. |
| P10 / 4 | Use GTFS where available or document sample data if not. | Simplified CSV data and `backend/app/data/README.md`. | Dataset docs explicitly state synthetic data and that no GTFS feed is consumed. | PASS | GTFS ingestion remains out of scope until suitable source data is provided. |
| P11 / 4 | Validate inputs and handle missing/unavailable journeys clearly. | Pydantic request validation and route API error/no-route response. | Tests cover malformed/out-of-range time, unknown stop/preference, same-stop request, no available journey, and fare-unavailable fallback without fabricated fare. | PASS | Add user-facing browser assertions for these states. |

**Passenger earned points: 58 / 60.**

## Fleet intelligence — 25 points

| ID / weight | Expected behavior | Current implementation and primary location | Verification method and evidence | Status | Remaining defect / priority |
|---|---|---|---|---|---|
| F1 / 3 | Display the simulated fleet state. | `GET /api/fleet/state`, `FleetDashboard`. | Browser displayed 21 buses, including 19 active and 2 spares; fleet endpoint test passes. | PASS | All state remains simulated. |
| F2 / 3 | Evaluate breakdown and delay scenarios. | `POST /api/fleet/disruption`, `FleetSimulator`. | Browser exercised breakdown and 15-minute delay scenarios; each showed baseline, response alternatives, and metrics. API/service tests also pass. | PASS | Scenario assumptions are synthetic and simplified. |
| F3 / 4 | Compare a no-action baseline with evaluated alternatives. | `evaluate_disruption` baseline and response generation. | Tests verify repeatable metrics, baseline bus counts, and lower-wait spare response; short-turn metrics reflect the diverted bus assignment. | PASS | Validate metric assumptions with a domain expert before operational use. |
| F4 / 3 | Reject interventions that are not feasible. | Response feasibility and approve endpoint guard. | No-spare scenario marks spare deployment infeasible; API rejects approval for an infeasible response. | PASS | Add further intervention types if the simulator grows. |
| F5 / 3 | Coordinate multiple buses when the scenario supports it. | Spare deployment and same-route short-turn assignment in `FleetSimulator.apply_response`. | API acceptance tests approve both responses and verify affected-bus/spare or diverted-bus trip assignments; resulting active/available bus counts match scenario metrics. | PASS | Coordination is simplified; no positions, reachability, or real dispatch constraints. |
| F6 / 4 | Calculate before/after metrics from scenario outcomes. | `ScenarioMetrics` and `_calculate_metrics`. | Metrics appear in API output, but formulas and effects are not independently tested. | PARTIAL | Test formulas, state changes, and metric invariants; high. |
| F7 / 3 | Explain recommendations and trade-offs. | Recommendation selection and response explanations/tradeoffs. | Test verifies the recommended feasible response improves modeled wait, and has explanation/trade-offs. | PASS | Document fixed assumptions and validate them with a domain expert. |
| F8 / 2 | Approve or reject a proposed response consistently and reflect the decision in simulated state. | `POST /api/fleet/approve`, `FleetSimulator.apply_response`, `FleetDashboard`. | API tests verify deployment, short-turn, and delay state changes; rejection preserves state; repeated decisions return 409. Browser verified rejection keeps 19 active/2 spare and approval changes to 18 active/1 spare with the affected bus and spare visibly updated; a new scenario resets the UI to baseline. | PASS | State is in-memory simulation only and resets to the initial baseline when a new scenario is evaluated. |

**Fleet earned points: 23 / 25.**

## Integration and quality — 15 points

| ID / weight | Expected behavior | Current implementation and primary location | Verification method and evidence | Status | Remaining defect / priority |
|---|---|---|---|---|---|
| I1 / 2 | Share a consistent transport model across features. | `TransportData` is loaded at startup and injected into routing/chat APIs. | Architecture/code inspection and successful API startup; cross-feature assertions absent. | PARTIAL | Prove same IDs/data are used in API, route results, chat, and map; medium. |
| I2 / 2 | Handle delays consistently wherever applicable. | Shared passenger `DelayService`; fleet has separate scenario delay values. | Delay API and routing unit tests pass; fleet is an independent simulation. | PARTIAL | Specify and test intended shared-vs-isolated delay semantics; high. |
| I3 / 2 | Keep route info consistent across API, frontend, map, and chat. | Shared API types/data and route result/map components. | Browser route card, chat response, stop names, and five-stop map path agreed for the R01 journey; map now draws trip-ordered stop IDs. | PASS | Cross-surface evidence currently covers the synthetic R01 journey. |
| I4 / 2 | Keep fleet state and scenario calculations internally consistent. | Shared `FleetSimulator`, state endpoint, and dashboard. | API tests compare resulting active/available counts to response metrics for spare deployment and short-turn; browser confirms decisions update the dashboard and the next scenario returns both to baseline. | PASS | Other metric assumptions remain fixed; see F6. |
| I5 / 2 | Start reliably with documented setup instructions. | README commands; FastAPI lifespan; Vite development configuration. | Backend launched, health returned OK; frontend dev server loaded and browser workflows ran; production build passed. | PASS | Production deployment is outside this local-startup requirement. |
| I6 / 3 | Provide regression, integration, and frontend verification. | Pytest backend/API tests; TypeScript/Vite build; manual browser acceptance. | 70 backend tests pass, production build passes, and browser workflows exercised passenger and fleet features. Coverage percentage is not measured. | PASS | Manual browser runs are not a repeatable automated E2E suite; no coverage percentage. |
| I7 / 2 | Label sample/simulated data and provenance accurately. | README, data README, API `simulated` flags and UI text. | Documentation/code inspection; labels exist and synthetic source documented. | PARTIAL | Verify every user-facing surface, especially crowd and route provenance; medium. |

**Integration/quality earned points: 12 / 15.**

## Current verified score

| Category | Earned | Available |
|---|---:|---:|
| Passenger | 58 | 60 |
| Fleet | 23 | 25 |
| Integration and quality | 12 | 15 |
| **Total** | **93** | **100** |

**Verified requirement completion: 93%.** The previous summary table
incorrectly listed 49 passenger points; the row weights sum to 51 at the
previous 78% score. This iteration adds browser evidence and direction-aware
map path support and verified fleet decision state changes. P7 remains PARTIAL
because the UI does not explicitly identify missing occupancy; F6 remains
PARTIAL because some scenario metrics use fixed assumptions. No
implementation-only claims outside this register earn points.

## Baseline verification commands and outcome

- Backend: `.\backend\.venv\Scripts\python.exe -m pytest .\backend\tests -q`
  — 74 passed, 0 failed, one deprecation warning.
- Frontend from `frontend`: `npm run build` — TypeScript and Vite build passed.
- Local API smoke: health, stops, routes, one journey query, and fleet state —
  passed.
- Browser workflows: passenger route, map path and tiles, crowding, delay,
  chat, saved route create/reopen/delete, fleet dashboard, breakdown/delay
  alternatives, and decision acknowledgements — passed manually.
- Fleet state transition: approved spare deployment/short-turn/delay changed
  the modeled state; rejection did not; the browser dashboard reflected the
  state — passed.

## Next audit actions

1. Validate fleet metric inputs and formulas with invariants; distinguish
   fixed assumptions from calculated outcomes.
2. Show an explicit unknown-occupancy status when sample occupancy is absent.
3. Verify service-day and midnight routing semantics.
4. Retrieve/record the canonical DEV-P05 statement source if available.
