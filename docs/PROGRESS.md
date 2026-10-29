# Aaroh-Saarthi Development Progress

## Current status

**Iterative acceptance work is in progress.** Passenger search, chat, saved
routes, crowding, simulated delay, and Leaflet/OpenStreetMap map behavior have
been exercised in a browser. Fleet breakdown and delay scenarios, baseline
comparisons, and decision acknowledgements have also been exercised. Fleet
approval currently acknowledges a response without applying it to the
simulated fleet state; this is the next high-priority defect.

| Measure | Current value | Meaning |
|---|---:|---|
| Verified requirement completion | **89.5%** | Weighted P/F/I register; only PASS earns full points and PARTIAL earns half |
| Implementation estimate | **About 80%** | Coarse engineering estimate; not acceptance evidence or the weighted score |
| Backend test execution | **70 passed, 0 failed** | Full suite after direction-aware intermediate-stop IDs |
| Frontend type-check/build | **Passed** | `npm run build` ran `tsc -b` and Vite production build |
| API smoke checks | **5 baseline checks passed** | Health, stops, routes, sample journey search, and fleet state |
| Browser workflow | **Manual acceptance checks passed, with one state defect** | Passenger and fleet workflows exercised; fleet approval does not yet update state |
| Coverage percentage | **Not measured** | No coverage-instrumented test run was performed |

The implementation estimate is a coarse scope estimate, not the weighted
completion score. The verified score is calculated in
[REQUIREMENTS_AUDIT.md](./REQUIREMENTS_AUDIT.md).

## Repository and delivery state

- Repository: `https://github.com/rajmaheshwari3001-dev/Codex-Test-Model`
- Branch: `main`
- Baseline local and remote commit: `0e28bca`; progress ledger delivery: `b62c51b`.
- Latest completed iteration: **2 — browser acceptance and map-path correctness**.
- Next iteration: **3 — apply approved fleet response state and verify rejection**.
- Latest successful delivery: `3f3ad08` (`main`).
- Remote verification: `origin/main` points to
  `3f3ad08639a64364ae1c2bf2eec05c57e9f8476e`.
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
- A follow-up API state check after approving “Deploy Spare Bus” found B-T01
  still active and B-SPARE-1 still spare. This is a reproduced state-transition
  defect, not a successful fleet dispatch.

## Known gaps and highest-priority concerns

1. **High:** Fleet response approval currently returns a simulated
   acknowledgement but does not apply the approved response to fleet state or
   refresh the dashboard; rejection/state invariants also need acceptance tests.
2. Fleet metrics include fixed assumptions and are not calibrated against real
   operating data. Multi-bus coordination remains a simplified assignment
   model, not dispatch planning.
3. Passenger search does not take a service date; weekday/weekend availability
   and midnight crossing remain unverified.
4. The provided task identifies DEV-P05 but does not include an independently
   verifiable official statement URL or source document. The requirements
   register uses the supplied P/F/I criteria; source-to-register traceability
   remains unverified.

No application startup failure is currently known. Fleet approval's missing
state change is an observed defect; the other items are scope limitations or
verification gaps.

## Requirements summary

- Passenger: P1–P6 and P8–P11 PASS; P7 remains PARTIAL because missing
  occupancy is not explicitly identified as unknown.
- Fleet: F1–F4 and F7 PASS; F5, F6, and F8 PARTIAL.
- Integration/quality: I3, I5, and I6 PASS; I1, I2, I4, and I7 PARTIAL.
- Weighted verified requirement score: **89.5 / 100 = 89.5%**. This does not
  override the open fleet state defect or synthetic-data limitations.

See the requirement-by-requirement evidence and stable weights in
[REQUIREMENTS_AUDIT.md](./REQUIREMENTS_AUDIT.md).

## Iteration log and next work

See [ITERATION_LOG.md](./ITERATION_LOG.md) for iteration evidence. Iteration 2
fixed map journey geometry, added the API stop-ID sequence needed by the map,
and completed broad manual browser checks. The next iteration must apply
approved fleet response state and prove that rejection leaves state unchanged.

## Current blockers

- None for local development or the verified baseline.
- Official statement/source verification may require the organizer's canonical
  DEV-P05 URL or source document.
- Live transport feeds are not included; use synthetic data honestly unless a
  valid, licensed feed is supplied.

## Latest test evidence

- Backend: `70 passed, 1 warning`; command
  `.\backend\.venv\Scripts\python.exe -m pytest .\backend\tests -q`.
- Frontend: `npm run build`; TypeScript check and Vite production build passed
  from `frontend`.
- Browser: manual checks passed for passenger search, map tile/path display,
  crowd and delay warnings, chat, saved-route CRUD/reopen, fleet state display,
  breakdown/delay scenarios, and approve/reject acknowledgements. Fleet
  approval state mutation failed its acceptance check and remains open.
- Temporary simulated passenger delay was cleared; API confirmed no active
  delays remained.
- Push: `3f3ad08` verified on `origin/main`; the unrelated untracked
  `docs/DEEP_BUILD_AND_PROGRESS_REPORT.md` is preserved and excluded.
