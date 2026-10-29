# Aaroh-Saarthi: Project Build and Delivery Report

**Report date:** 29 October 2026
**Project:** Aaroh-Saarthi — Public Transit Route Assistant & Intelligent Fleet Coordination
**Repository:** [rajmaheshwari3001-dev/Codex-Test-Model](https://github.com/rajmaheshwari3001-dev/Codex-Test-Model)
**Branch:** `main`
**Initial delivery commit:** `f47f76f`

## 1. Executive summary

Aaroh-Saarthi is a full-stack demonstration application with two connected use
cases:

1. **Passenger assistance:** search a small scheduled transit network for
   fastest or cheapest journeys, inspect the route on a map, and save commonly
   used journeys.
2. **Fleet operations:** simulate a bus disruption, compare proposed responses
   against a no-action baseline, and approve or reject a feasible proposal.

The delivered repository contains a React/TypeScript frontend and a Python
FastAPI backend. Transit source data is supplied as versioned CSV files; SQLite
stores saved-route records. Chat, delay, occupancy, and fleet behaviors are
demonstrations based on the provided dataset and application logic—not live
transit integrations.

### Delivery and validation at a glance

| Measure | Result |
|---|---:|
| Files in the initial GitHub delivery | 70 |
| Insertions in the initial delivery commit | 8,784 |
| Backend automated tests | 49 passed |
| Frontend production build | Passed |
| Branch published | `main` |
| Local database and SQLite sidecars included in Git | No |
| Real-time fleet or live transit feed integration | No |

The file and insertion counts refer to the initial delivery commit, not to an
estimate of individual authorship. The report itself is an additional project
documentation file.

## 2. What the application does

### 2.1 Passenger journey assistant

The passenger view provides the interface for selecting an origin and
destination, specifying a departure time, and searching with either the
**fastest** or **cheapest** preference. Results are returned as journey options
with their legs and transfer information. The map displays the supplied stops
and route shapes and highlights the selected journey.

Additional passenger functions include:

- Listing stops and routes from the bundled dataset.
- Applying and clearing simulated trip delays, which the routing search can
  take into account.
- Showing crowding indicators when the sample occupancy dataset contains
  applicable data.
- Saving, listing, reopening, and deleting saved journeys.
- Asking the built-in transport chat assistant about routes, departures,
  route details, delays, comparisons, and saved routes.

### 2.2 Fleet intelligence

The fleet view exposes the simulator state and allows a user to evaluate a
breakdown or delay against a selected bus. The result includes a no-action
baseline and candidate responses, their feasibility, metric comparisons,
explanations, trade-offs, and a recommended option where applicable. Feasible
responses can be approved or rejected in the demo workflow.

The simulator resets scenarios to a common initial state for comparison. Its
metrics and generated bus state are calculated by application code; they do
not reflect real dispatch, vehicles, passengers, or operational decisions.

## 3. Application structure and technology

| Layer | Implementation |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router |
| Map | Leaflet and React Leaflet, using OpenStreetMap tiles |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Journey algorithm | Schedule-aware connection scanning, with a NetworkX graph available for network representation and future extensions |
| Source transit data | CSV files loaded into typed in-memory models and lookup maps at backend startup |
| Mutable saved-route data | SQLite, using a shared connection and WAL journaling |
| Backend tests | Pytest and FastAPI TestClient |

At startup, the backend loads transport data, creates the routing service,
initializes the SQLite schema, creates a default simulated fleet, and injects
those services into the API routers. The frontend calls the backend through a
central API client using the `/api` prefix.

## 4. Routing and data behavior

The routing service builds consecutive-stop connections for each trip and
scans them in departure-time order. It tracks reachable arrival times and
predecessor connections to reconstruct journeys. Separate search objectives
support earliest arrival and fare-oriented results; transfers and simulated
delays are considered by the application logic.

The bundled dataset is described in the project README as a **synthetic**
Delhi-area example containing:

- 15 stops and 4 routes.
- 19 trips and scheduled stop times.
- Zone-based fares and sample occupancy records.

These are demo records, not an authoritative or live public transport
schedule. CSV is the source of truth for the demo network; SQLite is reserved
for mutable saved-route information.

## 5. Backend API surface

The implemented API includes:

| Area | Endpoint(s) | Purpose |
|---|---|---|
| Service | `GET /api/health` | Health and application identity |
| Network data | `GET /api/stops`, `GET /api/routes` | Stops and routes for the UI |
| Journey search | `POST /api/journeys/search` | Fastest/cheapest schedule-aware journey search |
| Delay simulation | `POST /api/delays`, `GET /api/delays`, `DELETE /api/delays` | Set, inspect, and clear simulated trip delays |
| Saved journeys | `POST /api/saved-routes`, `GET /api/saved-routes`, `GET /api/saved-routes/{id}`, `DELETE /api/saved-routes/{id}` | Saved-route CRUD |
| Chat | `POST /api/chat` | Intent-based answers grounded in available transport data |
| Fleet | `GET /api/fleet/state`, `POST /api/fleet/disruption`, `POST /api/fleet/approve` | Inspect fleet and evaluate/approve simulated responses |

Request models validate important fields such as departure-time format,
journey preference, disruption type, and delay bounds. The API returns error
responses for invalid preferences, missing records, and infeasible approvals.

## 6. User interface

The frontend provides two main routes:

- `/` — passenger route search, results, map, saved routes, and chat.
- `/fleet` — simulated fleet state, disruption input, and response comparison.

The UI is composed from reusable components for layout/navigation, route
search and results, saved routes, chat, map rendering, fleet dashboards, and
scenario comparisons. The map uses OpenStreetMap tiles, so map tiles require
network access even though the application data and backend are local.

## 7. Automated tests and build verification

The backend test suite was executed from the bundled virtual environment on
**29 October 2026**:

```text
49 passed, 1 warning in 2.50s
```

The tests cover API behavior and the main data-loading, delay, fleet,
routing, saved-route, and schedule services.

The frontend production command was also run successfully:

```text
tsc -b && vite build
✓ 57 modules transformed
✓ built in 7.25s
```

The frontend build generated its normal `dist/` output, which is covered by
the repository ignore rules and is not part of the source delivery.

The backend run emitted one dependency deprecation warning: Starlette's
`TestClient` integration reports that using `httpx` is deprecated in favor of
`httpx2`. It did not cause test failures. Dependency migration should be
handled separately with compatibility checks before changing pinned packages.

## 8. Repository delivery

The initial source delivery was pushed to the repository's `main` branch in
commit `f47f76f`. The GitHub repository was empty before that push, so there
were no pre-existing project files to merge or duplicate.

The repository ignores `.env` files and local SQLite databases. During
pre-push verification, the ignore rules were also extended to exclude SQLite
WAL/SHM sidecars (`*.db-*`). The environment template `.env.example` is
versioned; it contains blank optional API-key configuration rather than a
credential. Local database files and generated dependency/build folders were
not included in the initial push.

## 9. Scope boundaries and limitations

This delivery is a functional hackathon/learning prototype, not a production
transit operations platform:

- **No live data:** no real-time vehicle positions, service alerts, ticketing,
  or third-party transit feeds are connected.
- **Synthetic network:** stop, route, schedule, fare, and occupancy data are
  small sample data and should not be used for real travel decisions.
- **Simulated operations:** fleet state, disruptions, response metrics, and
  approval are local demo logic; approval does not dispatch a real vehicle.
- **Rule-based chat:** the assistant uses keyword/intent detection rather than
  a general language model. An environment variable exists for an optional
  future LLM integration, but the delivered V1 path does not require one.
- **No user accounts:** there is no authentication or per-user data isolation.
- **Prototype persistence:** SQLite is appropriate for the included demo but
  does not supply multi-user production deployment, managed backups, or
  high-availability behavior.
- **External map tiles:** the Leaflet map depends on access to OpenStreetMap
  tile servers.
- **Operational hardening:** production deployment, monitoring, rate limits,
  security review, accessibility assessment, and real-data validation are
  outside the delivered and verified scope.

## 10. Suggested next steps

1. Connect a licensed, trustworthy transit feed and validate imported
   schedules, fares, and service-day/time-zone semantics.
2. Add integration tests for representative API flows and test the frontend
   interactions in a browser.
3. Decide whether this remains a single-user demo or needs authentication,
   user-scoped saved routes, and a production database.
4. Define fleet-simulation assumptions and validate metric formulas with
   transport-domain stakeholders before using the results for decisions.
5. Add deployment configuration, observability, security controls, and
   operational documentation if the application is intended for public use.

## 11. Overall status

The core prototype is implemented, versioned, and pushed to GitHub. Backend
tests and the frontend production build both pass. The strongest completed
areas are the passenger journey workflow, schedule-aware backend routing,
saved-route persistence, and deterministic fleet-disruption comparison.
The principal work remaining is not basic project assembly; it is replacing
demo assumptions with validated real-world data and adding the operational
controls required for production use.
