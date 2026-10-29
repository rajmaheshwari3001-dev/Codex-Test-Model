# Aaroh-Saarthi Development Progress

## Current status

**Baseline established; iterative acceptance work is in progress.** The current
prototype starts locally, returns representative passenger and fleet API
responses, passes its existing backend suite, and builds the frontend. These
results do not yet establish complete passenger, fleet, or browser acceptance.

| Measure | Current value | Meaning |
|---|---:|---|
| Verified requirement completion | **60%** | Weighted P/F/I register; only PASS earns full points and PARTIAL earns half |
| Implementation estimate | **About 75%** | Engineering estimate that the listed feature areas exist in code; not acceptance evidence |
| Backend test execution | **49 passed, 0 failed** | Baseline suite executed on 29 Oct 2026 |
| Frontend type-check/build | **Passed** | `tsc -b && vite build`; production output built |
| API smoke checks | **5 checks passed** | Health, stops, routes, sample journey search, and fleet state |
| Browser workflow | **Not tested** | A frontend build does not verify browser interactions |
| Coverage percentage | **Not measured** | No coverage-instrumented test run was performed |

The implementation estimate is a coarse scope estimate, not the weighted
completion score. The verified score is calculated in
[REQUIREMENTS_AUDIT.md](./REQUIREMENTS_AUDIT.md).

## Repository and delivery state

- Repository: `https://github.com/rajmaheshwari3001-dev/Codex-Test-Model`
- Branch: `main`
- Baseline local and remote commit: `0e28bca`
- Baseline working tree: clean before this documentation iteration.
- Current development iteration: **0 — baseline and requirements ledger**.
- Latest successful delivery before this ledger: `0e28bca`.
- Last verified pushed commit at baseline: `0e28bca`; the baseline ledger is not yet committed.

## Baseline verification

**Backend**

```text
49 passed, 1 warning in 1.72s
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

1. Existing routing tests establish only a small subset of edge cases. They do
   not yet prove that delay-adjusted connections are scanned in effective
   departure order or that cheapest search retains all relevant arrival/fare
   alternatives.
2. Passenger route search does not take a service date; weekday/weekend
   availability is therefore not verified in the search flow.
3. API tests do not establish that visible frontend controls and the complete
   workflows work in a browser.
4. Fleet response metrics and assignment/coordination assumptions have not
   been independently validated against scenario invariants.
5. The provided task identifies DEV-P05 but does not include an independently
   verifiable official statement URL or source document. The requirements
   register uses the supplied P/F/I criteria; source-to-register traceability
   remains unverified.

There are no known baseline startup failures. The concerns above are gaps in
verification or model scope and must not be presented as confirmed defects
until tests reproduce them.

## Requirements summary

- Passenger: P1 and P3 PASS on the currently scoped synthetic network; P10
  PASS for the documented-sample-data fallback. Other requirements are
  PARTIAL pending end-to-end/edge-case evidence.
- Fleet: F1–F8 PARTIAL; routes return simulated state and scenario results, but
  complete behavioral and metric acceptance is not established.
- Integration/quality: I5 PASS for local setup documentation plus verified
  backend startup/health and frontend build; I1–I4 and I6–I7 PARTIAL.
- Weighted verified requirement score: **60 / 100 = 60%**.

See the requirement-by-requirement evidence and stable weights in
[REQUIREMENTS_AUDIT.md](./REQUIREMENTS_AUDIT.md).

## Iteration log and next work

See [ITERATION_LOG.md](./ITERATION_LOG.md) for completed and ongoing
iterations. The next code-focused iteration will test and correct the most
important routing correctness gaps first, beginning with delay-adjusted
connection ordering and cheapest-route labels. The following iteration will
validate fleet state transitions and scenario metrics. Browser tests will be
recorded separately from unit tests and builds.

## Current blockers

- None for local development or the verified baseline.
- Official statement/source verification may require the organizer's canonical
  DEV-P05 URL or source document.
- Live transport feeds are not included; use synthetic data honestly unless a
  valid, licensed feed is supplied.

## Latest test evidence

- Backend: `49 passed, 1 warning`; command
  `.\backend\.venv\Scripts\python.exe -m pytest .\backend\tests -q`
  from the project parent.
- Frontend: `npm run build`; TypeScript check and Vite production build passed
  from `frontend`.
- API: five checks in the table above passed against a locally started
  Uvicorn backend.
- Browser: not tested.
