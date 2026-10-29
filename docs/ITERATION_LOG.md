# Iteration Log

## Iteration 0 — Baseline and requirements ledger

- **Date/time:** 29 Oct 2026, baseline checks completed before 12:35 IST.
- **Objective:** Establish current repository, test, build, and API behavior;
  document requirement evidence and score before modifying functional code.
- **Why selected:** Required to distinguish historical report claims from
  current observed state and avoid premature code changes.
- **Files changed:** `docs/PROGRESS.md`, `docs/REQUIREMENTS_AUDIT.md`,
  `docs/ITERATION_LOG.md`, `docs/KNOWN_LIMITATIONS.md`.
- **Baseline Git state:** `main`, local HEAD `0e28bca`; remote `origin/main`
  matched; working tree was clean before documentation changes.
- **Tests executed:** Backend test suite; frontend TypeScript check and Vite
  production build; five representative API smoke checks.
- **Tests passed:** Backend 49; frontend build passed; API checks 5.
- **Tests failed:** 0.
- **Acceptance result:** Baseline checks passed. Browser workflows and several
  requirements remain only partially verified.
- **Verified score:** 60% before → 60% after. This documentation entry adds
  evidence accounting, not behavior coverage.
- **Commit:** `b62c51b`.
- **Push status:** Pushed to `origin/main`; remote ref verified.
- **Next task:** Add routing edge-case tests and fix the highest-impact defect
  reproduced by those tests.

## Iteration 1 — Routing correctness and passenger/fleet API regressions

- **Date/time:** 29 Oct 2026, completed by 12:50 IST.
- **Objective:** Reproduce routing edge cases, fix transfer/fare correctness,
  and add API-level evidence for simulated delays, crowding, and fleet
  approval/rejection.
- **Why selected:** Passenger schedule/routing correctness is central to the
  official module; baseline coverage did not assert exact transfer boundaries,
  fares, or delay effects.
- **Files changed:** `backend/app/services/routing_service.py`,
  `backend/tests/test_routing.py`, `backend/tests/test_api.py`,
  `backend/tests/test_fleet_simulator.py`, and the progress/audit/limitations
  documents.
- **Tests executed:** Focused route/API/fleet sets, final full backend suite
  (69 passed), frontend TypeScript check and Vite production build.
- **Tests passed:** Backend 69; frontend build passed.
- **Tests failed:** 0 in final run. Two new cheapest-search tests initially
  failed and reproduced fare-per-stop charging and lost feasible arrival
  labels; the implementation was corrected and all tests then passed.
- **Acceptance result:** Transfer buffer, fare label/leg logic, invalid time
  response, API delay/crowding response, fleet metric repeatability, feasible
  short-turn assignment, unknown-bus HTTP 404, approve/reject behavior,
  malformed input, fare-unavailable fallback, and grounded route chat have
  focused test evidence. Browser behavior remains untested.
- **Verified score:** 60% before → 78% based on focused acceptance evidence.
  P2/P4/P6/P11/F3/F4/F7/F8 earned PASS evidence; no browser coverage points
  were claimed.
- **Commit:** `29f5a9c`.
- **Push status:** Pushed to `origin/main`; `ls-remote` confirmed the branch
  points to this commit.
- **Next task:** Audit fleet state transition semantics and improve or narrowly
  document action/metric assumptions.

## Iteration 2 — Browser acceptance and map-path correctness

- **Date/time:** 29 Oct 2026, 13:13 IST.
- **Objective:** Exercise the passenger/fleet workflows in a browser and fix
  any evidenced mismatch between the selected journey and its map rendering.
- **Why selected:** The baseline had no browser evidence, and visual map
  correctness is part of the passenger requirement and route consistency.
- **Candidates and prioritization:** Scores use the specified
  `(requirement impact × user benefit × confidence) / (effort × risk factor)`
  formula, with each input rated 1–5. Browser acceptance (5×5×5)/(3×1) =
  41.7; map geometry correction (5×5×5)/(2×2) = 31.3; fleet approval state
  (5×5×4)/(4×3) = 8.3; explicit unknown-occupancy UI (3×4×4)/(2×2) = 12.
  Browser verification and the map defect were grouped because the former
  directly exposed the latter; fleet state remains the next high-priority
  implementation task.
- **Files changed:** `backend/app/models/journey.py`,
  `backend/app/services/routing_service.py`,
  `backend/tests/test_routing.py`, `frontend/src/types/index.ts`,
  `frontend/src/components/TransportMap.tsx`, `docs/API_REFERENCE.md`,
  `docs/PROGRESS.md`, `docs/REQUIREMENTS_AUDIT.md`,
  `docs/KNOWN_LIMITATIONS.md`, and this log.
- **Implementation:** Journey legs now expose intermediate stop IDs in actual
  trip order; the map draws each selected leg through those stops rather than
  connecting only its boarding/alighting endpoints.
- **Tests executed:** Full backend pytest suite; frontend TypeScript check and
  Vite production build; manual browser checks against local backend/frontend;
  live health/journey/delay/fleet API checks.
- **Tests passed:** Backend 70; frontend build passed. Browser checks passed
  for passenger route search, map tile/path, crowd warning, delayed journey
  display, chat answer, saved-route create/reopen/delete, fleet list, breakdown
  and delay comparisons, and approve/reject acknowledgements.
- **Tests failed:** The first post-change browser reload used a backend process
  that had not been restarted to emit the new stop-ID field; after restarting
  the backend, the API returned `S14,S15,S05` and browser route rendering
  passed. The separate fleet-state acceptance check reproduced a defect:
  after approving `deploy_spare`, B-T01 remained active and B-SPARE-1 remained
  spare.
- **Acceptance result:** Passenger P5–P9 and fleet F1–F2 gained browser
  evidence; map path follows all trip stops. F8 is PARTIAL until an approved
  action updates simulated state and rejection is proven not to mutate it.
- **Completion percentage:** 78% before → 89.5% after. The previous audit's
  summary table had an arithmetic typo (49 passenger points instead of the
  51 implied by its row statuses); this iteration corrected the subtotal and
  recalculated the overall score from the stable requirement weights.
- **Commit:** `3f3ad08`.
- **Push status:** Pushed to `origin/main`; `ls-remote` confirmed
  `3f3ad08639a64364ae1c2bf2eec05c57e9f8476e`.
- **Next task:** Apply approved fleet response state, keep rejected scenarios
  unchanged, and refresh the browser dashboard after a decision.

## Iteration 3 — Apply fleet decisions to simulated state

- **Date/time:** 29 Oct 2026, 13:22 IST.
- **Objective:** Make accepted fleet responses change simulated bus state,
  keep rejected responses unchanged, prevent conflicting decisions, and show
  the resulting state in the dashboard.
- **Why selected:** Iteration 2 reproduced a failure in the required
  approve/reject workflow: approval returned success while the fleet remained
  unchanged. The prompt explicitly requires verifying the resulting
  simulated state.
- **Candidates and prioritization:** Using
  `(impact × user benefit × confidence) / (effort × risk factor)` with 1–5
  ratings: validate fleet metric assumptions (4×5×4)/(3×2) = 13.3; explicitly
  label missing occupancy (3×4×4)/(2×2) = 12; apply approval state
  (5×5×5)/(4×3) = 10.4. The confirmed mandatory state-transition failure was
  selected despite its lower heuristic score because the priority rules put
  incorrect fleet simulation and required workflow failures ahead of optional
  verification improvements.
- **Files changed:** `backend/app/api/fleet.py`,
  `backend/app/services/fleet_simulator.py`, `backend/tests/test_api.py`,
  `frontend/src/services/api.ts`,
  `frontend/src/components/FleetDashboard.tsx`,
  `frontend/src/components/ScenarioComparison.tsx`, `frontend/src/types/index.ts`,
  `docs/API_REFERENCE.md`, `docs/PROGRESS.md`,
  `docs/REQUIREMENTS_AUDIT.md`, `docs/KNOWN_LIMITATIONS.md`, and this log.
- **Implementation:** Accepted breakdown responses now mark the affected bus
  broken and reassign a spare or same-route bus; delay responses apply the
  modeled remaining delay. Rejection returns the unchanged state. Each
  disruption ID is unique and accepts only one decision (HTTP 409 thereafter).
  Evaluation and approval responses return fleet snapshots; the UI refreshes
  all bus rows after both and disables further decisions for that scenario.
  Starting another scenario returns the simulator and dashboard to the common
  initial baseline.
- **Tests executed:** Full backend pytest suite, frontend TypeScript/Vite
  build, and manual browser rejection/approval checks.
- **Tests passed:** Backend 74; frontend build passed. API tests verify spare
  deployment, short-turn, delay responses, state/metric bus-count agreement,
  rejection invariance, and duplicate-decision rejection. Browser checks
  verify rejection leaves 19 active / 2 spare and approval updates to 18
  active / 1 spare, with B-T01 broken down and B-SPARE-1 reassigned; the next
  scenario restores both backend and UI to the 19-active / 2-spare baseline.
- **Tests failed:** The first frontend build caught `decisionMade` and
  `decisionPending` missing from `ScenarioComparison`'s destructured props.
  The props were added and the build rerun successfully; no final test failed.
- **Acceptance result:** F5, F8, and I4 now have state-transition evidence.
  Approval remains simulated and in-memory; a new evaluation resets to the
  initial baseline.
- **Completion percentage:** 89.5% before → 93% after. P7 remains PARTIAL
  because absent sample occupancy is not explicitly shown as unknown; F6
  remains PARTIAL because scenario metrics use fixed assumptions.
- **Commit:** `5c4a99d9c3a52bd7663fc3346c2eb1ddf7dbc90a`.
- **Push status:** Pushed to `origin/main`; `git ls-remote` confirmed the
  remote ref matches the commit.
- **Next task:** Validate fleet metric inputs/formulas and clearly separate
  fixed assumptions from measured scenario outcomes.

## Iteration 4 — Fleet metric transparency and formula verification

- **Date/time:** 29 Oct 2026, started 13:29 IST; completed 13:37 IST.
- **Objective:** Test the simulator's state-derived metric formulas, make the
  passenger estimate formula explicit, and expose the fixed synthetic metric
  assumptions in the fleet comparison UI and API contract.
- **Why selected:** F6 remains PARTIAL because several displayed impacts are
  fixed scenario assumptions and their provenance is easy to mistake for
  measured outcomes. The goal is to verify the genuinely computed fields and
  clearly label the limitations without claiming real-world calibration.
- **Candidates and prioritization:** Using
  `(requirement impact × user benefit × confidence) / (effort × risk factor)`
  with 1–5 ratings: verify metric formulas and expose assumptions
  (4×4×5)/(2×2) = 20; label missing occupancy as unknown
  (3×4×4)/(2×2) = 12; verify midnight routing semantics
  (4×4×3)/(4×3) = 4. F6 validation was selected as the outstanding fleet
  metric correctness concern.
- **Acceptance result:** Tests prove bus counts/utilization follow scenario
  state, baseline affected-passenger estimates follow occupancy × capacity,
  and delay wait estimates scale with disruption input. API/UI expose
  provenance, including fixed fractions for response passenger counts.
  F6 remains PARTIAL because response passenger, wait, delayed-trip, and
  crowding impacts still use fixed assumptions; the verified score did not
  increase.
- **Files changed:** `backend/app/services/fleet_simulator.py`,
  `backend/tests/test_fleet_simulator.py`, `backend/tests/test_api.py`,
  `frontend/src/types/index.ts`,
  `frontend/src/components/ScenarioComparison.tsx`,
  `docs/API_REFERENCE.md`, `docs/PROGRESS.md`,
  `docs/REQUIREMENTS_AUDIT.md`, `docs/KNOWN_LIMITATIONS.md`, and this log.
- **Tests executed:** Full backend test suite, frontend type check/production
  build, and browser disruption scenario with the metric-provenance note.
- **Tests passed:** Backend 77, frontend build, and browser note checks passed;
  one existing Starlette/httpx deprecation warning remains.
- **Tests failed:** The first browser attempt used a stale backend process
  without `metric_notes`; after restarting the exact local API listener, the
  scenario rendered the new notes and passed. No code failure remains.
- **Completion percentage:** 93% before → 93% after. This iteration improved
  evidence and disclosure but did not change requirement status.
- **Commit:** `37b832f7fc4036393ca3ea285798181f6c9713c6`.
- **Push status:** Pushed to `origin/main`; `git ls-remote` confirmed the
  remote ref matches the commit.
- **Next task:** Iteration 5 — make missing sample occupancy explicit in the
  passenger route UI.

## Iteration 5 — Explicit passenger crowd-data availability

- **Date/time:** 29 Oct 2026, started 13:39 IST; completed 14:03 IST.
- **Objective:** Report the occupancy-data status for each journey leg's
  boarding stop, including an explicit unknown/unavailable state when no
  sample record exists.
- **Why selected:** P7 is the only passenger requirement still PARTIAL because
  routes with no occupancy sample currently show no crowding message, which
  can be mistaken for a low-crowding result.
- **Candidates and prioritization:** Using
  `(requirement impact × user benefit × confidence) / (effort × risk factor)`
  with 1–5 ratings: expose known/unknown crowd status per leg
  (3×4×5)/(2×1) = 30; retrieve the canonical DEV-P05 source
  (2×3×3)/(2×1) = 9; verify midnight routing semantics
  (4×4×3)/(4×3) = 4. P7 was selected as the highest-scoring user-visible
  requirement gap.
- **Acceptance result:** Each journey leg reports boarding crowd level and
  optional percent. Missing/unrecognized levels are `unknown`; missing or
  out-of-range percentages are `null`. API tests cover high-load, missing, and
  invalid records. Browser checks showed T04 as unavailable at Rajiv Chowk and
  T01 as high (~80%) at Connaught Place without inventing a value. P7 now PASS.
- **Files changed:** `backend/app/models/journey.py`,
  `backend/app/services/routing_service.py`, `backend/tests/test_api.py`,
  `frontend/src/types/index.ts`,
  `frontend/src/components/RouteResultCard.tsx`, `docs/API_REFERENCE.md`,
  `docs/PROGRESS.md`, `docs/REQUIREMENTS_AUDIT.md`,
  `docs/KNOWN_LIMITATIONS.md`, and this log.
- **Tests executed:** Full backend test suite, frontend type check/production
  build, direct API verification for T01/T04, and browser searches for known
  high-load and missing crowd status.
- **Tests passed:** Backend 79, frontend build, API responses, and both browser
  crowd-status checks passed; one existing Starlette/httpx warning remains.
- **Tests failed:** 0.
- **Completion percentage:** 93% before → 95% after; P7 moved from PARTIAL to
  PASS based on API and browser evidence.
- **Commit:** `c51718957a8a75c26ec60aadbde7d47a8cb6028f`.
- **Push status:** Pushed to `origin/main`; `git ls-remote` confirmed the
  remote ref matches the commit.
- **Next task:** Iteration 6 — verify service-day and midnight routing
  semantics.
