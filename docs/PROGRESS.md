# Aaroh-Saarthi Development Progress

## Current status

**Iterative acceptance work is in progress.** Passenger search, chat, saved
routes, crowding, simulated delay, and Leaflet/OpenStreetMap map behavior have
been exercised in a browser. Fleet breakdown and delay scenarios, baseline
comparisons, and decisions have also been exercised. Approval now applies the
selected response to the in-memory simulated fleet, and rejection leaves it
unchanged. Remaining work includes explicit unknown occupancy communication
and validation of fixed fleet metric assumptions.

| Measure | Current value | Meaning |
|---|---:|---|
| Verified requirement completion | **93%** | Weighted P/F/I register; only PASS earns full points and PARTIAL earns half |
| Implementation estimate | **About 82%** | Coarse engineering estimate; not acceptance evidence or the weighted score |
| Backend test execution | **74 passed, 0 failed** | Full suite after fleet decision state transitions and scenario reset checks |
| Frontend type-check/build | **Passed** | `npm run build` ran `tsc -b` and Vite production build |
| API smoke checks | **5 baseline checks passed** | Health, stops, routes, sample journey search, and fleet state |
| Browser workflow | **Manual acceptance checks passed** | Passenger and fleet workflows exercised; approval updates simulated state and rejection leaves it unchanged |
| Coverage percentage | **Not measured** | No coverage-instrumented test run was performed |

The implementation estimate is a coarse scope estimate, not the weighted
completion score. The verified score is calculated in
[REQUIREMENTS_AUDIT.md](./REQUIREMENTS_AUDIT.md).

## Repository and delivery state

- Repository: `https://github.com/rajmaheshwari3001-dev/Codex-Test-Model`
- Branch: `main`
- Baseline local and remote commit: `0e28bca`; progress ledger delivery: `b62c51b`.
- Latest completed iteration: **3 — apply fleet decisions to simulated state**.
- Next iteration: **4 — validate fleet metric inputs, formulas, and labels**.
- Latest successful delivery: `5c4a99d` (`main`), iteration 3 fleet state
  transitions.
- Remote verification: `origin/main` points to
  `5c4a99d9c3a52bd7663fc3346c2eb1ddf7dbc90a`.
- The unrelated untracked `docs/DEEP_BUILD_AND_PROGRESS_REPORT.md` remains
  preserved and excluded.

## Baseline verification

**Backend**

```text
64 passed, 1 warning in 1.74s
```

The warning is a Starlette `TestClient` deprecation notice related to `httpx`.
It did not fail the suite.

**Frontend**

```text
tsc -b && vite build
57 modules transformed
build passed
```

**Live backend API smoke test**

| Check | Result |
|---|---|
| `GET /api/health` | PASS — status `ok`, application `Aaroh-Saarthi` |
| `GET /api/stops` | PASS — 15 stops |
| `GET /api/routes` | PASS — 4 routes |
| `POST /api/journeys/search` (`S01` to `S05`, fastest, 08:00) | PASS — one journey option returned |
| `GET /api/fleet/state` | PASS — 21 simulated buses |

These are representative smoke checks, not complete workflow acceptance tests.

## What exists

- FastAPI backend and React/TypeScript/Vite passenger and fleet interfaces.
- Synthetic CSV network dataset: 15 stops, 4 routes, 19 trips, fares, and
  partial sample occupancy.
- Schedule-aware connection scanning with fastest and fare-oriented results.
- Simulated trip delays and occupancy warnings.
- SQLite saved-route endpoints and a browser UI for saved journeys.
- Keyword/intent-based chat using loaded transport data and backend services.
- Deterministic fleet scenario code for breakdowns and delays, with baseline,
  candidate responses, metrics, and recommendations.
- Leaflet map using OpenStreetMap tiles.
- Backend unit/API tests and local setup documentation.

## Browser acceptance evidence

Manual Playwright checks were run against the local frontend and backend:

- Passenger route search displayed the 60-minute Dwarka Sec-21 → Rajiv Chowk
  journey and ₹30 sample fare.
- The selected route appeared on the map with OpenStreetMap tiles and a
  highlighted line through all five trip stops. The map previously drew only
  the two endpoints; the response now includes intermediate stop IDs in trip
  order, and the map uses them.
- Searching Rajouri Garden → Rajiv Chowk at 08:50 showed T02's sample
  crowding warning (high load, approximately 70%).
- Applying a temporary 15-minute delay to T02 through the API and searching
  again changed the displayed time to 09:21 → 09:45 and showed the simulated
  delay warning. The temporary delay was cleared and the empty delay state
  verified afterward.
- The R01 chat answer returned its matching route name and stop sequence.
- Saved-route lifecycle passed in the UI: create, list, Search/reopen, delete;
  the page returned to “No saved routes yet.”
- Fleet dashboard showed 21 simulated buses (19 active, 2 spare). Breakdown
  and delay scenarios displayed baselines, alternatives, explanations, and
  metrics. Approve/reject actions returned visible acknowledgements.
- Rejection left the fleet at 19 active / 2 spare and B-T01 active. Approving
  “Deploy Spare Bus” changed the dashboard to 18 active / 1 spare, with B-T01
  broken down and B-SPARE-1 reassigned to T01. The dashboard showed all 21
  buses after the update.
- Starting another scenario returned both backend and dashboard to the common
  initial 19-active / 2-spare baseline.
- API tests verify the short-turn response reassigns B-T02 to T01 and that
  delay responses apply the modeled remaining delay. A second decision for
  the same disruption is rejected with HTTP 409.

## Known gaps and highest-priority concerns

1. Fleet metrics include fixed assumptions and are not calibrated against real
   operating data. Multi-bus coordination remains a simplified assignment
   model, not dispatch planning.
2. Passenger search does not take a service date; weekday/weekend availability
   and midnight crossing remain unverified.
3. Missing crowd data is not explicitly labeled “unknown” in the route card.
4. The provided task identifies DEV-P05 but does not include an independently
   verifiable official statement URL or source document. The requirements
   register uses the supplied P/F/I criteria; source-to-register traceability
   remains unverified.

No application startup failure or fleet-decision state defect is currently
known. Remaining items are scope limitations or verification gaps.

## Requirements summary

- Passenger: P1–P6 and P8–P11 PASS; P7 remains PARTIAL because missing
  occupancy is not explicitly identified as unknown.
- Fleet: F1–F5 and F7–F8 PASS; F6 PARTIAL because metric assumptions remain
  fixed and need stronger validation.
- Integration/quality: I3–I6 PASS; I1, I2, and I7 PARTIAL.
- Weighted verified requirement score: **93 / 100 = 93%**. This does not
  override the remaining synthetic-data limitations.

See the requirement-by-requirement evidence and stable weights in
[REQUIREMENTS_AUDIT.md](./REQUIREMENTS_AUDIT.md).

## Iteration log and next work

See [ITERATION_LOG.md](./ITERATION_LOG.md) for iteration evidence. Iteration 3
made approvals mutate simulated fleet state, kept rejection non-mutating,
prevented conflicting decisions, and refreshed the dashboard with the returned
state. The next iteration should validate fleet metric calculations and
clearly distinguish model assumptions from calculated outcomes.

## Current blockers

- None for local development or the verified baseline.
- Official statement/source verification may require the organizer's canonical
  DEV-P05 URL or source document.
- Live transport feeds are not included; use synthetic data honestly unless a
  valid, licensed feed is supplied.

## Latest test evidence

- Backend: `74 passed, 1 warning`; command
  `.\backend\.venv\Scripts\python.exe -m pytest .\backend\tests -q`.
- Frontend: `npm run build`; TypeScript check and Vite production build passed
  from `frontend`.
- Browser: manual checks passed for passenger search, map tile/path display,
  crowd and delay warnings, chat, saved-route CRUD/reopen, fleet state display,
  breakdown/delay scenarios, and approval/rejection state behavior.
- Temporary simulated passenger delay was cleared; API confirmed no active
  delays remained.
- Push: iteration 3 was pushed to `origin/main`; `git ls-remote` confirmed
  the remote ref matches local commit `5c4a99d9c3a52bd7663fc3346c2eb1ddf7dbc90a`.
  The unrelated untracked `docs/DEEP_BUILD_AND_PROGRESS_REPORT.md` remains
  preserved and excluded.
