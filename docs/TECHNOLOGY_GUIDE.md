# Aaroh-Saarthi Technology Guide

This guide explains which technologies Aaroh-Saarthi uses, where they appear
in the project, and why they were chosen. The project is a web prototype with
two main parts: a passenger journey planner and a fleet operations simulator.

## At a glance

| Area | Technology | Where it is used | Why it is used |
|---|---|---|---|
| User interface | React 19 | `frontend/src/` | Builds the passenger and fleet screens from reusable UI components. |
| Frontend language | TypeScript | `frontend/src/` | Catches many data-shape and programming mistakes while developing the UI. |
| Page navigation | React Router | `frontend/src/App.tsx`, `frontend/src/components/Navigation.tsx` | Lets users move between the passenger planner and fleet dashboard without separate applications. |
| Frontend tooling | Vite | `frontend/vite.config.ts`, `frontend/package.json` | Runs the local development server, proxies API calls during development, and builds frontend assets for deployment. |
| Styling | Tailwind CSS 4 and project CSS | `frontend/src/styles/index.css` and UI components | Tailwind provides utility styling; the project CSS defines shared colors, spacing, and reusable visual rules. |
| Interactive map | Leaflet and React Leaflet | `frontend/src/components/TransportMap.tsx` | Displays stops, routes, and a selected journey on a map using map tiles. |
| Frontend/backend requests | Browser Fetch API | `frontend/src/services/api.ts` | Sends typed JSON requests to the backend through one shared API module. |
| Backend language | Python | `backend/app/` | Implements the routing, schedule, chat, saved-route, and fleet logic. |
| Web API | FastAPI | `backend/app/main.py`, `backend/app/api/` | Exposes backend features as HTTP endpoints and produces interactive API documentation. |
| API data validation | Pydantic | `backend/app/models/`, `backend/app/api/` | Validates and describes data received by and returned from the API. |
| Local API server | Uvicorn | Development command in `README.md` | Runs the FastAPI application locally as an ASGI server. |
| Transit data processing | Pandas and CSV files | `backend/app/services/data_loader.py`, `backend/app/data/` | Loads the small sample network from editable, inspectable data files. |
| Route-network representation | NetworkX and custom schedule-aware routing | `backend/app/services/routing_service.py` | Represents stops and connections as a graph; the routing service checks scheduled departures to find feasible journeys. |
| Saved-route storage | SQLite | `backend/app/database/`, `backend/app/services/saved_route_service.py` | Persists saved journeys locally without requiring a separate database server. |
| Optional AI wording | xAI Grok API, called with HTTPX | `backend/app/services/chat_service.py` | Can phrase selected transit-help replies conversationally; deterministic backend logic remains responsible for schedule and route facts. |
| Backend tests | Pytest | `backend/tests/` | Runs automated checks for API endpoints and business logic. |
| Hosting configuration | Vercel multi-service project | Root `vercel.json` | Routes `/api/*` requests to the Python backend service and other requests to the Vite frontend. |

## How a request moves through the application

1. A passenger enters two stops and a departure time in the React interface.
2. The frontend API module sends the request as JSON to the FastAPI backend.
3. FastAPI validates the request with Pydantic and passes it to the relevant
   service.
4. The routing service checks the sample timetable and returns only journeys
   that are feasible for the requested time.
5. The frontend displays the journey choices and can draw the selected journey
   on the Leaflet map.

The fleet page follows the same frontend-to-backend pattern. Its fleet and
disruption data are simulated, so the dashboard is for demonstrating and
evaluating scenarios—not for operating real buses.

## Why use both a graph and timetable-aware logic?

The transit network is naturally represented as stops connected by route
segments, so a graph is useful for describing its structure. But a connection
between two stops is not automatically usable at every time. The routing
service also reads trip schedules and scans time-ordered connections. This is
why the app can distinguish a route that exists in the network from a journey
that is actually available at the requested departure time.

## What Grok does—and does not do

The chat service first uses application rules and transit data to determine an
answer. If an xAI API key is configured, Grok can rephrase selected help
responses. It is not the timetable database or routing engine, and it must not
invent departures, routes, fares, or availability. Without the key, the
rule-based response remains available.

Keep `XAI_API_KEY` in a local environment file or the deployment platform's
environment-variable settings. Do not write a real key into source code or
commit it to the repository.

## Development and deployment

For local development, Vite serves the frontend and proxies `/api` requests to
the FastAPI server. On Vercel, the root `vercel.json` configures the frontend
and backend as services in one project.

This is a prototype deployment, not a durable production system. Vercel
functions can restart and do not provide shared persistent local files. The
SQLite database, saved journeys, and in-memory simulated fleet or delay state
may therefore reset or differ between function instances. A production
version should use a managed persistent database and shared state storage. The
prototype also has no user authentication or user-specific data isolation.

## A short presentation explanation

> “Aaroh-Saarthi uses React and TypeScript for the passenger and fleet
> interfaces, with Vite for development and building. The interface talks to a
> Python FastAPI backend that validates requests and runs our timetable-aware
> route search. We use CSV files for the sample transit data, NetworkX to
> represent the network, SQLite for saved routes, and Leaflet for the map.
> Fleet operations are simulated. Grok is an optional way to phrase some
> assistant replies; it does not decide which scheduled journeys are
> available.”

## Main project locations

- Frontend dependencies and scripts: `frontend/package.json`
- Frontend API calls: `frontend/src/services/api.ts`
- Backend dependencies: `backend/requirements.txt`
- Backend application and API routes: `backend/app/main.py` and
  `backend/app/api/`
- Routing, chat, and fleet logic: `backend/app/services/`
- Sample transit data: `backend/app/data/`
- Automated tests: `backend/tests/`
- Vercel service and routing configuration: `vercel.json`
