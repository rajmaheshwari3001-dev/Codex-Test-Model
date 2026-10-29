# Aaroh-Saarthi Development Progress

## Current status

**Baseline established; iterative acceptance work is in progress.** The current
prototype starts locally, returns representative passenger and fleet API
responses, passes its existing backend suite, and builds the frontend. These
results do not yet establish complete passenger, fleet, or browser acceptance.

| Measure | Current value | Meaning |
|---|---:|---|
| Verified requirement completion | **78%** | Weighted P/F/I register; only PASS earns full points and PARTIAL earns half |
| Implementation estimate | **About 75%** | Engineering estimate that the listed feature areas exist in code; not acceptance evidence |
| Backend test execution | **69 passed, 0 failed** | Full suite rerun after routing and fleet acceptance tests |
| Frontend type-check/build | **Passed** | `tsc -b && vite build`; production output built after routing changes |
| API smoke checks | **5 checks passed** | Health, stops, routes, sample journey search, and fleet state |
| Browser workflow | **Not tested** | A frontend build does not verify browser interactions |
| Coverage percentage | **Not measured** | No coverage-instrumented test run was performed |

The implementation estimate is a coarse scope estimate, not the weighted
completion score. The verified score is calculated in
[REQUIREMENTS_AUDIT.md](./REQUIREMENTS_AUDIT.md).

## Repository and delivery state

- Repository: `https://github.com/rajmaheshwari3001-dev/Codex-Test-Model`
- Branch: `main`
- Baseline local and remote commit: `0e28bca`; progress ledger delivery: `b62c51b`
- Baseline working tree: clean before this documentation iteration.
- Current development iteration: **1 — routing correctness and acceptance tests**.
- Latest successful delivery: `29f5a9c` (`main`).
- Last remote verification: `origin/main` points to `29f5a9c7835ee7162da5d9ea45e9e8d8a5637c37`.

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

## Known gaps and highest-priority concerns

1. Routing now has regression evidence for delay-adjusted ordering, fare labels,
   one fare per ride leg, and transfer-buffer boundaries. Midnight crossing
   and service-date availability remain unverified.
2. Passenger route search does not take a service date; weekday/weekend
   availability is therefore not verified in the search flow.
3. API tests do not establish that visible frontend controls and the complete
   workflows work in a browser.
4. Fleet metric formulas and response state have targeted tests, but fixed
   passenger-impact assumptions are not validated against real operating data.
5. The provided task identifies DEV-P05 but does not include an independently
   verifiable official statement URL or source document. The requirements
   register uses the supplied P/F/I criteria; source-to-register traceability
   remains unverified.

There are no known baseline startup failures. The concerns above are gaps in
verification or model scope and must not be presented as confirmed defects
until tests reproduce them.

## Requirements summary

- Passenger: P1–P4, P6, P10, and P11 PASS for the tested synthetic-data
  scope; P5, P7–P9 remain PARTIAL.
- Fleet: F3, F4, F7, and F8 PASS for tested simulator/API scope; F1, F2, F5,
  and F6 remain PARTIAL.
- Integration/quality: I5 PASS for local setup documentation plus verified
  backend startup/health and frontend build; I1–I4 and I6–I7 PARTIAL.
- Weighted verified requirement score: **78 / 100 = 78%**.

See the requirement-by-requirement evidence and stable weights in
[REQUIREMENTS_AUDIT.md](./REQUIREMENTS_AUDIT.md).

## Iteration log and next work

See [ITERATION_LOG.md](./ITERATION_LOG.md) for completed and ongoing
iterations. Iteration 1 fixed verified routing transfer/fare-label behavior,
modeled the short-turn assignment in its scenario metrics, added API
delay/crowding/approval/input validation tests, and documented quick local
startup/API checks. Next, verify complete browser workflows; assess fleet
metrics with clear limits on fixed assumptions.

## Current blockers

- None for local development or the verified baseline.
- Official statement/source verification may require the organizer's canonical
  DEV-P05 URL or source document.
- Live transport feeds are not included; use synthetic data honestly unless a
  valid, licensed feed is supplied.

## Latest test evidence

- Backend: `69 passed, 1 warning`; command
  `.\backend\.venv\Scripts\python.exe -m pytest .\backend\tests -q`.
  `.\backend\.venv\Scripts\python.exe -m pytest .\backend\tests -q`
  from the project parent.
- Frontend: `npm run build`; TypeScript check and Vite production build passed
  from `frontend`.
- API: five baseline checks and new TestClient regressions for invalid time,
  delay/crowding effects, and fleet approval/rejection passed.
- Browser: not tested.
- Push: `29f5a9c` verified on `origin/main`; the unrelated untracked
  `docs/DEEP_BUILD_AND_PROGRESS_REPORT.md` was preserved and excluded from the
  commit.
