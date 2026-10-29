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
