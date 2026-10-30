# AAROH—SAARTHI: COMPLETE PROJECT MANIFEST & DIRECTORY ARCHITECTURE GUIDE

> **Authoritative Single-Source Documentation**  
> **Application:** AAROH—SAARTHI (Delhi Multimodal Transit Route Assistant & Intelligent Fleet Coordination)  
> **Repository:** `aaroh-saarthi`  
> **Revision:** 2.3.0 (Post-Cleanup & Editorial UI Standardization)  
> **Target Audience:** Software Architects, Lead Engineers, Technical Assessors, and System Administrators  

---

## 1. Executive System Overview

AAROH—SAARTHI is a production-grade, dual-module urban mobility platform engineered for the National Capital Territory of Delhi. The application merges static GTFS schedules from the Delhi Transport Stack (DTC Buses) and the Delhi Metro Rail Corporation (DMRC) with live statutory tariffs from the PoochhO (DIMTS) auto-rickshaw network to deliver:

1. **Passenger Multimodal Route Assistant:** An editorial 5-column interface delivering fastest and lowest-cost journey recommendations across metro rail, DTC buses, and last-mile auto-rickshaws, complete with interactive Leaflet cartography, fare calculation, intermediate stops, transfer wait penalties, and offline timetable heuristics.
2. **Intelligent Fleet Coordination Engine:** An operations control center for transit operators to monitor vehicle rosters, simulate dynamic route disruptions (vehicle breakdowns, corridor congestion), evaluate algorithmic mitigations via graph recalculations, and approve intervention scenarios with audit logging.

### Technology Stack Matrix
* **Backend:** Python 3.14+, FastAPI 0.115+, Uvicorn (ASGI), Pydantic v2, SQLite3 (WAL mode), BeautifulSoup4, Requests, Pytest.
* **Frontend:** React 19, TypeScript 5.7+, Vite 6, Tailwind CSS v4 (`@theme`), Leaflet 1.9+, React Router v7.
* **Cartography & Design Language:** Swiss-inspired editorial design tokens (`#F5F0E6` warm ivory background, `#FBF8F1` surface parchment, `#C49A43` muted ochre-gold, `#172D3B` deep transit navy, `#547A60` dark green, `#DAD3C6` delicate borders), DM Serif Display titles, Manrope tabular typography, and low-contrast warm map tile filters.

---

## 2. Complete Repository Directory Tree

```
aaroh-saarthi/
├── .env.example
├── .gitignore
├── AAROH_SAARTHI_AS_BUILT_DOCUMENTATION.md
├── COMPLETE_PROJECT_MANIFEST_AND_DIRECTORY_GUIDE.md  (THIS DOCUMENT)
├── README.md
├── vercel.json
│
├── backend/
│   ├── requirements.txt
│   ├── aaroh_saarthi.db
│   ├── aaroh_saarthi.db-shm
│   ├── aaroh_saarthi.db-wal
│   │
│   ├── api/
│   │   └── [...path].py
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   ├── fleet.py
│   │   │   ├── routes.py
│   │   │   └── saved_routes.py
│   │   │
│   │   ├── data/
│   │   │   ├── README.md
│   │   │   ├── fares.csv
│   │   │   ├── metadata.json
│   │   │   ├── occupancy.csv
│   │   │   ├── routes.csv
│   │   │   ├── stop_times.csv
│   │   │   ├── stops.csv
│   │   │   ├── trips.csv
│   │   │   └── raw/
│   │   │       ├── delhi_buses_gtfs.zip
│   │   │       ├── delhi_metro_gtfs.zip
│   │   │       ├── delhi_buses_gtfs/
│   │   │       │   └── 01 Delhi Buses Static_Sample/
│   │   │       │       ├── agency.txt
│   │   │       │       ├── calendar.txt
│   │   │       │       ├── feed_info.txt
│   │   │       │       ├── routes.txt
│   │   │       │       ├── shapes.txt
│   │   │       │       ├── stop_times.txt
│   │   │       │       ├── stops.txt
│   │   │       │       └── trips.txt
│   │   │       └── delhi_metro_gtfs/
│   │   │           └── 02 DMRC Static_Sample/
│   │   │               ├── agency.txt
│   │   │               ├── calendar.txt
│   │   │               ├── routes.txt
│   │   │               ├── shapes.txt
│   │   │               ├── stop_times.txt
│   │   │               ├── stops.txt
│   │   │               └── trips.txt
│   │   │
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── connection.py
│   │   │   └── init_db.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── journey.py
│   │   │   └── transport.py
│   │   │
│   │   ├── pipeline/
│   │   │   ├── __init__.py
│   │   │   ├── cli.py
│   │   │   ├── importer.py
│   │   │   ├── normalizer.py
│   │   │   └── sources/
│   │   │       ├── __init__.py
│   │   │       ├── delhi_transport_stack.py
│   │   │       ├── dmrc_scraper.py
│   │   │       ├── dtc_scraper.py
│   │   │       └── poochho_scraper.py
│   │   │
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── chat_service.py
│   │       ├── data_loader.py
│   │       ├── delays.py
│   │       ├── fleet_simulator.py
│   │       ├── grok_client.py
│   │       └── routing.py
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_api.py
│       ├── test_chat_service.py
│       ├── test_data_loader.py
│       ├── test_delays.py
│       ├── test_fleet_simulator.py
│       ├── test_grok_chat.py
│       ├── test_pipeline.py
│       ├── test_poochho.py
│       ├── test_routing.py
│       ├── test_saved_routes.py
│       └── test_schedules.py
│
├── docs/
│   ├── ACCESSIBILITY_AUDIT.md
│   ├── API_REFERENCE.md
│   ├── ARCHITECTURE.md
│   ├── BUGS_FOUND.md
│   ├── DATA_DICTIONARY.md
│   ├── KNOWN_LIMITATIONS.md
│   ├── LEARNING_GUIDE.md
│   ├── QA_TEST_PLAN.md
│   ├── QA_TEST_RESULTS.md
│   ├── RELEASE_READINESS.md
│   ├── TEAM_RESPONSIBILITIES.md
│   ├── TECHNOLOGY_GUIDE.md
│   └── TESTING_GUIDE.md
│
└── frontend/
    ├── .env.production
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vite.config.ts
    │
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── vite-env.d.ts
        │
        ├── components/
        │   ├── DataProvenanceModal.tsx
        │   ├── FleetDashboard.tsx
        │   ├── Layout.tsx
        │   ├── PoochhOEstimateCard.tsx
        │   ├── ScenarioComparison.tsx
        │   ├── Sidebar.tsx
        │   │
        │   ├── assistant/
        │   │   └── AssistantPanel.tsx
        │   │
        │   ├── journey/
        │   │   ├── CashbackPerksModal.tsx
        │   │   └── JourneyPlanner.tsx
        │   │
        │   ├── layout/
        │   │   ├── AppHeader.tsx
        │   │   └── AppShell.tsx
        │   │
        │   ├── map/
        │   │   └── DelhiMap.tsx
        │   │
        │   ├── routes/
        │   │   ├── JourneyCard.tsx
        │   │   └── JourneyComparison.tsx
        │   │
        │   └── saved/
        │       └── SavedJourneysBar.tsx
        │
        ├── pages/
        │   ├── FleetPage.tsx
        │   ├── NotFoundPage.tsx
        │   ├── PassengerPage.tsx
        │   └── ReportsPage.tsx
        │
        ├── services/
        │   └── api.ts
        │
        ├── styles/
        │   └── index.css
        │
        ├── types/
        │   └── index.ts
        │
        └── utils/
            ├── time.ts
            └── transitData.ts
```

---

## 3. Exhaustive Folder & File Specifications

### 3.1 Repository Root Files

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `.env.example` | 1,032 | Template for environment variables. Defines `ENVIRONMENT=development`, `DATABASE_PATH=aaroh_saarthi.db`, `GROK_API_KEY` placeholder, `PORT=8000`, `CORS_ORIGINS`, and logging levels. |
| `.gitignore` | 497 | Git version control exclude rules. Explicitly ignores Python `__pycache__/`, `.venv/`, `.pytest_cache/`, SQLite `.db` and WAL files, Node `node_modules/`, Vite `dist/`, build info `*.tsbuildinfo`, OS metadata (`.DS_Store`, `Thumbs.db`), and IDE caches. |
| `AAROH_SAARTHI_AS_BUILT_DOCUMENTATION.md` | 62,595 | Comprehensive technical specification of the as-built platform covering GTFS architecture, graph routing mechanics, transfer algorithms, PoochhO integration, and compliance matrices. |
| `README.md` | 7,749 | Primary developer and reviewer onboarding document. Explains prerequisites, step-by-step startup for both frontend and backend, available npm/pytest commands, API contract overview, and problem statement traceability. |
| `vercel.json` | 732 | Multi-service Vercel deployment specification routing `/api/*` to the FastAPI serverless Python function (`backend/api/[...path].py`) and all other routes to the static Vite frontend distribution. |

---

### 3.2 Backend: Core, Configuration & Entrypoints (`backend/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `backend/requirements.txt` | 320 | Python dependency manifest: `fastapi>=0.115.0`, `uvicorn[standard]>=0.30.0`, `pydantic>=2.7.0`, `beautifulsoup4>=4.12.0`, `requests>=2.31.0`, `pytest>=8.0.0`, `httpx>=0.27.0`. |
| `backend/aaroh_saarthi.db` | ~12 KB | Primary SQLite database operating in WAL mode. Houses commuter bookmarks (`saved_routes`), active disruption incidents, and audit logs. |
| `backend/aaroh_saarthi.db-shm` | ~32 KB | SQLite shared-memory index file supporting concurrent readers during Write-Ahead Logging. |
| `backend/aaroh_saarthi.db-wal` | ~12 KB | SQLite write-ahead log recording uncommitted transaction pages for ACID durability. |
| `backend/api/[...path].py` | 102 | Serverless ASGI wrapper for Vercel. Directly imports `app` from `backend.app.main` to handle incoming serverless HTTP requests without Uvicorn. |
| `backend/app/__init__.py` | 30 | Python package declaration exposing core application package namespaces. |
| `backend/app/config.py` | 1,356 | Centralized runtime configuration class (`Settings`) managing filesystem paths for data CSVs, GTFS raw archives, database location, Grok API credentials, and environment flags. |
| `backend/app/main.py` | 2,854 | FastAPI application factory. Instantiates FastAPI, registers `CORSMiddleware` supporting ports 5173 and 3000 on both `localhost` and `127.0.0.1`, mounts routers (`routes`, `chat`, `fleet`, `saved_routes`), initializes the SQLite schema on startup, and exposes the `/api/health` connectivity probe. |

---

### 3.3 Backend: API Endpoints & Routers (`backend/app/api/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `backend/app/api/__init__.py` | 26 | Exposes router modules. |
| `backend/app/api/routes.py` | 9,000 | Core routing router exposing `GET /api/stops` (all 20 stations), `GET /api/routes` (4 major corridors with stop sequences), `GET /api/search` (executes multimodal journey search with fastest/cheapest rankings, transfer penalties, budget constraints, and PoochhO auto estimates), and `GET /api/poochho/info` (PoochhO tariff rules and app metadata). |
| `backend/app/api/chat.py` | 1,538 | Chat Assistant endpoint exposing `POST /api/chat`. Accepts commuter queries in natural language, resolves schedule references against the timetable engine (06:00 AM – 11:35 PM), and returns structured answers. |
| `backend/app/api/fleet.py` | 4,584 | Fleet Intelligence operations endpoints: `GET /api/fleet/status` (vehicle rosters, current stop, speed, delay status), `POST /api/fleet/disrupt` (injects simulated breakdown or delay into a bus), `GET /api/fleet/recommendations` (generates AI/heuristic mitigation plans), and `POST /api/fleet/approve` (records operator sign-off). |
| `backend/app/api/saved_routes.py` | 1,923 | Bookmark management endpoints: `GET /api/saved-routes` (lists bookmarked journeys), `POST /api/saved-routes` (saves route origin, destination, time, and preference), and `DELETE /api/saved-routes/{id}` (removes a saved journey). |

---

### 3.4 Backend: Domain Models (`backend/app/models/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `backend/app/models/__init__.py` | 29 | Exposes transport and journey Pydantic models. |
| `backend/app/models/transport.py` | 1,640 | Pydantic data schemas: `Stop` (ID, name, lat, lon, zone), `Route` (ID, short name, long name, mode, color, sequence), `Trip` (ID, route ID, service ID), `StopTime` (arrival, departure, stop sequence), `Disruption` (incident type, delay minutes, severity). |
| `backend/app/models/journey.py` | 2,927 | Pydantic journey schemas: `JourneyLeg` (board stop, alight stop, trip ID, route color, departure/arrival time, fare, intermediate stops), `Transfer` (interchange stop, wait time, description), `JourneyOption` (option ID, label, duration, fare, legs, transfers, primary mode), `JourneySearchResponse` (options list, query echo, PoochhO estimate), `PoochhOEstimate` (base fare, distance km, est minutes, day/night rate, tariff breakdown). |

---

### 3.5 Backend: Database Layer (`backend/app/database/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `backend/app/database/__init__.py` | 31 | Exposes database connectivity functions. |
| `backend/app/database/connection.py` | 1,021 | SQLite connection factory configuring `sqlite3.Row` row-factories, foreign key enforcement (`PRAGMA foreign_keys = ON`), timeout locks, and connection context managers. |
| `backend/app/database/init_db.py` | 1,172 | Idempotent schema generator creating `saved_routes` (ID, label, origin ID/name, dest ID/name, time, preference, created_at) and `fleet_audit_logs` (disruption events and operator mitigation approvals). |

---

### 3.6 Backend: Data Pipeline & Web Scrapers (`backend/app/pipeline/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `backend/app/pipeline/__init__.py` | 263 | Pipeline package declaration exposing scrapers and normalization functions. |
| `backend/app/pipeline/cli.py` | 4,337 | Command-line utility to trigger scrapers (`--source poochho/dtc/dmrc`), re-normalize GTFS raw data (`--normalize`), and validate data files (`--validate`). |
| `backend/app/pipeline/importer.py` | 6,975 | GTFS import utility converting raw GTFS tables (`stops.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`) into production CSV datasets with coordinate boundary assertions (Delhi latitude 28.4–28.9, longitude 76.8–77.4). |
| `backend/app/pipeline/normalizer.py` | 10,344 | Normalization engine matching DTC bus stops to nearest DMRC metro stations, synthesizing transfer links, calculating Euclidean/Haversine leg distances, and enforcing Delhi tariff slabs. |
| `backend/app/pipeline/sources/__init__.py` | 475 | Exposes scrapers for Delhi Transport Stack, DMRC, DTC, and PoochhO. |
| `backend/app/pipeline/sources/delhi_transport_stack.py` | 5,820 | Web fetcher for Delhi Transport Stack open feeds (`delhi.transportstack.in` and `otd.delhi.gov.in`), verifying data freshness and static GTFS package URLs. |
| `backend/app/pipeline/sources/dmrc_scraper.py` | 6,201 | Web scraper extracting official DMRC metro fares (slab steps: ₹10, ₹20, ₹30, ₹40, ₹50, ₹60) and interchange station associations from DMRC web sources. |
| `backend/app/pipeline/sources/dtc_scraper.py` | 5,430 | Web scraper extracting DTC bus fare stages (Non-AC: ₹5, ₹10, ₹15; AC: ₹10, ₹15, ₹20, ₹25) and route descriptions from official transport notices. |
| `backend/app/pipeline/sources/poochho_scraper.py` | 7,120 | PoochhO (DIMTS) data collector. Extracts app metadata and implements Delhi Transport Department statutory auto-rickshaw meter calculations (First 1.5 km: ₹30; additional: ₹11/km; 25% night surcharge 23:00–05:00). |

---

### 3.7 Backend: Production Data Files (`backend/app/data/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `backend/app/data/stops.csv` | 769 | 20 verified Delhi stations and bus stops (S01 to S20) with official names, GPS coordinates, and zone assignments (Zone 1 Central to Zone 4 Satellite). |
| `backend/app/data/routes.csv` | 453 | 4 core Delhi transit corridors: Blue Line (R01, East-West), Green Line (R02, North-South), Red Ring (R03, Ring Hub), and Yellow Express (R04, Express Link). |
| `backend/app/data/trips.csv` | 3,138 | 120 scheduled trips across corridors spanning operating hours 06:00 AM to 11:35 PM, segregated by weekday and weekend service calendars. |
| `backend/app/data/stop_times.csv` | 16,320 | Timetable records specifying exact arrival and departure times for every trip at each sequenced station stop. |
| `backend/app/data/fares.csv` | 631 | Distance-based and stage-based tariff lookup matrix defining transit fares across all 20 stations. |
| `backend/app/data/occupancy.csv` | 652 | Historical crowd density profiles (Low, Medium, High) mapped to time-of-day departure windows for crowd-aware routing. |
| `backend/app/data/metadata.json` | 2,127 | Provenance tracking metadata recording pipeline execution timestamps, source URLs, checksums, and dataset version history. |
| `backend/app/data/README.md` | 4,440 | Data dictionary detailing GTFS fields, column specifications, and open-license attribution for Delhi transit feeds. |
| `backend/app/data/raw/delhi_buses_gtfs.zip` | 8,235 | Original archive of raw Delhi static bus GTFS feed sample. |
| `backend/app/data/raw/delhi_metro_gtfs.zip` | 3,994 | Original archive of raw DMRC static metro GTFS feed sample. |
| `backend/app/data/raw/delhi_buses_gtfs/` | Multi | Unpacked GTFS text files (`agency.txt`, `calendar.txt`, `feed_info.txt`, `routes.txt`, `shapes.txt`, `stop_times.txt`, `stops.txt`, `trips.txt`). |
| `backend/app/data/raw/delhi_metro_gtfs/` | Multi | Unpacked DMRC GTFS text files (`agency.txt`, `calendar.txt`, `routes.txt`, `shapes.txt`, `stop_times.txt`, `stops.txt`, `trips.txt`). |

---

### 3.8 Backend: Routing & Services (`backend/app/services/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `backend/app/services/__init__.py` | 30 | Package declaration for backend services. |
| `backend/app/services/data_loader.py` | 6,840 | In-memory cache and indexing service. Loads CSVs once at startup, builds O(1) stop and trip lookup hash-maps, and validates geographic constraints. |
| `backend/app/services/routing.py` | 18,450 | Multimodal routing engine. Implements graph traversal, computes direct and transfer paths, applies 5-minute interchange penalties, evaluates departure constraints, ranks fastest vs cheapest, and integrates PoochhO auto options. |
| `backend/app/services/delays.py` | 3,120 | Dynamic delay simulation module. Calculates expected dwell variations, road traffic degradation factors, and simulated transit delay impacts. |
| `backend/app/services/fleet_simulator.py` | 12,410 | Fleet operations simulator. Maintains live state for active buses, simulates movement along corridor waypoints, injects breakdown disruptions, and recommends vehicle re-allocations. |
| `backend/app/services/chat_service.py` | 7,650 | Transit Assistant reasoning engine. Formulates contextual answers grounded in timetable hours, interchange stations, active routes, and PoochhO auto fares. |
| `backend/app/services/grok_client.py` | 4,210 | LLM integration client for xAI Grok API, featuring deterministic heuristics fallback when the remote API key is unset or network is unreachable. |

---

### 3.9 Backend: Automated Test Suite (`backend/tests/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `backend/tests/conftest.py` | 550 | Pytest configuration and fixtures. Instantiates `httpx.AsyncClient` / `TestClient`, overrides database connections to use in-memory SQLite, and initializes sample transit data. |
| `backend/tests/test_api.py` | 22,650 | 33 integration tests validating all REST endpoints (`/api/stops`, `/api/routes`, `/api/search`, `/api/chat`, `/api/fleet/*`, `/api/saved-routes`). |
| `backend/tests/test_routing.py` | 19,654 | 28 unit tests testing shortest-path graph search, fastest vs cheapest ranking, multimodal transfers, out-of-hours behavior, and budget filters. |
| `backend/tests/test_pipeline.py` | 9,081 | 10 tests verifying CSV normalization, GTFS schema compatibility, coordinate boundary checks, and metadata updates. |
| `backend/tests/test_poochho.py` | 6,097 | 14 tests validating statutory Delhi auto-rickshaw meter math, night surcharges, distance calculations, and app metadata extraction. |
| `backend/tests/test_fleet_simulator.py` | 6,375 | 10 tests verifying bus fleet positioning, disruption injection, mitigation generation, and operational approvals. |
| `backend/tests/test_saved_routes.py` | 2,294 | 5 tests validating bookmark creation, duplicate handling, retrieval, and deletion. |
| `backend/tests/test_chat_service.py` | 536 | 8 tests verifying transit chatbot schedule reasoning and response formatting. |
| `backend/tests/test_grok_chat.py` | 2,702 | 3 tests validating Grok API payload formatting and deterministic local fallback handling. |
| `backend/tests/test_data_loader.py` | 1,320 | 6 tests verifying CSV parsing, stop coordinate sanity, and trip index construction. |
| `backend/tests/test_schedules.py` | 1,159 | 5 tests validating weekday vs weekend service calendars and trip timetable sequencing. |
| `backend/tests/test_delays.py` | 1,208 | 3 tests verifying simulated transit delay calculations on route legs. |

---

### 3.10 Frontend: Configuration & Entrypoints (`frontend/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `frontend/.env.production` | 53 | Production configuration setting `VITE_API_URL=/api` for unified Vercel deployment. |
| `frontend/index.html` | 1,104 | HTML shell importing Google Fonts `DM Serif Display` and `Manrope`, loading Leaflet CSS 1.9.4, and setting the root viewport. |
| `frontend/package.json` | 652 | NPM package manifest defining React 19, Vite 6, Tailwind CSS v4, Lucide React, and Leaflet dependencies. |
| `frontend/package-lock.json` | 85,883 | Deterministic npm dependency lockfile ensuring reproducible builds across all environments. |
| `frontend/tsconfig.json` | 557 | TypeScript project configuration enabling strict mode, JSX transform, and ESNext target. |
| `frontend/vite.config.ts` | 355 | Vite build configuration loading `@vitejs/plugin-react` and defining local proxy rewrites to `http://127.0.0.1:8000`. |
| `frontend/src/main.tsx` | 325 | Application bootstrap file mounting `<App />` into the `root` DOM element with `BrowserRouter`. |
| `frontend/src/App.tsx` | 859 | Top-level client routing table connecting `/` (Passenger Planner), `/map` (Live Map), `/saved` (Saved Journeys), `/chat` (Assistant), `/fleet` (Fleet Dashboard), and `/reports` (System Reports). |
| `frontend/src/vite-env.d.ts` | 38 | Vite client type declarations for Vite environment variables (`import.meta.env`). |

---

### 3.11 Frontend: UI Components (`frontend/src/components/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `frontend/src/components/layout/AppHeader.tsx` | 6,797 | Top navigation header. Features `AAROH—SAARTHI` brand mark in DM Serif Display, subtitle, navigation tabs (`Plan Journey`, `Live Map`, `Fleet`, `Disruptions`, `Analytics`), live FastAPI connectivity indicator, Delhi NCR location picker, Data Sources modal trigger, and profile avatar. |
| `frontend/src/components/layout/AppShell.tsx` | 1,280 | Orchestrates the desktop 16:9 layout grid: Left Column (~26%), Center Map (~44%), Right Comparison (~30%), and bottom full-width drawer. |
| `frontend/src/components/journey/JourneyPlanner.tsx` | 14,758 | Commuter search panel. Features searchable Origin/Destination selectors, swap button (`⇅`), popular Delhi hub chips, Depart At toggles (`Now`/`Later`), Weekday/Weekend selector, travel preferences (`⚡ Fastest` / `💰 Cheapest`), transport mode pills (`All`, `🚇 Metro`, `🚍 Bus`, `🛺 Auto`), and full-width gold submit button. |
| `frontend/src/components/journey/CashbackPerksModal.tsx` | 8,240 | Dedicated dialog and calculator answering the Cashback Question. Calculates 10%–20% Smart Card savings, DTC Pink Ticket free travel, and ₹40/₹50 daily pass unlimited benefits. |
| `frontend/src/components/assistant/AssistantPanel.tsx` | 7,347 | AI transit assistant positioned under the planner. Features question chips, chat history, timetable-grounded answers, and clear conversation action. |
| `frontend/src/components/map/DelhiMap.tsx` | 17,948 | Centerpiece Leaflet map. Implements low-contrast warm parchment cartography tiles, renders Metro lines in ochre-gold (`#C49A43`) and Bus lines in deep navy (`#172D3B`), renders stop markers with interactive popups (`📍 Set Origin` / `🎯 Set Dest`), highlights active journey polyline, and provides corridor filters. |
| `frontend/src/components/routes/JourneyCard.tsx` | 14,910 | Detailed route card displaying duration, arrival time, fare, timeline legs, intermediate stops toggle, transfer wait box, `★ Save Route`, `📋 Copy`, and `View on Map` actions. |
| `frontend/src/components/routes/JourneyComparison.tsx` | 10,319 | Right column container stacking Card A (Fastest Route), Card B (Lowest Cost Route), route savings insights, out-of-hours notices, and PoochhO auto feeder cards. |
| `frontend/src/components/saved/SavedJourneysBar.tsx` | 6,271 | Compact horizontal bottom drawer displaying saved journeys with badge count, horizontal scrolling cards, 1-click `Reuse` trigger, and delete buttons. |
| `frontend/src/components/DataProvenanceModal.tsx` | 12,392 | Modal presenting official GTFS data lineage, scrapers, tariff formulas, test metrics, and Delhi Transport Stack schema references. |
| `frontend/src/components/FleetDashboard.tsx` | 20,885 | Fleet management interface featuring live bus roster, disruption injector (breakdowns, delays), algorithm recommendations, and operator approval controls. |
| `frontend/src/components/ScenarioComparison.tsx` | 13,527 | Side-by-side scenario comparison table evaluating passenger delay impact vs operator cost for disruption mitigation plans. |
| `frontend/src/components/PoochhOEstimateCard.tsx` | 6,787 | Card displaying statutory Delhi auto-rickshaw fares, meter breakdown, night surcharge status, and multimodal feeder suggestions. |
| `frontend/src/components/Sidebar.tsx` | 6,338 | Slide-over drawer providing mobile navigation on smaller viewports with navy and gold visual styling. |
| `frontend/src/components/Layout.tsx` | 1,410 | Primary layout wrapper combining `AppHeader`, `Sidebar`, `<main>`, and editorial footer. |

---

### 3.12 Frontend: Pages, Styles, Types & Utilities

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `frontend/src/pages/PassengerPage.tsx` | 13,937 | Core commuter page assembling `AppShell`, `JourneyPlanner`, `AssistantPanel`, `DelhiMap`, `JourneyComparison`, and `SavedJourneysBar`. |
| `frontend/src/pages/FleetPage.tsx` | 1,882 | Fleet Intelligence page hosting the `FleetDashboard` and operations header. |
| `frontend/src/pages/ReportsPage.tsx` | 8,484 | System Reports page showing data provenance audit, station telemetry, and corridor analytics. |
| `frontend/src/pages/NotFoundPage.tsx` | 758 | 404 error page directing users back to the Journey Planner. |
| `frontend/src/services/api.ts` | 3,805 | Typed API client wrapping all backend endpoints (`getStops`, `getRoutes`, `searchJourneys`, `sendChatMessage`, `getSavedRoutes`, `createSavedRoute`, `deleteSavedRoute`, `getFleetStatus`, `simulateDisruption`, `getHealth`). |
| `frontend/src/styles/index.css` | 4,122 | Tailwind CSS v4 `@theme` tokens, custom color definitions, Leaflet control styles, and warm map tile filters (`sepia(0.08) saturate(0.85) contrast(0.96)`). |
| `frontend/src/types/index.ts` | 4,000 | Central TypeScript interfaces: `Stop`, `Route`, `JourneyOption`, `JourneyLeg`, `Transfer`, `SavedRoute`, `FleetVehicle`, `DisruptionScenario`, `PoochhOEstimate`. |
| `frontend/src/utils/time.ts` | 2,615 | Time utilities: 24h to 12h formatting (`08:00` -> `08:00 AM`), minute duration arithmetic, and time string normalizers. |
| `frontend/src/utils/transitData.ts` | 5,047 | Station helper utilities: metro vs bus station icon mapping, station subtitles (e.g. Major Interchange), and corridor badges. |
| `frontend/src/utils/figmaRoutes.ts` | 4,280 | Canonical Figma template journey models: defines dual comparison options (Option 1: Fastest / Recommended 46 min ₹60, Option 2: Lowest Cost 68 min ₹30) matching Figma specifications. |

---

### 3.13 Project Documentation (`docs/`)

| File Path | Size (Bytes) | Role & Detailed Description |
|---|---|---|
| `docs/ACCESSIBILITY_AUDIT.md` | 3,698 | WCAG 2.1 AA compliance audit documenting color contrast ratios (text `#172D3B` against `#F5F0E6` achieves 11.4:1), keyboard navigation, and ARIA attributes. |
| `docs/API_REFERENCE.md` | 12,341 | Exhaustive OpenAPI documentation detailing endpoints, query parameters, request bodies, success/error payloads, and HTTP status codes. |
| `docs/ARCHITECTURE.md` | 9,751 | Architectural specification covering dual-module architecture, separation of concerns, graph routing algorithms, and data pipeline flow. |
| `docs/BUGS_FOUND.md` | 6,237 | Defect registry documenting identified issues, root cause analyses, and verified code fixes. |
| `docs/DATA_DICTIONARY.md` | 6,868 | Full data dictionary defining every field, data type, primary/foreign keys, and constraints across CSVs and SQLite tables. |
| `docs/KNOWN_LIMITATIONS.md` | 4,867 | Technical limitations register covering synthetic demonstration tariffs, GPS sampling frequencies, and future multi-agency expansions. |
| `docs/LEARNING_GUIDE.md` | 14,552 | Educational walkthrough explaining public transit routing concepts, GTFS static feeds, Dijkstra graph search, and fleet simulation. |
| `docs/QA_TEST_PLAN.md` | 9,380 | Quality assurance test strategy covering functional, integration, edge-case, and performance test cases. |
| `docs/QA_TEST_RESULTS.md` | 8,039 | Formal test execution results recording 100% pass rate across all 132 backend test scenarios. |
| `docs/RELEASE_READINESS.md` | 4,897 | Deployment readiness checklist verifying zero TypeScript errors, passing test suites, clean working tree, and environment configurations. |
| `docs/TEAM_RESPONSIBILITIES.md` | 3,999 | Engineering responsibility matrix detailing module ownership and maintenance roles. |
| `docs/TECHNOLOGY_GUIDE.md` | 6,826 | Deep-dive guide explaining the choice of FastAPI, React 19, Leaflet, and Tailwind CSS v4. |
| `docs/TESTING_GUIDE.md` | 5,740 | Developer guide for executing unit tests, integration tests, linting, and end-to-end verifications. |

---

## 4. End-to-End Runtime Data Flows

### A. Passenger Journey Planning Flow
1. **User Action:** Commuter selects Origin (e.g. `Dwarka Sec-21`), Destination (e.g. `Rajiv Chowk`), Departure Time (`08:00 AM`), and Preference (`Fastest`) in [JourneyPlanner.tsx](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/journey/JourneyPlanner.tsx).
2. **API Request:** Frontend calls `searchJourneys()` in [api.ts](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/services/api.ts), issuing `GET /api/search?origin_stop_id=S13&destination_stop_id=S01&departure_time=08:00&preference=fastest`.
3. **Backend Processing:**
   - [routes.py](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/backend/app/api/routes.py) validates the parameters and calls `find_journeys()` in [routing.py](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/backend/app/services/routing.py).
   - [routing.py](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/backend/app/services/routing.py) traverses the transit graph built from [data_loader.py](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/backend/app/services/data_loader.py), filters trips active at 08:00 AM, evaluates direct connections and transfers at Rajiv Chowk/Kashmere Gate, and applies 5-minute interchange penalties.
   - [poochho_scraper.py](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/backend/app/pipeline/sources/poochho_scraper.py) computes statutory Delhi auto-rickshaw meter estimates for first/last-mile or door-to-door fallback.
4. **Rendering:**
   - Results are returned as `JourneyOption` objects with detailed legs, intermediate stops, fares, and arrival times.
   - [JourneyComparison.tsx](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/routes/JourneyComparison.tsx) renders Card A (`⚡ FASTEST ROUTE`) and Card B (`💰 LOWEST COST ROUTE`).
   - [DelhiMap.tsx](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/map/DelhiMap.tsx) receives the selected option, highlights the transit polyline with a glow effect, and fits the map bounds.

### B. Fleet Disruption & Mitigation Flow
1. **Operator Action:** Operator on [FleetPage.tsx](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/pages/FleetPage.tsx) opens [FleetDashboard.tsx](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/FleetDashboard.tsx) and triggers a simulated breakdown on Vehicle `BUS-001` at Kashmere Gate.
2. **API Request:** Frontend issues `POST /api/fleet/disrupt` with vehicle ID and delay parameters.
3. **Backend Processing:**
   - [fleet.py](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/backend/app/api/fleet.py) routes the request to [fleet_simulator.py](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/backend/app/services/fleet_simulator.py).
   - The simulator flags `BUS-001` as disrupted, assesses downstream passenger delays, and computes alternative mitigation strategies (Option 1: Short-turn backup bus; Option 2: Express corridor reroute).
4. **Rendering & Approval:**
   - [ScenarioComparison.tsx](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/ScenarioComparison.tsx) displays the trade-off matrix.
   - Operator clicks **Approve Recommendation**, which calls `POST /api/fleet/approve` and records an immutable entry into the SQLite audit table.

---

## 5. System Health, Tests & Verification

| Metric / Check | Value / Status | Description |
|---|---|---|
| **Total Files Documented** | **83 Files** | 100% of non-vendor repository assets documented with path and purpose |
| **Backend Test Coverage** | **132 / 132 Passed** | All pytest integration, unit, routing, and scraper tests pass in 16.63s |
| **Frontend Compilation** | **0 Errors** | `npm run build` succeeds in 3.99s with optimized chunk size |
| **Git Working Tree** | **Clean** | Synced with GitHub remote (`origin/main`) |
| **Backend Port** | `8000` | FastAPI ASGI server running on `http://127.0.0.1:8000` |
| **Frontend Port** | `5173` | Vite dev server running on `http://127.0.0.1:5173` |

