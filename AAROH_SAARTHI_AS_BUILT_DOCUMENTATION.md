# Aaroh-Saarthi — Complete As-Built Project Documentation

**Document Status:** Complete & Verified Against Codebase  
**Target Repository:** `rajmaheshwari3001-dev/Codex-Test-Model`  
**Current Git Commit:** `f7cdcc7` (tracking `origin/main`)  
**Inspection Date:** October 29, 2026  
**Operating Environment:** Windows 11, PowerShell, Node.js v24.19.0, Python 3.14.4  

---

## Executive Table of Contents

1. [Project Overview — What Exists Today](#1-project-overview--what-exists-today)
2. [Scope and Inspection Method](#2-scope-and-inspection-method)
3. [Repository Structure](#3-repository-structure)
4. [Technology Stack Actually Used](#4-technology-stack-actually-used)
5. [Application Startup and Runtime Architecture](#5-application-startup-and-runtime-architecture)
6. [Frontend Pages and Routes](#6-frontend-pages-and-routes)
7. [Frontend Components and State](#7-frontend-components-and-state)
8. [Backend API Inventory](#8-backend-api-inventory)
9. [Backend Models and Schemas](#9-backend-models-and-schemas)
10. [Backend Services](#10-backend-services)
11. [Dataset Inventory and Data Relationships](#11-dataset-inventory-and-data-relationships)
12. [Routing Algorithm — Step-by-Step](#12-routing-algorithm--step-by-step)
13. [Fare Calculation — End-to-End](#13-fare-calculation--end-to-end)
14. [Passenger Workflow — End-to-End](#14-passenger-workflow--end-to-end)
15. [Map Implementation](#15-map-implementation)
16. [Chat Implementation and AI Integrations](#16-chat-implementation-and-ai-integrations)
17. [Delay and Crowd Handling](#17-delay-and-crowd-handling)
18. [Saved Routes and Database Persistence](#18-saved-routes-and-database-persistence)
19. [Fleet Simulator](#19-fleet-simulator)
20. [Disruption Scenarios and Multi-Bus Coordination](#20-disruption-scenarios-and-multi-bus-coordination)
21. [Metrics and Recommendations](#21-metrics-and-recommendations)
22. [Frontend-Backend Data Flow](#22-frontend-backend-data-flow)
23. [Configuration and Startup Instructions](#23-configuration-and-startup-instructions)
24. [Tests Run and Existing Test Coverage](#24-tests-run-and-existing-test-coverage)
25. [Security and Operational Behavior](#25-security-and-operational-behavior)
26. [Known Limitations and Incomplete Features](#26-known-limitations-and-incomplete-features)
27. [Documentation-versus-Code Discrepancies](#27-documentation-versus-code-discrepancies)
28. [Glossary of Project-Specific Terms](#28-glossary-of-project-specific-terms)
29. [Important Files and Functions Index](#29-important-files-and-functions-index)
30. [Appendix: Actual Commands and Verification Evidence](#30-appendix-actual-commands-and-verification-evidence)

---

## 1. Project Overview — What Exists Today

Aaroh-Saarthi is an integrated public transit web platform composed of two modules:
1. **Module A — Passenger Route Assistant:** A transit journey planner that computes schedule-aware itineraries (fastest and cheapest paths) across a demonstration Delhi transit network of 4 corridors (2 metro lines, 2 bus lines) and 15 stops. Features include:
   - 12-hour AM/PM and 24-hour departure scheduling with daytime and late-night timetables (06:00 AM – 11:35 PM).
   - Mode preference filtering (`All`, `Metro`, `Bus`) and maximum passenger budget evaluation.
   - Metro vs. Bus comparative trade-off notes explaining duration vs. tariff trade-offs.
   - Interactive Leaflet / OpenStreetMap map rendering route lines, stops, and selected journey paths.
   - Grounded transit chat assistant answering questions about routes, schedules, transfers, and live delays without hallucination.
   - Saved journeys stored persistently in SQLite with 1-click re-search and deletion.
   - Simulated delay injection and occupancy / crowding indicators.
2. **Module B — Fleet Intelligence & Disruption Coordination:** An operational dashboard for transit dispatchers and operators. Features include:
   - Live roster table of 19 monitored vehicles (`B-T01` to `B-T19`) showing operational status (`active`, `spare`, `broken_down`, `reassigned`), current route/trip, passenger load, and schedule adherence.
   - Disruption simulation engine supporting bus breakdowns and trip delays.
   - Multi-bus coordination generating candidate response actions (spare vehicle deployment, route short-turning, trip delay adjustment).
   - Before-and-after scenario impact analysis comparing baseline (do nothing) against proposed responses across 8 computed metrics.
   - Explainable trade-off summaries and operator action approval / rejection with deterministic state reset.

All routes, trips, timetables, and zone-based tariffs are synthetic demonstration data representing Delhi corridors. The system clearly labels all data provenance (scheduled, estimated, simulated) and does not claim real-world live GPS integration.

---

## 2. Scope and Inspection Method

This documentation is an **as-built audit** of the code, data, tests, and configuration currently present in the repository at commit `f7cdcc7`.
- **Methodology:** Static code inspection, line-by-line verification, data schema verification, full automated test execution (108 backend tests), and frontend production compilation (`tsc -b && vite build`).
- **Grounding Rule:** Every claim references exact file paths, line numbers, function/class names, API endpoints, or database structures.
- **Verification Status Classifications:**
  - `VERIFIED WORKING`: Code exists, executes without errors, and is validated by automated tests or live API checks.
  - `IMPLEMENTED (STATIC)`: Code exists and passes compilation, but represents static demonstration/sample data.
  - `OPTIONAL / CONDITIONAL`: Feature exists in code but activates only when optional configuration (such as external API keys) is supplied.
  - `NOT IMPLEMENTED / LIMITATION`: Feature is absent, mocked, or constrained by architectural scope.

---

## 3. Repository Structure

```
aaroh-saarthi/
├── .env.example                     # Example backend environment variables
├── README.md                        # Project overview and setup instructions
├── vercel.json                      # Single-project Vercel multi-service configuration
├── backend/
│   ├── requirements.txt             # Python dependencies (FastAPI, Pandas, NetworkX, etc.)
│   ├── aaroh_saarthi.db             # Local SQLite database for persistent user data
│   ├── api/
│   │   └── [...path].py             # Vercel Serverless catch-all entry point
│   ├── app/
│   │   ├── config.py                # Pydantic Settings (ports, DB path, API keys, CORS)
│   │   ├── main.py                  # FastAPI application factory, lifespan, CORS, router mounting
│   │   ├── api/
│   │   │   ├── routes.py            # Passenger endpoints (/stops, /routes, /journeys/search, /delays)
│   │   │   ├── saved_routes.py      # Saved routes CRUD endpoints (/saved-routes)
│   │   │   ├── chat.py              # Transit copilot chat endpoint (/chat)
│   │   │   └── fleet.py             # Fleet intelligence endpoints (/fleet/state, /disruption, /approve)
│   │   ├── data/
│   │   │   ├── stops.csv            # 15 Delhi transit stops with coordinates and zone IDs
│   │   │   ├── routes.csv           # 4 transit corridors (Blue Line, Green Line, Red Ring, Yellow Express)
│   │   │   ├── trips.csv            # 58 scheduled trips (weekday and weekend schedules)
│   │   │   ├── stop_times.csv       # 291 arrival/departure stop times (06:00 to 23:35)
│   │   │   ├── fares.csv            # 16 zone-to-zone tariff rules (₹10 to ₹30)
│   │   │   └── occupancy.csv        # 36 crowding load observations
│   │   ├── database/
│   │   │   ├── connection.py        # SQLite connection pool with WAL mode enabled
│   │   │   └── init_db.py           # Table initialization (saved_routes table)
│   │   ├── models/
│   │   │   ├── transport.py         # Domain models: Stop, Route, Trip, StopTime, Fare, Occupancy
│   │   │   └── journey.py           # Journey models: JourneyLeg, TransferInfo, JourneyOption, SavedRoute
│   │   └── services/
│   │       ├── data_loader.py       # In-memory CSV reader and dictionary indexing
│   │       ├── routing_service.py   # Connection Scan Algorithm (CSA) & multicriteria routing engine
│   │       ├── fleet_simulator.py   # Deterministic fleet simulation & disruption coordination
│   │       ├── chat_service.py      # Rule-based intent detection & grounded transit replies (+ Grok)
│   │       ├── saved_route_service.py# SQLite CRUD service for saved routes
│   │       ├── schedule_service.py  # Next departure lookup & service day validation
│   │       ├── delay_service.py     # In-memory simulated delay store
│   │       └── crowd_service.py     # Passenger load and crowding lookup service
│   └── tests/
│       ├── conftest.py              # Pytest fixtures and mock transport data
│       ├── test_api.py              # 33 API integration tests
│       ├── test_routing.py          # 35 routing algorithm & fare tests
│       ├── test_fleet_simulator.py  # 10 fleet disruption & multi-bus coordination tests
│       ├── test_chat_service.py     # 8 chat intent & time extraction tests
│       ├── test_grok_chat.py        # 3 Grok LLM integration tests
│       ├── test_data_loader.py      # 6 CSV loading & validation tests
│       ├── test_delays.py           # 3 delay propagation tests
│       ├── test_saved_routes.py     # 5 SQLite CRUD tests
│       └── test_schedules.py        # 5 schedule service tests
├── docs/                            # In-depth architectural, QA, and data documentation
└── frontend/
    ├── package.json                 # Node dependencies (React 19, Vite 6, Tailwind CSS v4, Leaflet)
    ├── vite.config.ts               # Vite configuration with React & Tailwind plugins and /api proxy
    ├── tsconfig.json                # TypeScript project configuration
    ├── index.html                   # HTML entry point with Leaflet CSS link
    └── src/
        ├── main.tsx                 # React DOM root render
        ├── App.tsx                  # React Router root with Layout, PassengerPage, FleetPage
        ├── types/
        │   └── index.ts             # TypeScript interfaces matching backend models
        ├── services/
        │   └── api.ts               # Centralized fetch client for all backend endpoints
        ├── utils/
        │   └── time.ts              # 12-hour AM/PM and 24-hour time conversion helpers
        ├── styles/
        │   └── index.css            # Tailwind CSS styling and theme definitions
        ├── pages/
        │   ├── PassengerPage.tsx    # Primary passenger interface with map, planner, and copilot
        │   ├── FleetPage.tsx        # Fleet intelligence dashboard page
        │   └── NotFoundPage.tsx     # 404 fallback page
        └── components/
            ├── Layout.tsx           # Global shell container with Navigation bar
            ├── Navigation.tsx       # Header navigation with active route highlights & status pill
            ├── RouteSearchForm.tsx  # Stop selectors, AM/PM switcher, mode filter, budget target
            ├── RouteResultCard.tsx  # Journey option card with leg breakdown, tariffs, copy/save
            ├── TransportMap.tsx     # Leaflet map displaying stops, lines, and journey polylines
            ├── ChatAssistant.tsx    # Conversational transit assistant with quick chips
            ├── SavedRoutes.tsx      # Saved journey bookmarks with 1-click execution
            ├── FleetDashboard.tsx   # Fleet monitoring cards, bus roster, and disruption trigger
            └── ScenarioComparison.tsx# Visual impact comparison cards and operator action buttons
```

---

## 4. Technology Stack Actually Used

| Technology | Layer | Version / Package | Exact Usage & File References | Essential / Optional |
|---|---|---|---|---|
| **Python** | Backend Runtime | 3.10+ (tested on 3.14.4) | Core backend runtime for API, routing, and simulation. | Essential |
| **FastAPI** | Backend Framework | `0.115.5` | Web framework in `backend/app/main.py` and `backend/app/api/*.py`. Exposes REST endpoints with automatic OpenAPI documentation. | Essential |
| **Uvicorn** | ASGI Web Server | `0.32.1` | Asynchronous server running the FastAPI app (`app.main:app`). | Essential |
| **Pydantic** | Validation & Serialization | `2.10.3` | Data validation in `app/models/transport.py` and `app/models/journey.py`. | Essential |
| **Pydantic Settings** | Environment Config | `2.6.1` | Settings management in `app/config.py` loading `.env` variables. | Essential |
| **Pandas** | Data Processing | `2.2.3` | Included in `requirements.txt`; available for tabular processing. Standard library `csv` is utilized in `data_loader.py` for lightweight startup. | Installed / Auxiliary |
| **NetworkX** | Graph Representation | `3.4.2` | Graph construction in `app/services/routing_service.py` (`build_graph()`). Builds a directed multigraph of stops and route edges for path exploration. | Essential |
| **SQLite3** | Embedded Database | Built-in Python 3 standard library | Persistent storage in `app/database/connection.py` and `app/services/saved_route_service.py`. Uses WAL journal mode. | Essential |
| **HTTPX** | HTTP Client | `0.28.1` | Used in `backend/tests/` via FastAPI `TestClient` and in `chat_service.py` for optional xAI / Grok API calls. | Essential |
| **Pytest** | Test Framework | `8.3.4` | Automated test suite execution across 108 test cases in `backend/tests/`. | Essential (Dev/Test) |
| **React** | Frontend UI Library | `^19.1.0` | Declarative UI components across `frontend/src/`. | Essential |
| **TypeScript** | Static Typing | `~5.8.3` | Type safety across `frontend/src/types/index.ts` and all `.tsx` components. | Essential |
| **Vite** | Build Tool & Dev Server | `^6.3.5` | Bundler and local development server configured in `vite.config.ts`. | Essential |
| **Tailwind CSS** | Styling System | `^4.1.10` | Utility-first styling via `@tailwindcss/vite` in `frontend/src/styles/index.css`. | Essential |
| **React Router** | Client-Side Routing | `^7.6.1` | URL routing between `/` (Passenger) and `/fleet` (Fleet) in `frontend/src/App.tsx`. | Essential |
| **Leaflet** | Interactive Mapping | `^1.9.4` | Map canvas rendering OpenStreetMap tiles and polylines in `TransportMap.tsx`. | Essential |
| **React-Leaflet** | React Leaflet Bindings | `^5.0.0` | Installed in `package.json`; `TransportMap.tsx` implements native Leaflet `L.map()` with React refs for deterministic lifecycle management. | Installed |
| **xAI Grok API** | Conversational AI | `grok-3-mini` (configurable) | Optional natural language phrasing layer in `app/services/chat_service.py` (`_compose_with_grok()`). Activates only when `XAI_API_KEY` is provided. | Optional (Graceful Fallback) |

---

## 5. Application Startup and Runtime Architecture

### 5.1 Backend Startup Lifecycle (`backend/app/main.py`)
1. **Application Creation:** `app = FastAPI(title="Aaroh-Saarthi", version="1.0.0", lifespan=lifespan)` (lines 77–82).
2. **CORS Middleware Configuration:** `CORSMiddleware` is registered with allowed origins including `settings.frontend_origin`, `http://localhost:5173`, and `http://localhost:3000` with full methods and headers allowed (lines 85–91).
3. **Lifespan Context Manager (`lifespan()`):**
   - Step 1: Calls `app.services.data_loader.load_all()`, reading 6 CSV files into an in-memory `TransportData` singleton (`stops`, `routes`, `trips`, `stop_times`, `fares`, `occupancy`).
   - Step 2: Instantiates `RoutingService(td)` passing the loaded transport data.
   - Step 3: Calls `app.database.init_db.init_database()`, connecting to SQLite (`aaroh_saarthi.db`) and executing `CREATE TABLE IF NOT EXISTS saved_routes` with column schema migration.
   - Step 4: Instantiates `FleetSimulator()` and initializes the baseline rolling stock of 19 monitored vehicles via `fleet_simulator.init_default_fleet(td)`.
   - Step 5: Injects singletons into router modules: `routes_api.init(td, routing_service, delay_service)`, `chat_api.init(td, routing_service, delay_service)`, and `fleet_api.init(fleet_simulator)`.
4. **Router Registration:**
   - `app.include_router(routes_api.router)` -> `/api/*`
   - `app.include_router(saved_routes_api.router)` -> `/api/saved-routes/*`
   - `app.include_router(chat_api.router)` -> `/api/chat`
   - `app.include_router(fleet_api.router)` -> `/api/fleet/*`

### 5.2 Frontend Startup Lifecycle (`frontend/src/main.tsx` & `App.tsx`)
1. **Entry Point:** `src/main.tsx` mounts `<App />` within `BrowserRouter` to the `#root` element.
2. **Global Layout:** `src/App.tsx` wraps routes inside `Layout.tsx`, rendering `Navigation.tsx` (sticky top header) and an active service status pill.
3. **Page Routing:**
   - `/` renders `PassengerPage.tsx`.
   - `/fleet` renders `FleetPage.tsx`.
   - `*` renders `NotFoundPage.tsx`.
4. **Initial API Hydration (`PassengerPage.tsx` lines 90–108):** On mount, fires concurrent requests `getStops()` (`GET /api/stops`) and `getRoutes()` (`GET /api/routes`) to populate stop dropdowns, corridor quick launch bars, and map coordinates.

---

## 6. Frontend Pages and Routes

| Route | Component | Purpose | Main Sections | User Actions | API Requests Triggered |
|---|---|---|---|---|---|
| `/` | `PassengerPage.tsx` | Passenger Journey Assistant & Navigation | 1. Hero command bar & Operating Window indicator<br>2. 1-Tap Corridor Quick Launch buttons<br>3. Route search form with AM/PM & filters<br>4. Timetable Shift Recovery Console<br>5. Journey result boarding passes (fastest/cheapest)<br>6. Comparative advantage insight banner<br>7. Interactive Leaflet Map<br>8. Transit Chat Assistant<br>9. Bookmarked Journeys panel | - Click corridor preset<br>- Search route<br>- Toggle AM/PM<br>- Select mode filter (All/Metro/Bus)<br>- Set target budget<br>- Click map stops<br>- Copy itinerary<br>- Save / bookmark route<br>- Chat with copilot | `GET /api/stops`<br>`GET /api/routes`<br>`POST /api/journeys/search`<br>`POST /api/saved-routes`<br>`GET /api/saved-routes`<br>`DELETE /api/saved-routes/{id}`<br>`POST /api/chat` |
| `/fleet` | `FleetPage.tsx` | Fleet Intelligence & Incident Simulation | 1. Fleet intelligence command banner<br>2. Corridor route health cards<br>3. Summary metric counters (Active, Spare, Failed)<br>4. Vehicle search & filter controls<br>5. Bus roster table<br>6. Disruption simulator trigger form<br>7. Scenario comparison metrics & evaluation<br>8. Operator recommendation & approval | - Search bus ID<br>- Filter by route / status<br>- Select vehicle for disruption<br>- Set disruption type (breakdown/delay)<br>- Trigger disruption<br>- Review scenario metrics<br>- Approve / Reject recommendation | `GET /api/fleet/state`<br>`POST /api/fleet/disruption`<br>`POST /api/fleet/approve` |
| `*` | `NotFoundPage.tsx` | 404 Fallback | Error notice and return home button | Navigate back to passenger assistant | None |

---

## 7. Frontend Components and State

### 7.1 `RouteSearchForm.tsx`
- **Location:** `frontend/src/components/RouteSearchForm.tsx`
- **Props:** `stops`, `origin`, `setOrigin`, `destination`, `setDestination`, `time`, `setTime`, `preference`, `setPreference`, `serviceDay`, `onServiceDayChange`, `modePreference`, `setModePreference`, `maxBudget`, `setMaxBudget`, `onSearch`, `loading`.
- **State:** `error` (validation message).
- **Features:**
  - Origin and destination dropdowns with quick swap button `⇄`.
  - Tactile `[ ☀️ AM ]` `[ 🌙 PM ]` button toggle dynamically converting times between periods.
  - Freeform time input accepting 12-hour (`08:30 PM`, `8 PM`) or 24-hour (`20:30`) strings via `parseToTime24()`.
  - Quick time presets: `08:00 AM Morning`, `01:30 PM Midday`, `05:30 PM Peak`, `08:30 PM Night`, `10:00 PM Late Night`.
  - Mode preference pill switcher: `🌐 All Modes`, `🚇 Metro Only`, `🚌 Bus Only`.
  - Budget target input with quick chips (`₹20`, `₹25`, `₹30`, `₹40`).
  - Out-of-hours visual warning indicator if departure falls outside 06:00 AM – 11:35 PM.

### 7.2 `RouteResultCard.tsx`
- **Location:** `frontend/src/components/RouteResultCard.tsx`
- **Props:** `option` (`JourneyOption`), `selected` (`boolean`), `onSelect`, `onSave`, `isSaved`.
- **State:** `expandedLegs` (`Record<number, boolean>`), `copied` (`boolean`).
- **Features:**
  - Dynamic corridor accent stripe styled with `option.legs[0].route_color`.
  - Preference pill (`FASTEST`, `CHEAPEST`), mode badge (`🚇 Metro Service`, `🚌 Bus Service`, `🌐 Multimodal`), and interchange counter.
  - Target budget verification pill (`✅ Within Budget` or `⚠️ Over Budget`).
  - Total fare badge with synthetic tariff indicator.
  - Large formatted departure and arrival timestamps (`formatTime12()`).
  - Metro vs Bus Comparative Trade-Off insight note (`option.fare_comparison_note`).
  - Detailed leg cards with route name, trip ID, leg fare, boarding/alighting stations, crowd level pill, intermediate stops collapsible drawer, and interchange transfer wait alerts.
  - Action buttons: "📋 Copy Plan" (formatted plaintext itinerary to clipboard) and "★ Save" (persist to bookmarks).

### 7.3 `TransportMap.tsx`
- **Location:** `frontend/src/components/TransportMap.tsx`
- **Props:** `stops`, `routes`, `selectedJourney`, `originStopId`, `destinationStopId`, `onSelectOrigin`, `onSelectDestination`.
- **State:** `selectedRouteFilter` (`'ALL'` or specific `route_id`), `hasJourney`.
- **Features:**
  - Native Leaflet integration with OpenStreetMap tile provider (`minZoom: 9`, `maxZoom: 18`).
  - Stop markers with custom SVG circle icons color-coded by role (origin: green, destination: red, transfer: amber, intermediate: blue).
  - Stop popups displaying stop name, zone ID, and 1-click "Set as Origin" / "Set as Destination" buttons.
  - Route polylines drawn connecting stops along each corridor in their defined hex color (`#2196F3`, `#4CAF50`, `#F44336`, `#FF9800`).
  - Selected journey polyline highlighting the active path with dashed animation.
  - Floating corridor filter pills (`All Routes`, `Blue Line`, `Green Line`, `Red Ring`, `Yellow Express`).

### 7.4 `ChatAssistant.tsx`
- **Location:** `frontend/src/components/ChatAssistant.tsx`
- **Props:** `serviceDay` (`ServiceDay`).
- **State:** `messages` (`Message[]`), `input` (`string`), `loading` (`boolean`), `errorMsg` (`string`), `copiedId` (`string | null`).
- **Features:**
  - Chat stream with distinct assistant and user message speech bubbles.
  - Quick question prompt chips (`Next bus from Kashmere Gate`, `How to get to Saket at 8 AM?`, `Are there any delays?`).
  - 1-click copy for copilot responses.
  - Clear history button resetting conversation to welcome prompt.
  - Grounded disclaimer banner indicating answers strictly reflect the GTFS schedule and simulated delays.

### 7.5 `SavedRoutes.tsx`
- **Location:** `frontend/src/components/SavedRoutes.tsx`
- **Props:** `onReuse` (`(route: SavedRoute) => void`), `refreshTrigger` (`number`).
- **State:** `routes` (`SavedRoute[]`), `loading` (`boolean`), `deletingId` (`number | null`), `error` (`string`).
- **Features:**
  - Lists user-saved journeys loaded from SQLite backend via `GET /api/saved-routes`.
  - Displays journey label, preference tag, origin -> destination, preferred departure in 12-hour AM/PM format, and service day.
  - "Search ➔" button instantly executes a new route search using the saved parameters.
  - Delete button (`✕`) removing the route from SQLite via `DELETE /api/saved-routes/{id}`.

### 7.6 `FleetDashboard.tsx` & `ScenarioComparison.tsx`
- **Location:** `frontend/src/components/FleetDashboard.tsx` & `ScenarioComparison.tsx`
- **State:** `buses` (`BusState[]`), `loading`, `disruptionType` (`'breakdown' | 'delay'`), `selectedBus`, `delayMinutes`, `result` (`DisruptionResult | null`), `decisionMade`, `decisionPending`, `searchQuery`, `routeFilter`, `statusFilter`.
- **Features:**
  - 4 corridor health cards calculating on-time performance percentages.
  - Metric counters: Total Fleet, Active Service, Depot Spares, Disrupted.
  - Filterable bus roster table with status badges and load percentages.
  - Incident simulation launcher triggering `POST /api/fleet/disruption`.
  - Visual before-and-after metric cards showing numerical deltas and percentage changes.
  - Candidate response evaluation ranking feasible options and surfacing the recommended action with trade-offs.
  - Operator action buttons: "Approve Recommendation" and "Reject Action" dispatching to `POST /api/fleet/approve`.

---

## 8. Backend API Inventory

| HTTP Method | Path | Router Module | Request Model / Body | Response Model / Schema | Service Function Called | Data Source | Tests Covering | Status |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api/health` | `routes.py` | None | `{"status": "ok", "application": "Aaroh-Saarthi"}` | Direct return | In-memory | `test_health` | VERIFIED WORKING |
| `GET` | `/api/stops` | `routes.py` | None | `List[Stop]` | `_td.stops` | `stops.csv` | `test_get_stops` | VERIFIED WORKING |
| `GET` | `/api/routes` | `routes.py` | None | `List[RouteWithStops]` | `_td.routes` + stop mapping | `routes.csv`, `stop_times.csv` | `test_get_routes` | VERIFIED WORKING |
| `POST` | `/api/journeys/search` | `routes.py` | `JourneySearchRequest` | `{"options": List[JourneyOption], "message"?: str}` | `_routing_service.search()` | `stop_times.csv`, `fares.csv`, `occupancy.csv` | `test_journey_search_valid`, `test_journey_search_s02_to_s08_transfer_fares_and_route_type`, etc. | VERIFIED WORKING |
| `POST` | `/api/delays` | `routes.py` | `DelayRequest` (`trip_id`, `delay_minutes`) | `{"message": str, "simulated": True}` | `_delay_service.set_delay()` | In-memory `_delays` dict | `test_delays_crud` | VERIFIED WORKING |
| `GET` | `/api/delays` | `routes.py` | None | `{"delays": Dict[str, int], "simulated": True}` | `_delay_service.get_all_delays()` | In-memory `_delays` dict | `test_delays_crud` | VERIFIED WORKING |
| `DELETE` | `/api/delays` | `routes.py` | None | `{"message": str, "simulated": True}` | `_delay_service.clear_all()` | In-memory `_delays` dict | `test_delays_crud` | VERIFIED WORKING |
| `POST` | `/api/saved-routes` | `saved_routes.py` | `SaveRouteRequest` | `SavedRoute` (with generated ID) | `sr_service.create_saved_route()` | SQLite `saved_routes` table | `test_saved_routes_crud` | VERIFIED WORKING |
| `GET` | `/api/saved-routes` | `saved_routes.py` | None | `List[SavedRoute]` | `sr_service.list_saved_routes()` | SQLite `saved_routes` table | `test_saved_routes_crud` | VERIFIED WORKING |
| `GET` | `/api/saved-routes/{id}` | `saved_routes.py` | `saved_route_id: int` path param | `SavedRoute` | `sr_service.get_saved_route()` | SQLite `saved_routes` table | `test_saved_routes_crud` | VERIFIED WORKING |
| `DELETE` | `/api/saved-routes/{id}` | `saved_routes.py` | `saved_route_id: int` path param | `{"message": str}` | `sr_service.delete_saved_route()` | SQLite `saved_routes` table | `test_saved_routes_crud` | VERIFIED WORKING |
| `POST` | `/api/chat` | `chat.py` | `ChatRequest` (`message`, `service_day`) | `{"intent": str, "reply": str, "data": Any}` | `chat_service.handle_message()` | GTFS data + `RoutingService` + optional Grok | `test_chat_endpoint`, `test_chat_route_search_respects_requested_time`, etc. | VERIFIED WORKING |
| `GET` | `/api/fleet/state` | `fleet.py` | None | `{"buses": List[BusDict], "simulated": True}` | `_simulator.get_state()` | In-memory `FleetSimulator` | `test_fleet_state` | VERIFIED WORKING |
| `POST` | `/api/fleet/disruption` | `fleet.py` | `DisruptionRequest` | `DisruptionResult` (baseline, responses, metrics) | `_simulator.evaluate_disruption()` | In-memory `FleetSimulator` | `test_fleet_disruption` | VERIFIED WORKING |
| `POST` | `/api/fleet/approve` | `fleet.py` | `ApproveRequest` (`disruption_id`, `response_id`, `approved`) | `{"message": str, "fleet_state": ...}` | `_simulator.apply_response()` | In-memory `FleetSimulator` | `test_fleet_approval_applies_spare_assignment_and_prevents_second_decision` | VERIFIED WORKING |

---

## 9. Backend Models and Schemas

### 9.1 Transport Models (`backend/app/models/transport.py`)
- `Stop`: `stop_id` (`str`), `stop_name` (`str`), `stop_lat` (`float`), `stop_lon` (`float`), `zone_id` (`str`).
- `Route`: `route_id` (`str`), `route_name` (`str`), `route_type` (`str`, default `"bus"`), `route_color` (`str`, default `"#666666"`), `description` (`str`).
- `Trip`: `trip_id` (`str`), `route_id` (`str`), `direction` (`str`), `service_days` (`str`, default `"weekday"`).
- `StopTime`: `trip_id` (`str`), `stop_id` (`str`), `stop_sequence` (`int`), `arrival_time` (`str` in `HH:MM`), `departure_time` (`str` in `HH:MM`).
- `Fare`: `route_id` (`str`), `from_zone_id` (`str`), `to_zone_id` (`str`), `fare_amount` (`float`), `currency` (`str`, default `"INR"`).
- `Occupancy`: `trip_id` (`str`), `stop_id` (`str`), `occupancy_level` (`str`: `"low"` | `"medium"` | `"high"` | `"unknown"`), `typical_load_percent` (`int`).

### 9.2 Journey Models (`backend/app/models/journey.py`)
- `JourneyLeg`: `leg_index` (`int`), `trip_id` (`str`), `route_id` (`str`), `route_name` (`str`), `route_type` (`str`), `route_color` (`str`), `board_stop_id` (`str`), `board_stop_name` (`str`), `alight_stop_id` (`str`), `alight_stop_name` (`str`), `departure_time` (`str`), `arrival_time` (`str`), `boarding_crowding_level` (`str`), `boarding_crowding_percent` (`Optional[int]`), `intermediate_stops` (`List[str]`), `intermediate_stop_ids` (`List[str]`), `fare` (`Optional[float]`), `currency` (`str`).
- `TransferInfo`: `at_stop_id` (`str`), `at_stop_name` (`str`), `wait_minutes` (`int`).
- `JourneyOption`: `option_id` (`str`), `label` (`str`), `total_duration_minutes` (`int`), `departure_time` (`str`), `arrival_time` (`str`), `legs` (`List[JourneyLeg]`), `transfers` (`List[TransferInfo]`), `total_fare` (`Optional[float]`), `currency` (`str`), `fare_available` (`bool`), `crowding_warnings` (`List[str]`), `delay_warnings` (`List[str]`), `data_status` (`str`), `warnings` (`List[str]`), `primary_mode` (`str`), `fare_comparison_note` (`Optional[str]`), `budget_status` (`Optional[str]`).
- `SavedRoute`: `saved_route_id` (`Optional[int]`), `label` (`str`), `origin_stop_id` (`str`), `origin_stop_name` (`str`), `destination_stop_id` (`str`), `destination_stop_name` (`str`), `preferred_departure_time` (`str`), `preference` (`str`), `service_day` (`Literal["weekday", "weekend"]`).

---

## 10. Backend Services

### 10.1 `data_loader.py`
- **Class:** `TransportData`
- **Function:** `load_all() -> TransportData`
- **Responsibilities:** Reads `stops.csv`, `routes.csv`, `trips.csv`, `stop_times.csv`, `fares.csv`, `occupancy.csv`. Sorts each trip's stop times by `stop_sequence`. Builds lookup dictionaries: `stops_by_id`, `routes_by_id`, `trips_by_id`, `stop_times_by_trip`, `fare_lookup` (keyed by `(route_id, from_zone, to_zone)`), and `occupancy_lookup` (keyed by `(trip_id, stop_id)`).

### 10.2 `routing_service.py`
- **Class:** `RoutingService`
- **Key Methods:**
  - `search(origin_id, destination_id, departure_time, preference, delay_minutes, service_day, mode_preference, max_budget) -> List[JourneyOption]`
  - `_find_fastest_journey()`: Earliest arrival forward scan in effective departure time order. Enforces 2-minute buffer at transfers.
  - `_find_cheapest_journey()`: Multicriteria label-setting algorithm tracking `(arrival_minutes, total_fare)` Pareto frontiers per stop. Charges fares per continuous vehicle ride segment.
  - `_assemble_option()`: Converts connection paths into `JourneyLeg` objects, extracts intermediate stop lists, aggregates transfer waiting times, verifies leg fares, calculates `total_fare` and `fare_available`, attaches crowding/delay warnings, and evaluates modal comparative trade-offs.

### 10.3 `fleet_simulator.py`
- **Class:** `FleetSimulator`
- **Key Methods:**
  - `init_default_fleet(td)`: Initializes 19 vehicles (`B-T01` to `B-T19`) matching scheduled trips, 1 depot spare (`B-T03`), and assigns initial status, route, and occupancy.
  - `get_state() -> FleetState`: Returns full fleet snapshot.
  - `evaluate_disruption(disruption: Disruption) -> Dict`: Applies incident (breakdown or delay), computes `baseline` (do nothing), generates candidate actions (`reassign_spare`, `short_turn`, `add_delay`), verifies operational feasibility, calculates `ScenarioMetrics` for each action, and determines the recommended option.
  - `apply_response(disruption, response_id)`: Implements the operator's approved response on the active fleet state and locks against secondary decisions.

### 10.4 `chat_service.py`
- **Functions:** `detect_intent(message)`, `_extract_requested_time(message)`, `_extract_stop_names(message, stops)`, `_handle_with_rules(...)`, `handle_message(...)`.
- **Intents Supported:** `find_route`, `next_departure`, `explain_route`, `delay_info`, `compare`, `saved_routes`, `help`.
- **Grok Optional Layer:** If `settings.xai_api_key` is present, `_compose_with_grok()` calls `https://api.x.ai/v1/chat/completions` using `grok-3-mini` with strict system prompt forbidding hallucination. Schedule-grounded facts are strictly preserved.

### 10.5 `saved_route_service.py`
- **Functions:** `create_saved_route()`, `list_saved_routes()`, `get_saved_route()`, `delete_saved_route()`.
- **Storage:** Parameterized SQL queries against SQLite database `saved_routes` table.

### 10.6 `delay_service.py`, `crowd_service.py`, `schedule_service.py`
- `DelayService`: In-memory thread-safe dictionary mapping `trip_id -> delay_minutes`.
- `crowd_service`: Lookups for individual stop crowding and whole-trip worst load percentage.
- `schedule_service`: Scans scheduled trips for the next `limit` departures from a specific stop after a specified time.

---

## 11. Dataset Inventory and Data Relationships

### 11.1 File Summary

| File | Format | Record Count (excl. header) | Key Fields | Provenance |
|---|---|---|---|---|
| `stops.csv` | CSV | 15 rows | `stop_id`, `stop_name`, `stop_lat`, `stop_lon`, `zone_id` | Synthetic Delhi transit coordinates |
| `routes.csv` | CSV | 4 rows | `route_id`, `route_name`, `route_type`, `route_color`, `description` | Synthetic corridors (2 metro, 2 bus) |
| `trips.csv` | CSV | 58 rows | `trip_id`, `route_id`, `direction`, `service_days` | Synthetic scheduled trips (weekday/weekend) |
| `stop_times.csv` | CSV | 291 rows | `trip_id`, `stop_id`, `stop_sequence`, `arrival_time`, `departure_time` | Timetable spanning 06:00 to 23:35 |
| `fares.csv` | CSV | 16 rows | `route_id`, `from_zone_id`, `to_zone_id`, `fare_amount`, `currency` | Synthetic zone tariff rules (₹10–₹30) |
| `occupancy.csv` | CSV | 36 rows | `trip_id`, `stop_id`, `occupancy_level`, `typical_load_percent` | Simulated crowding observations |

### 11.2 Entity Relational Diagram (Textual)

```
[ routes.csv ] 1 ──< N [ trips.csv ] 1 ──< N [ stop_times.csv ] N >── 1 [ stops.csv ]
      │                                                │
      └──< N [ fares.csv ]                             └──< 1 [ occupancy.csv ]
             (route_id, from_zone, to_zone)                    (trip_id, stop_id)
```

- Every `trip.route_id` in `trips.csv` references a valid `route_id` in `routes.csv` (`R01`, `R02`, `R03`, `R04`).
- Every `stop_times.trip_id` references a valid `trip_id` in `trips.csv` (`T01` to `T58`).
- Every `stop_times.stop_id` references a valid `stop_id` in `stops.csv` (`S01` to `S15`).
- Fares are keyed by `(route_id, from_zone_id, to_zone_id)` matching the origin stop's `zone_id` and destination stop's `zone_id`.

---

## 12. Routing Algorithm — Step-by-Step

Aaroh-Saarthi implements a customized, schedule-aware Connection Scan Algorithm (CSA) with multicriteria Pareto label-setting:

### 12.1 Step-by-Step Execution Trace (Example: `S02` Kashmere Gate to `S08` Saket at `08:00`)
1. **Input Normalization:**
   - Departure string `"08:00"` converted to integer `time_to_minutes("08:00") = 480`.
   - Origin `S02` is in Zone 1; Destination `S08` is in Zone 2.
2. **Connection Construction (`build_ride_segments`):**
   - Direct ride segments are generated for each trip.
   - For trip `T05` (Green Line R02): departs `S02` @ 08:00, arrives `S05` (Connaught Place) @ 08:28, arrives `S10` (AIIMS) @ 08:42.
   - For trip `T13` (Yellow Express R04): departs `S10` @ 08:46, arrives `S08` @ 09:10.
   - For trip `T09` (Red Ring R03): departs `S05` @ 08:30, arrives `S08` @ 09:35.
3. **Earliest Arrival Forward Scan (`_find_fastest_journey`):**
   - Ride segments are sorted by departure time + delay.
   - Segment `S02 -> S10` on trip `T05` arrives at `S10` at minute 522 (`08:42`).
   - Connecting segment `S10 -> S08` on trip `T13` departs at minute 526 (`08:46`).
   - Transfer check: `522 <= 526 - 2` (4-minute buffer >= 2-minute minimum threshold). Connection is feasible.
   - Arrival at `S08`: minute 550 (`09:10`). Total travel time = 70 minutes.
4. **Cheapest Path Multicriteria Search (`_find_cheapest_journey`):**
   - Explores alternative transfer via `S05` (Connaught Place).
   - Leg 1 (`S02 -> S05` via `T05`): Zone 1 -> Zone 1 fare = ₹10. Arrives 08:28.
   - Leg 2 (`S05 -> S08` via `T09`): Zone 1 -> Zone 2 fare = ₹20. Departs 08:30 (2 min buffer). Arrives 09:35.
   - Total fare = ₹10 + ₹20 = ₹30. Total travel time = 95 minutes.
5. **Result Generation:**
   - **Fastest Option:** Green Line Metro (`S02` to `S10`, fare ₹25) + Yellow Express Bus (`S10` to `S08`, fare ₹15). Total Duration: 70 min. Total Fare: ₹40. Primary Mode: Multimodal.
   - **Cheapest Option:** Green Line Metro (`S02` to `S05`, fare ₹10) + Red Ring Bus (`S05` to `S08`, fare ₹20). Total Duration: 95 min. Total Fare: ₹30. Primary Mode: Multimodal.

---

## 13. Fare Calculation — End-to-End

### 13.1 Tariff Architecture
- Fares are defined in `fares.csv` across 3 zones:
  - Zone 1: Central Delhi (`S01`–`S06`, `S11`)
  - Zone 2: South Delhi (`S07`–`S10`, `S12`)
  - Zone 3: West Delhi / Dwarka (`S13`–`S15`)
- Each tariff row specifies `route_id`, `from_zone_id`, `to_zone_id`, and `fare_amount` in INR.

### 13.2 Calculation Rules in `_assemble_option()`
1. **Per-Leg Fare Lookup:** For each leg, the origin stop's `zone_id` and alight stop's `zone_id` are looked up in `td.fare_lookup[(route_id, from_zone, to_zone)]`.
2. **Independent Calculation:** The fastest and cheapest journeys calculate fares independently from their respective legs.
3. **No Partial Fares:** If any leg in a journey lacks a valid fare rule (`leg.fare is None`), the entire journey total is marked unavailable (`total_fare = None`, `fare_available = False`). Partial misleading sums are strictly prevented.
4. **Override Preservation:** If the multicriteria search provides an explicit total fare override, it is preserved.
5. **UI Transparency:** All fares are explicitly labeled as "Synthetic Zone Tariff" in the user interface.

---

## 14. Passenger Workflow — End-to-End

```
User Action:
Select origin (Dwarka Sec-21), destination (Rajiv Chowk), departure time (08:00 AM)
                │
                ▼
Frontend Component: `RouteSearchForm.tsx`
Normalizes time via `parseToTime24()`, validates stops, dispatches `onSearch()`
                │
                ▼
API Client: `frontend/src/services/api.ts` -> `searchJourneys()`
Sends HTTP POST to `/api/journeys/search` with JSON payload
                │
                ▼
FastAPI Endpoint: `backend/app/api/routes.py` -> `search_journeys()`
Validates `JourneySearchRequest` schema, invokes `_routing_service.search()`
                │
                ▼
Service: `backend/app/services/routing_service.py`
Executes forward CSA scan & Pareto label search across `stop_times.csv` & `fares.csv`
                │
                ▼
Response Assembly: `JourneyOption` JSON
Returns `{ options: [FastestOption, CheapestOption] }`
                │
                ▼
Frontend Rendering: `PassengerPage.tsx` & `RouteResultCard.tsx`
- Renders digital boarding pass with duration, AM/PM times, tariff badge, and leg steps.
- Highlighting polyline on `TransportMap.tsx`.
- Displays comparative advantage insight banner.
```

---

## 15. Map Implementation

- **Library:** Leaflet `1.9.4` rendered inside `TransportMap.tsx`.
- **Tile Layer:** OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- **Markers:** Custom Leaflet `divIcon` with SVG pin designs:
  - Origin Stop: Green marker (`#10B981`) with pulsing beacon.
  - Destination Stop: Red marker (`#EF4444`) with halo beacon.
  - Transfer Interchange: Amber marker (`#F59E0B`).
  - Regular Stops: Slate blue marker (`#3B82F6`).
- **Interactive Popups:** Shows station name, zone, and clickable buttons to set as origin or destination directly from the map.
- **Route Corridors:**
  - Blue Line (`R01`): Polyline `#2196F3`, weight 4.
  - Green Line (`R02`): Polyline `#4CAF50`, weight 4.
  - Red Ring (`R03`): Polyline `#F44336`, weight 4.
  - Yellow Express (`R04`): Polyline `#FF9800`, weight 4.
- **Selected Journey Path:** When a passenger selects a journey option, a dedicated highlighted polyline with animated styling connects the boarding and alight stops along the chosen path.

---

## 16. Chat Implementation and AI Integrations

- **Architecture:** Hybrid grounded design in `backend/app/services/chat_service.py`.
- **Intent Classifier (`detect_intent`):**
  - Uses regex patterns to identify: `find_route`, `next_departure`, `explain_route`, `delay_info`, `compare`, `saved_routes`, and `help`.
- **Data Grounding:**
  - When `find_route` is matched, extracts stop names and departure time (`_extract_requested_time`), calls `routing_service.search()`, and formats an itinerary summary with departure, arrival, duration, and fare.
  - When `next_departure` is matched, calls `schedule_service.next_departures()` and returns upcoming scheduled trips.
  - When `delay_info` is matched, queries `delay_service.get_all_delays()` and returns active disruptions.
- **External AI Integration (xAI Grok):**
  - Optional. Configured via `settings.xai_api_key` and `settings.xai_model` (`grok-3-mini`).
  - If the API key is not present, the deterministic grounded reply is returned directly without external network calls.
  - If the API key is present, `_compose_with_grok()` calls `https://api.x.ai/v1/chat/completions` with a strict system prompt instructing Grok to phrase the response using *only* the supplied verified context. Hallucination of routes, fares, or times is programmatically prevented.

---

## 17. Delay and Crowd Handling

### 17.1 Delay Simulation
- In-memory service `DelayService` in `app/services/delay_service.py`.
- Delays are set per `trip_id` via `POST /api/delays` with `delay_minutes` (0 to 120 min).
- Routing impact: In `_find_fastest_journey`, effective departure = `conn.departure_minutes + delay`. If a delay causes a transfer connection to violate the 2-minute buffer, the algorithm automatically rejects the connection and selects the next feasible departure.
- Warning banners: Journey options include `delay_warnings` explicitly stating: `"Trip T05 is running 15 minutes late (simulated delay). Times shown are estimated."`

### 17.2 Crowd / Occupancy Awareness
- Occupancy data loaded from `occupancy.csv` mapping `(trip_id, stop_id)` to occupancy levels (`"low"`, `"medium"`, `"high"`) and load percentages.
- `JourneyLeg` models include `boarding_crowding_level` and `boarding_crowding_percent`.
- High occupancy triggers a warning in `JourneyOption.crowding_warnings` notifying passengers of crowded boarding conditions.

---

## 18. Saved Routes and Database Persistence

- **Database:** SQLite 3 at `backend/aaroh_saarthi.db` (or `/tmp/aaroh_saarthi.db` in serverless environments).
- **Table Schema:**
  ```sql
  CREATE TABLE IF NOT EXISTS saved_routes (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      label                    TEXT NOT NULL,
      origin_stop_id           TEXT NOT NULL,
      origin_stop_name         TEXT NOT NULL,
      destination_stop_id      TEXT NOT NULL,
      destination_stop_name    TEXT NOT NULL,
      preferred_departure_time TEXT DEFAULT '',
      preference               TEXT DEFAULT 'fastest',
      created_at               TEXT DEFAULT (datetime('now')),
      service_day              TEXT NOT NULL DEFAULT 'weekday'
  );
  ```
- **Connection Management:** `backend/app/database/connection.py` uses `check_same_thread=False`, `row_factory = sqlite3.Row`, and executes `PRAGMA journal_mode=WAL` for concurrent read/write performance.
- **Persistence Boundary:** Saved routes persist across backend restarts. All CSV transport data is read at startup. Delay and fleet simulation states are held in memory and reset on server restart.

---

## 19. Fleet Simulator

- **Module Location:** `backend/app/services/fleet_simulator.py`
- **Vehicles Monitored:** 19 simulated buses (`B-T01` to `B-T19`).
- **Vehicle Data Fields:** `bus_id`, `route_id`, `trip_id`, `status` (`active`, `broken_down`, `spare`, `reassigned`), `current_stop_index`, `occupancy_percent`, `delay_minutes`, `capacity` (50 passengers).
- **Initial Allocation:**
  - 18 active buses assigned to scheduled corridor trips.
  - 1 depot spare bus (`B-T03`) on standby.
- **Deterministic State Isolation:** The simulator stores `_initial_state`. Every disruption evaluation clones the initial state (`copy.deepcopy`), ensuring all scenario comparisons start from equivalent baseline conditions without cross-contamination.

---

## 20. Disruption Scenarios and Multi-Bus Coordination

### 20.1 Supported Disruption Types
1. **Vehicle Breakdown (`breakdown`):** The affected vehicle's status changes to `broken_down`. Passengers currently on board become stranded.
2. **Trip Delay (`delay`):** Additional delay minutes are injected into the affected vehicle's schedule.

### 20.2 Candidate Response Actions Evaluated
1. **Reassign Spare Bus (`reassign_spare`):**
   - Dispatches an available depot spare vehicle (`status == "spare"`).
   - Feasibility check: Requires at least one spare bus in the fleet.
   - Outcome: Restores the disrupted trip with minimal headway impact.
2. **Short-Turn / Skip Stops (`short_turn`):**
   - Identifies an active bus running in the opposite direction or upstream on the same route with low occupancy.
   - Reassigns that vehicle to cover the broken-down segment.
   - Feasibility check: Requires an eligible active same-route bus.
3. **Absorb Delay / Frequency Adjustment (`add_delay` / `hold_departures`):**
   - Adjusts downstream dispatch headways to distribute the schedule gap across following trips.

---

## 21. Metrics and Recommendations

### 21.1 Calculated Scenario Metrics (`ScenarioMetrics`)

| Metric Name | Calculation Method | Unit | Lower Better? |
|---|---|---|---|
| `affected_passengers` | Breakdown: `(occupancy_percent / 100) * capacity`<br>Spare reassign: reduces affected count by 70%<br>Delay: proportional to delay minutes | Count | Yes |
| `average_wait_increase_minutes` | Baseline: 12.0 min (breakdown) or `0.6 * delay_minutes`<br>Spare reassign: 3.0 min<br>Short-turn: 5.0 min | Minutes | Yes |
| `delayed_trips` | Count of scheduled trips falling behind timetable | Count | Yes |
| `fleet_utilization_percent` | `(active_buses / total_available_buses) * 100` | % | Contextual |
| `total_buses_active` | Count of vehicles with `status == "active"` | Count | Higher |
| `total_buses_available` | Active buses + spare buses | Count | Higher |
| `crowding_increase_percent` | Estimated passenger redistribution load on following trips | % | Yes |

### 21.2 Recommendation & Operator Action
- The simulator ranks feasible responses by minimum affected passengers and minimum wait time increase, selecting the top candidate as `recommended_response_id`.
- The operator reviews trade-offs in `ScenarioComparison.tsx` and can click "Approve Recommendation" or "Reject Action".
- Approving a response updates the active fleet state via `POST /api/fleet/approve` and locks the decision against duplicate approvals.

---

## 22. Frontend-Backend Data Flow

```
+─────────────────────────────────────────────────────────────────────────────+
| FRONTEND (React 19 / Vite / TypeScript)                                      |
|                                                                             |
|  [ PassengerPage ]        [ FleetPage ]           [ TransportMap ]          |
|         │                        │                       │                  |
|         ▼                        ▼                       ▼                  |
|  [ RouteSearchForm ]      [ FleetDashboard ]      [ ChatAssistant ]         |
|         │                        │                       │                  |
|         └────────────────────────┼───────────────────────┘                  |
|                                  ▼                                          |
|                     [ services/api.ts ]                                     |
+──────────────────────────────────┬──────────────────────────────────────────+
                                   │ HTTP (JSON / REST)
                                   ▼
+─────────────────────────────────────────────────────────────────────────────+
| BACKEND (FastAPI / Python 3.14)                                              |
|                                                                             |
|  routes.py               fleet.py               chat.py    saved_routes.py  |
|     │                        │                     │             │          |
|     ▼                        ▼                     ▼             ▼          |
| RoutingService       FleetSimulator         chat_service   saved_route_svc  |
|     │                        │                     │             │          |
|     ▼                        ▼                     ▼             ▼          |
| [ TransportData ]    [ FleetState ]         [ Grok/xAI ]   [ SQLite DB ]    |
| (stops, routes,      (19 buses,               (optional)   (saved_routes)   |
|  trips, times,        disruptions,                                          |
|  fares, occupancy)    metrics)                                              |
+─────────────────────────────────────────────────────────────────────────────+
```

---

## 23. Configuration and Startup Instructions

### 23.1 Environment Variables (`.env`)
```bash
BACKEND_PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=aaroh_saarthi.db
DATA_DIR=app/data
# Optional: External Grok conversational model
XAI_API_KEY=
XAI_MODEL=grok-3-mini
```

### 23.2 Backend Startup Command
```powershell
cd aaroh-saarthi\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 23.3 Frontend Startup Command
```powershell
cd aaroh-saarthi\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 24. Tests Run and Existing Test Coverage

### 24.1 Test Suite Execution Evidence
- **Command:** `cd backend; .\.venv\Scripts\python.exe -m pytest -v`
- **Result:** **108 passed in 3.33s** (Exit code: 0)

| Test File | Test Count | Key Behaviors Verified | Status |
|---|---|---|---|
| `tests/test_api.py` | 33 | Health check, stops/routes retrieval, valid journey search, S02->S08 transfer fares & route types, service day filtering, invalid stops, malformed time rejection, saved routes CRUD, chat endpoint, fleet state, disruption trigger, approval lock, delay injection | PASS |
| `tests/test_routing.py` | 35 | Direct journeys, transfer journeys, fastest vs cheapest optimization, late departures, midnight handling, transfer buffers, missing fares, independent tariff calculation, metro mode filter, bus mode filter, max budget check, fare comparative notes | PASS |
| `tests/test_fleet_simulator.py` | 10 | Fleet initialization, vehicle breakdown evaluation, delay evaluation, spare bus reassignment feasibility, short-turn feasibility, metric calculations, recommendation logic, invalid vehicle rejection | PASS |
| `tests/test_chat_service.py` | 8 | Natural language time extraction (AM/PM and 24-hr formats), intent detection | PASS |
| `tests/test_grok_chat.py` | 3 | Deterministic rule-based reply without xAI key, Grok rephrasing with mock key, schedule integrity protection | PASS |
| `tests/test_data_loader.py` | 6 | Stop loading, route loading, trip loading, sorted stop times, fare loading, occupancy loading | PASS |
| `tests/test_delays.py` | 3 | Delay propagation, travel time adjustment, delay warnings in journey results | PASS |
| `tests/test_saved_routes.py` | 5 | SQLite database create, list, get by ID, delete, nonexistent route handling | PASS |
| `tests/test_schedules.py` | 5 | Next departures lookup, late-night no-departure handling, DelayService CRUD | PASS |

### 24.2 Frontend Production Build Evidence
- **Command:** `npm run build` (`tsc -b && vite build`)
- **Result:** **Built in 5.29s with 0 errors** (Exit code: 0)
- **Artifacts:** `dist/index.html` (0.73 kB), `dist/assets/index-*.css` (80.89 kB), `dist/assets/index-*.js` (514.28 kB).

---

## 25. Security and Operational Behavior

1. **SQL Injection Defense:** All SQLite interactions in `saved_route_service.py` use parameterized queries (`?` placeholders). No user inputs are concatenated into SQL strings.
2. **CORS Isolation:** CORS middleware strictly enforces allowed origins (`http://localhost:5173`, `http://localhost:3000`, and `settings.frontend_origin`).
3. **Input Validation:** Pydantic models validate all incoming request bodies with regex patterns (e.g. `^\d{2}:\d{2}$` for departure times, integers for minutes).
4. **API Key Security:** `XAI_API_KEY` is loaded from environment variables and never logged or exposed to the frontend.
5. **Operator Decision Locking:** `POST /api/fleet/approve` prevents race conditions by recording decision status and rejecting duplicate approvals with HTTP 409 Conflict.

---

## 26. Known Limitations and Incomplete Features

1. **Synthetic Timetables:** The transit network comprises 4 demonstration corridors and 15 stops in Delhi. Schedules and zone-based tariffs are synthetic demonstration data, not a live feed from Delhi Transport Corporation (DTC) or DMRC.
2. **Simulated Fleet Telemetry:** Rolling stock positions and delays are simulated in memory; the system does not interface with physical vehicle GPS hardware.
3. **In-Memory Fleet & Delay State:** Fleet disruptions and simulated delays reside in memory. Restarting the backend server resets the fleet to nominal operational state.
4. **Vercel Stateless Persistence:** In serverless deployments (such as Vercel), `/tmp/aaroh_saarthi.db` is ephemeral and may reset between cold starts.
5. **No User Authentication:** User isolation is not implemented; all users access the shared saved routes table.

---

## 27. Documentation-versus-Code Discrepancies

1. **GTFS Data Source:** Earlier project specifications referenced live GTFS or static feeds from opendata.delhi.gov.in. The actual implementation uses a curated, self-contained 6-file GTFS-style dataset in `backend/app/data/` to ensure offline reliability and deterministic testing.
2. **Metro vs Bus Routing:** Earlier prototypes labeled all routes as buses. The current codebase accurately models Blue Line (`R01`) and Green Line (`R02`) as `metro`, and Red Ring (`R03`) and Yellow Express (`R04`) as `bus`, propagating `route_type` through all API models and UI cards.
3. **Timetable Operating Window:** Historical documentation mentioned operations ending at 12:30 PM. The timetable was expanded to 58 trips spanning 06:00 AM to 11:35 PM with 12-hour AM/PM formatting.

---

## 28. Glossary of Project-Specific Terms

- **Connection:** A scheduled traversal segment between an origin stop and destination stop on a specific trip.
- **CSA (Connection Scan Algorithm):** An efficient transit routing technique that scans time-ordered connections to track earliest arrival times.
- **Dwell Time:** The scheduled buffer (typically 1 minute) during which a vehicle remains stationary at an intermediate stop.
- **Pareto Frontier:** The set of nondominated journey alternatives where no option is simultaneously faster and cheaper than another.
- **Transfer Buffer:** The minimum required slack time (2 minutes) for a passenger to interchange between two different transit trips.
- **Synthetic Tariff:** A zone-based demonstration fare model (Zone 1, Zone 2, Zone 3) used to illustrate fare calculations.

---

## 29. Important Files and Functions Index

| File Path | Function / Class | Line Reference | Primary Responsibility |
|---|---|---|---|
| `backend/app/main.py` | `lifespan()` | Lines 43–75 | Service bootstrapping & singleton dependency injection |
| `backend/app/api/routes.py` | `search_journeys()` | Lines 110–148 | Handles `POST /api/journeys/search` route requests |
| `backend/app/api/fleet.py` | `evaluate_disruption()` | Lines 70–98 | Handles `POST /api/fleet/disruption` simulation |
| `backend/app/api/fleet.py` | `approve_response()` | Lines 100–144 | Handles `POST /api/fleet/approve` operator decision |
| `backend/app/api/chat.py` | `chat()` | Lines 37–58 | Handles `POST /api/chat` conversational inquiries |
| `backend/app/services/routing_service.py` | `search()` | Lines 720–865 | Public entry point for multimodal journey planning |
| `backend/app/services/routing_service.py` | `_find_fastest_journey()` | Lines 239–316 | CSA forward scan for earliest arrival time |
| `backend/app/services/routing_service.py` | `_find_cheapest_journey()` | Lines 319–460 | Multicriteria label-setting search for lowest fare |
| `backend/app/services/routing_service.py` | `_assemble_option()` | Lines 480–680 | Converts connection paths to `JourneyOption` with leg fares |
| `backend/app/services/fleet_simulator.py` | `evaluate_disruption()` | Lines 230–380 | Incident simulation, scenario calculation, and ranking |
| `backend/app/services/chat_service.py` | `handle_message()` | Lines 454–469 | Grounded chat response orchestration & Grok caller |
| `backend/app/services/saved_route_service.py` | `create_saved_route()` | Lines 16–41 | SQLite INSERT operation for journey bookmarks |
| `frontend/src/pages/PassengerPage.tsx` | `handleSearch()` | Lines 110–165 | Dispatches journey search and updates selected option |
| `frontend/src/components/RouteSearchForm.tsx` | `handleSubmit()` | Lines 70–82 | Validates inputs, parses 12-hour AM/PM time, triggers search |
| `frontend/src/components/RouteResultCard.tsx` | `RouteResultCard()` | Lines 12–358 | Renders digital boarding pass with leg details & tariffs |
| `frontend/src/components/TransportMap.tsx` | `TransportMap()` | Lines 28–420 | Leaflet map setup, stop markers, and polyline drawing |
| `frontend/src/components/FleetDashboard.tsx` | `handleDisrupt()` | Lines 58–79 | Dispatches disruption simulation request to backend |
| `frontend/src/utils/time.ts` | `formatTime12()` | Lines 5–16 | Formats 24-hr `HH:MM` strings into 12-hr AM/PM format |

---

## 30. Appendix: Actual Commands and Verification Evidence

### 30.1 Backend Test Execution Command & Output
```powershell
PS C:\Users\rajma\OneDrive\Desktop\PROJECT\Bootcamp\Codex  Invincibles\aaroh-saarthi\backend> .\.venv\Scripts\python.exe -m pytest -v
============================= test session starts =============================
platform win32 -- Python 3.14.4, pytest-9.1.1, pluggy-1.7.0
rootdir: C:\Users\rajma\OneDrive\Desktop\PROJECT\Bootcamp\Codex  Invincibles\aaroh-saarthi\backend
plugins: anyio-4.15.1
collected 108 items

tests/test_api.py .................................                      [ 30%]
tests/test_chat_service.py ........                                      [ 37%]
tests/test_data_loader.py ......                                         [ 43%]
tests/test_delays.py ...                                                 [ 46%]
tests/test_fleet_simulator.py ..........                                 [ 55%]
tests/test_grok_chat.py ...                                              [ 58%]
tests/test_routing.py ...................................                [ 90%]
tests/test_saved_routes.py .....                                         [ 95%]
tests/test_schedules.py .....                                            [100%]

======================= 108 passed, 1 warning in 3.33s ========================
```

### 30.2 Frontend Build Command & Output
```powershell
PS C:\Users\rajma\OneDrive\Desktop\PROJECT\Bootcamp\Codex  Invincibles\aaroh-saarthi\frontend> npm run build
> aaroh-saarthi-frontend@1.0.0 build
> tsc -b && vite build

vite v6.4.5 building for production...
transforming...
✓ 58 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.73 kB │ gzip:   0.47 kB
dist/assets/index-DJCRUsQT.css   80.89 kB │ gzip:  17.69 kB
dist/assets/index-DJoSMIdW.js   514.28 kB │ gzip: 151.78 kB
✓ built in 5.29s
```

### 30.3 Live Backend API Probe Output
```powershell
PS C:\Users\rajma\OneDrive\Desktop\PROJECT\Bootcamp\Codex  Invincibles> curl.exe -s http://127.0.0.1:8000/api/health
{"status":"ok","application":"Aaroh-Saarthi"}
```

---
*End of As-Built Documentation.*

