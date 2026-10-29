# Aaroh-Saarthi Architecture

## System Overview

Aaroh-Saarthi is a monorepo with two main modules connected through a shared backend:

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  ┌──────────────────┐    ┌───────────────────────────┐  │
│  │  Passenger Page   │    │   Fleet Intelligence Page │  │
│  │  - RouteSearchForm│    │   - FleetDashboard        │  │
│  │  - RouteResultCard│    │   - ScenarioComparison    │  │
│  │  - TransportMap   │    │                           │  │
│  │  - ChatAssistant  │    │                           │  │
│  │  - SavedRoutes    │    │                           │  │
│  └────────┬─────────┘    └────────────┬──────────────┘  │
│           │        services/api.ts     │                 │
│           └────────────┬───────────────┘                 │
└────────────────────────┼────────────────────────────────┘
                         │  HTTP / JSON (Vite proxy)
┌────────────────────────┼────────────────────────────────┐
│                    BACKEND (FastAPI)                     │
│  ┌─────────────────────┴──────────────────────────────┐ │
│  │                  API Layer                          │ │
│  │  routes.py │ saved_routes.py │ chat.py │ fleet.py   │ │
│  └─────────────────────┬──────────────────────────────┘ │
│  ┌─────────────────────┴──────────────────────────────┐ │
│  │               Service Layer                         │ │
│  │  routing_service │ schedule_service │ delay_service  │ │
│  │  crowd_service │ chat_service │ fleet_simulator      │ │
│  │  saved_route_service │ data_loader                   │ │
│  └──────────┬──────────────────────┬──────────────────┘ │
│  ┌──────────┴──────┐    ┌─────────┴──────────────────┐  │
│  │   CSV Data Files │    │   SQLite Database          │  │
│  │   (transport)    │    │   (saved routes)           │  │
│  └─────────────────┘    └────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

**Tech:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Leaflet

### Component Hierarchy

```
App (react-router-dom)
└── Layout
    ├── Navigation (NavLink for Passenger / Fleet)
    └── <Outlet> renders:
        ├── PassengerPage
        │   ├── RouteSearchForm      — origin/dest/time/preference form
        │   ├── RouteResultCard[]     — one card per journey option
        │   ├── TransportMap          — Leaflet map with stops + routes
        │   ├── ChatAssistant         — conversational interface
        │   └── SavedRoutes           — saved route list + delete/reuse
        ├── FleetPage
        │   └── FleetDashboard
        │       └── ScenarioComparison — baseline vs responses
        └── NotFoundPage
```

### Data Flow (Frontend)

1. `PassengerPage` calls `getStops()` and `getRoutes()` on mount
2. User fills form → `searchJourneys()` → backend returns `JourneyOption[]`
3. Options render as `RouteResultCard` components
4. Selecting an option passes it to `TransportMap` which draws the path
5. `ChatAssistant` sends messages to `/api/chat` and displays replies
6. `SavedRoutes` calls `getSavedRoutes()` and supports delete/reuse

All API calls go through `src/services/api.ts` which wraps `fetch()`.

### Vite Proxy

During development, Vite proxies `/api/*` requests to `http://localhost:8000`, avoiding CORS issues. This is configured in `vite.config.ts`.

## Backend Architecture

**Tech:** Python 3.10+ + FastAPI + Uvicorn + NetworkX + Pandas + SQLite

### Startup Sequence (app/main.py)

```python
@asynccontextmanager
async def lifespan(app):
    td = load_all()           # 1. Read CSV files into TransportData
    routing_service = RoutingService(td)  # 2. Build connections + graph
    init_database()           # 3. Create SQLite tables
    fleet_simulator = FleetSimulator()    # 4. Init fleet
    fleet_simulator.init_default_fleet(td)
    # 5. Inject dependencies into API modules
    routes_api.init(td, routing_service, delay_service)
    chat_api.init(td, routing_service, delay_service)
    fleet_api.init(fleet_simulator)
    yield
```

### API Layer (app/api/)

| File              | Prefix            | Responsibilities                          |
|-------------------|-------------------|-------------------------------------------|
| `routes.py`       | `/api`            | Health, stops, routes, journey search, delays |
| `saved_routes.py` | `/api/saved-routes`| CRUD for saved routes                     |
| `chat.py`         | `/api`            | Chat message processing                   |
| `fleet.py`        | `/api/fleet`      | Fleet state, disruption evaluation, approve|

### Service Layer (app/services/)

| Service               | File                    | Purpose                                          |
|-----------------------|-------------------------|--------------------------------------------------|
| **DataLoader**        | `data_loader.py`        | Reads CSV → `TransportData` with lookup dicts     |
| **RoutingService**    | `routing_service.py`    | Schedule-aware routing (Connection Scan variant)  |
| **ScheduleService**   | `schedule_service.py`   | Next departure queries, service day checks        |
| **DelayService**      | `delay_service.py`      | In-memory trip delay store                        |
| **CrowdService**      | `crowd_service.py`      | Occupancy data lookup                             |
| **SavedRouteService** | `saved_route_service.py`| SQLite CRUD for saved routes                      |
| **ChatService**       | `chat_service.py`       | Intent detection + backend data retrieval         |
| **FleetSimulator**    | `fleet_simulator.py`    | Deterministic bus fleet simulation                |

### Routing Algorithm

The routing engine implements a **Connection Scan Algorithm (CSA) variant**:

1. **Build connections:** Each pair of consecutive stops on a trip becomes a `Connection` object (from_stop → to_stop with departure/arrival times).
2. **Sort by departure time.**
3. **Forward scan:** For each connection, check if we can board it (our arrival at from_stop ≤ departure time, with a 2-minute transfer buffer at non-origin stops).
4. **Track earliest arrival** at every stop, plus which connection delivered us there.
5. **Reconstruct path** from destination back to origin using the predecessor chain.
6. **Cheapest route** uses a parallel scan that tracks cumulative fare instead of earliest arrival.

### Database Layer (app/database/)

- `connection.py` – singleton SQLite connection with WAL mode
- `init_db.py` – creates `saved_routes` table if not exists

### Data Layer (app/data/)

CSV files loaded at startup: `stops.csv`, `routes.csv`, `trips.csv`, `stop_times.csv`, `fares.csv`, `occupancy.csv`.

## Key Design Decisions

| Decision                          | Rationale                                              |
|-----------------------------------|--------------------------------------------------------|
| Monorepo structure                | Simplest for a 4-person team; one git repo             |
| CSVs for transport data           | Easy to inspect, edit, version-control                 |
| SQLite for persistence            | Zero setup, built into Python, sufficient for V1       |
| `init()` dependency injection     | Avoids circular imports, keeps modules testable        |
| Deterministic fleet simulation    | Reproducible results, no randomness to debug           |
| Rule-based, transit-grounded chat with optional Grok wording | Route and schedule facts stay deterministic; Grok is optional |
| Vite proxy in dev                 | Eliminates CORS issues during development              |
| Tailwind CSS v4                   | Utility-first, no custom CSS files needed              |

## Security Considerations

- API keys in `.env` (gitignored), `.env.example` has no real secrets
- Parameterized SQL queries (no string interpolation)
- Input validation via Pydantic models
- CORS restricted to known frontend origins
- No authentication in V1 (prototype scope)
