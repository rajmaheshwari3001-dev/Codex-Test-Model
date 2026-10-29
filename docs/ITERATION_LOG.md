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
- **Commit:** Pending final review.
- **Push status:** Not yet pushed.
- **Next task:** Apply approved fleet response state, keep rejected scenarios
  unchanged, and refresh the browser dashboard after a decision.
