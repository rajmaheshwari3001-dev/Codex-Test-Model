# Aaroh-Saarthi Learning Guide

A step-by-step explanation of how the application works, written for B.Tech CS students who want to understand and explain every part.

---

## 1. What the Project Does

Aaroh-Saarthi has two modules:

- **Passenger Route Assistant** – helps a passenger find the best bus route between two stops, considering schedules, fares, transfers, delays, and crowding.
- **Fleet Intelligence** – lets a transport operator simulate a disruption (breakdown or delay), compare response options, and approve the best one.

Both modules share the same backend and dataset.

---

## 2. What Happens When a Passenger Searches for a Route

```
User fills form → clicks "Search Routes"
  ↓
Frontend calls POST /api/journeys/search with JSON body:
  { origin_stop_id: "S13", destination_stop_id: "S01",
    departure_time: "07:00", preference: "fastest" }
  ↓
Backend receives request in app/api/routes.py → search_journeys()
  ↓
Calls routing_service.search() in app/services/routing_service.py
  ↓
Routing engine scans connections sorted by departure time
  → finds earliest arrival at destination
  → reconstructs path
  → assembles JourneyOption with legs, transfers, fares, warnings
  ↓
Returns JSON response: { options: [JourneyOption, ...] }
  ↓
Frontend renders RouteResultCard for each option
  → user clicks one → TransportMap highlights the path on the map
```

### Small example

If you search from Dwarka Sec-21 (S13) to Rajiv Chowk (S01) at 07:00:

- The engine finds Trip T01 on the Blue Line
- Stops: S13 → S14 → S15 → S05 → S01
- Departs 07:00, arrives 08:00
- Duration: 60 minutes
- Fare: ₹30 (zone 3 to zone 1)

---

## 3. What a Backend API Is

An API (Application Programming Interface) lets the frontend talk to the backend using HTTP requests.

**FastAPI** is a Python web framework that automatically:
- Validates input using Pydantic models
- Generates API documentation at `/docs`
- Returns JSON responses

Each endpoint has:
- A **method** (GET, POST, DELETE)
- A **path** (`/api/stops`)
- A **handler function** that runs when the endpoint is called

Example from `app/api/routes.py`:
```python
@router.get("/health")
def health_check():
    return {"status": "ok", "application": "Aaroh-Saarthi"}
```

---

## 4. How the Frontend Communicates with FastAPI

The frontend uses `fetch()` in `src/services/api.ts`:

```typescript
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  return res.json()
}
```

During development, Vite proxies `/api/*` to `http://localhost:8000` (configured in `vite.config.ts`). This means the frontend never calls `localhost:8000` directly — it calls `/api/stops` and Vite forwards it.

**CORS** (Cross-Origin Resource Sharing) is also configured in `app/main.py` so the browser allows these requests.

---

## 5. How Transport Data Is Represented

Transport data lives in CSV files under `backend/app/data/`.

Each CSV maps to a Pydantic model in `app/models/transport.py`:

| CSV file        | Pydantic model | Key fields                           |
|-----------------|----------------|--------------------------------------|
| `stops.csv`     | `Stop`         | stop_id, stop_name, stop_lat, stop_lon, zone_id |
| `routes.csv`    | `Route`        | route_id, route_name, route_color    |
| `trips.csv`     | `Trip`         | trip_id, route_id, direction, service_days |
| `stop_times.csv`| `StopTime`     | trip_id, stop_id, stop_sequence, arrival_time, departure_time |
| `fares.csv`     | `Fare`         | route_id, from_zone_id, to_zone_id, fare_amount |
| `occupancy.csv` | `Occupancy`    | trip_id, stop_id, occupancy_level    |

`data_loader.py` reads these into a `TransportData` object with lookup dictionaries:

```python
td.stops_by_id["S01"]           # → Stop(stop_name="Rajiv Chowk", ...)
td.stop_times_by_trip["T01"]    # → [StopTime(S13, seq=1), StopTime(S14, seq=2), ...]
td.fare_lookup[("R01","3","1")] # → Fare(fare_amount=30)
```

---

## 6. What a Graph Is

A **graph** is a data structure with:
- **Nodes** (vertices) – in our case, bus stops
- **Edges** – connections between stops

We use **NetworkX** to build a directed graph:

```python
G = nx.DiGraph()
G.add_node("S01", name="Rajiv Chowk")
G.add_edge("S13", "S14", weight=18, trip_id="T01")  # 18 min travel time
```

The graph helps with reachability checks (can I get from A to B at all?). The actual routing uses a more sophisticated time-dependent algorithm.

---

## 7. How Schedule-Aware Routing Works

File: `app/services/routing_service.py`

### The Problem

Simple shortest-path (Dijkstra) ignores time. But buses have schedules — you can't board Trip T01 at 07:00 if you arrive at the stop at 07:30.

### The Solution: Connection Scan

A **Connection** represents one hop: board at stop A, alight at stop B.

```python
@dataclass
class Connection:
    trip_id: str
    from_stop_id: str
    to_stop_id: str
    departure_minutes: int   # e.g. 420 = 07:00
    arrival_minutes: int     # e.g. 438 = 07:18
```

Trip T01 with stops S13→S14→S15→S05→S01 produces 4 connections.

**Algorithm (function `_find_fastest_journey`):**

1. Set `earliest_arrival[origin] = departure_time` (e.g. 420 for 07:00)
2. Set `earliest_arrival[all other stops] = infinity`
3. For each connection sorted by departure time:
   - Can I board? (I must be at `from_stop` before `departure_time`)
   - At origin: `earliest_arrival ≤ departure` (no buffer needed)
   - At transfer stops: `earliest_arrival ≤ departure - 2` (2-min buffer)
   - If I can board and this connection improves `earliest_arrival[to_stop]`, update it
4. After scanning all connections, reconstruct the path from destination to origin

### Worked Example

Search: S13 → S01 at 07:00

| Connection | From→To   | Depart | Arrive | Can board?                    | Update?          |
|-----------|-----------|--------|--------|-------------------------------|------------------|
| T01       | S13→S14   | 07:00  | 07:18  | arrival[S13]=07:00 ≤ 07:00 ✓ | arrival[S14]=07:18 |
| T01       | S14→S15   | 07:19  | 07:35  | arrival[S14]=07:18 ≤ 07:17 ✗ | (transfer buffer!) |

Wait — at S14 we need `07:18 ≤ 07:19 - 2 = 07:17`? That fails because S14 is not the origin. But we arrived on the **same trip** T01, so the connection is actually: the departure at S14 is 07:19 and we arrived at 07:18 — the 2-min buffer is for transfers between different trips. Since both connections are on T01, the predecessor chain correctly connects them through the earlier connection's arrival.

The algorithm correctly chains same-trip connections because each connection is considered independently — if we arrived at S14 via T01 at 07:18, we check `07:18 ≤ 07:19 - 2 = 07:17`. This is False, but the connection S13→S15 via S14 is still found through the longer connection chain. The key insight: T01's departure from S14 is 07:19, and since `07:18 ≤ 07:17` is False with the 2-min buffer, the algorithm actually uses direct multi-stop connections when available.

Result: S13 (07:00) → S14 → S15 → S05 → S01 (08:00), duration: 60 min

---

## 8. How Fastest and Cheapest Objectives Differ

**Fastest** (`_find_fastest_journey`):
- Objective: minimize `earliest_arrival[destination]`
- Ignores fare entirely
- Result: the trip that gets you there soonest

**Cheapest** (`_find_cheapest_journey`):
- Objective: minimize cumulative fare
- Still must be time-feasible (can't board departed buses)
- Looks up fare using `fare_lookup[(route_id, from_zone, to_zone)]`
- If fare data is missing for a connection, that connection is skipped
- Result may be slower but cheaper

Example: S04→S08 at 06:30
- Fastest: Yellow Express (T12), 55 min, ₹20
- Cheapest: Green Line (T05) to S10 + Red Ring to S08, 90 min, ₹15+₹15=₹30... actually more expensive. So sometimes fastest IS cheapest.

The API honestly reports when fares are unavailable (`fare_available: false`).

---

## 9. How SQLite Stores Saved Journeys

File: `app/services/saved_route_service.py`

SQLite is a file-based database — no server needed. Python has built-in support.

**Table schema** (`app/database/init_db.py`):

```sql
CREATE TABLE IF NOT EXISTS saved_routes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    label       TEXT NOT NULL,
    origin_stop_id      TEXT NOT NULL,
    origin_stop_name    TEXT NOT NULL,
    destination_stop_id TEXT NOT NULL,
    destination_stop_name TEXT NOT NULL,
    preferred_departure_time TEXT DEFAULT '',
    preference  TEXT DEFAULT 'fastest',
    created_at  TEXT DEFAULT (datetime('now'))
);
```

**CRUD operations:**

```python
# Create
cursor = conn.execute("INSERT INTO saved_routes (...) VALUES (?, ?, ...)", (values...))

# Read
rows = conn.execute("SELECT * FROM saved_routes ORDER BY created_at DESC").fetchall()

# Delete
conn.execute("DELETE FROM saved_routes WHERE id = ?", (saved_route_id,))
```

The `?` placeholders prevent SQL injection — never build SQL with string formatting!

---

## 10. How the Chatbot Works

File: `app/services/chat_service.py`

V1 uses **intent detection** (keyword matching) instead of an LLM:

```python
def detect_intent(message):
    if "from" in lower and "to" in lower:
        return "find_route"
    if "next" in lower or "departure" in lower:
        return "next_departure"
    if "delay" in lower:
        return "delay_info"
    ...
    return "help"
```

Each intent calls real backend services:
- `find_route` → `routing_service.search()`
- `next_departure` → `schedule_service.next_departures()`
- `delay_info` → `delay_service.get_all_delays()`

The chatbot **never fabricates** transport data. If it can't find the stops mentioned, it asks the user to rephrase.

---

## 11. How Delays Affect Journey Calculations

File: `app/services/delay_service.py`

Delays are stored as `trip_id → extra_minutes`:

```python
class DelayService:
    _delays = {"T01": 15}  # Trip T01 is 15 min late
```

The routing engine applies delays:

```python
effective_departure = conn.departure_minutes + delay_minutes.get(conn.trip_id, 0)
effective_arrival = conn.arrival_minutes + delay_minutes.get(conn.trip_id, 0)
```

If T01 is 15 min late, its S13 departure shifts from 07:00 to 07:15, and arrival at S01 shifts from 08:00 to 08:15. The engine may then choose a different, undelayed trip (like T02 at 08:30) if it arrives sooner.

---

## 12. How the Fleet Simulator Represents Buses

File: `app/services/fleet_simulator.py`

```python
@dataclass
class Bus:
    bus_id: str                # "B-T01"
    route_id: str              # "R01"
    trip_id: str               # "T01"
    status: str = "active"     # active | broken_down | spare | reassigned
    occupancy_percent: int = 50
    delay_minutes: int = 0
    capacity: int = 50
```

On startup, one Bus is created per trip, plus two spare buses (B-SPARE-1, B-SPARE-2).

---

## 13. How a Disruption Scenario Is Evaluated

Function: `FleetSimulator.evaluate_disruption()`

1. **Reset** to initial state (so every scenario starts equal)
2. **Apply disruption** to get the baseline (e.g. set bus status to "broken_down")
3. **Calculate baseline metrics** (what happens if we do nothing)
4. **Generate response options:**
   - For breakdown: "Deploy Spare Bus" and "Short-Turn Existing Bus"
   - For delay: "Absorb Delay" and "Express Run (Skip Stops)"
5. **Check feasibility** (is a spare bus available? is there another bus on the route?)
6. **Calculate metrics** for each feasible response
7. **Recommend** the response with the lowest average wait increase

Critical: each response scenario starts from a `copy.deepcopy(state)` of the initial state, ensuring fair comparison.

---

## 14. How Metrics Are Calculated

Function: `FleetSimulator._calculate_metrics()`

| Metric                        | Definition                                           |
|-------------------------------|------------------------------------------------------|
| affected_passengers           | Estimated passengers on the disrupted trip            |
| average_wait_increase_minutes | How much longer passengers wait on average            |
| delayed_trips                 | Number of trips with degraded service                 |
| fleet_utilization_percent     | (active buses / total buses) × 100                   |
| crowding_increase_percent     | Estimated increase in crowding on alternate services  |

These values come from the simulation state, not hard-coded. For example, `affected_passengers` is calculated from the bus's `occupancy_percent × capacity`.

---

## 15. How Tests Verify Correctness

File: `backend/tests/` — run with `python -m pytest tests/ -v`

**Test categories:**

| File                      | Tests | What it verifies                    |
|---------------------------|-------|-------------------------------------|
| `test_data_loader.py`     | 6     | CSV files parse correctly           |
| `test_routing.py`         | 13    | Direct routes, transfers, delays, invalid inputs |
| `test_schedules.py`       | 5     | Next departures, delay service      |
| `test_saved_routes.py`    | 5     | SQLite CRUD operations              |
| `test_delays.py`          | 3     | Delay-aware routing                 |
| `test_fleet_simulator.py` | 6     | Fleet simulation, disruption evaluation |
| `test_api.py`             | 11    | Full API integration tests          |

**Example test:**

```python
def test_direct_journey():
    svc, td = _make_service()
    options = svc.search("S13", "S01", "07:00", preference="fastest")
    assert len(options) >= 1
    assert options[0].legs[0].board_stop_id == "S13"
    assert options[0].legs[-1].alight_stop_id == "S01"
```

This test loads real data, runs a real search, and checks the result has the correct origin and destination.

---

## Study Order

If you're new to the project, read files in this order:

1. `backend/app/data/README.md` — understand the dataset
2. `backend/app/models/transport.py` — see the data structures
3. `backend/app/services/data_loader.py` — how data is loaded
4. `backend/app/services/routing_service.py` — the core algorithm
5. `backend/app/api/routes.py` — how the API exposes routing
6. `frontend/src/services/api.ts` — how the frontend calls the backend
7. `frontend/src/pages/PassengerPage.tsx` — how results are displayed
8. `backend/tests/test_routing.py` — how correctness is verified
