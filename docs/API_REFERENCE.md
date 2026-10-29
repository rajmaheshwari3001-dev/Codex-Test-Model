# API Reference

Base URL (development): `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

## Run and check the API locally (Windows PowerShell)

From the repository root, start the backend in one terminal:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for Swagger UI. Expand an endpoint, select
**Try it out**, enter the request body where required, and select **Execute**.
The OpenAPI document is also available at `http://localhost:8000/openapi.json`.

Quick checks from a second PowerShell terminal:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
Invoke-RestMethod http://localhost:8000/api/stops
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/api/journeys/search `
  -ContentType 'application/json' `
  -Body (@{
    origin_stop_id = 'S13'
    destination_stop_id = 'S01'
    departure_time = '07:00'
    preference = 'fastest'
  } | ConvertTo-Json)
```

The sample stop IDs refer to the **synthetic demonstration dataset** bundled
with the project; they are not real service information. Stop IDs can be
checked with `GET /api/stops`.

---

## Health

### GET /api/health

Check that the backend is running.

**Response 200:**
```json
{ "status": "ok", "application": "Aaroh-Saarthi" }
```

---

## Stops

### GET /api/stops

Return all stops in the network.

**Response 200:**
```json
[
  { "stop_id": "S01", "stop_name": "Rajiv Chowk", "stop_lat": 28.6328, "stop_lon": 77.2197, "zone_id": "1" },
  { "stop_id": "S13", "stop_name": "Dwarka Sec-21", "stop_lat": 28.5529, "stop_lon": 77.0583, "zone_id": "3" }
]
```

---

## Routes

### GET /api/routes

Return all routes with their stop lists.

**Response 200:**
```json
[
  {
    "route_id": "R01", "route_name": "Blue Line", "route_type": "bus",
    "route_color": "#2196F3", "description": "Dwarka to Rajiv Chowk...",
    "stops": [
      { "stop_id": "S13", "stop_name": "Dwarka Sec-21", "stop_lat": 28.5529, "stop_lon": 77.0583 }
    ]
  }
]
```

---

## Journey Search

### POST /api/journeys/search

Find journey options between two stops.

**Request body:**
```json
{
  "origin_stop_id": "S13",
  "destination_stop_id": "S01",
  "departure_time": "07:00",
  "preference": "fastest"
}
```

| Field               | Type   | Required | Description                         |
|---------------------|--------|----------|-------------------------------------|
| origin_stop_id      | string | ✓        | Valid stop ID                        |
| destination_stop_id | string | ✓        | Valid stop ID (different from origin)|
| departure_time      | string | ✓        | Format: HH:MM                        |
| preference          | string | No       | "fastest" or "cheapest"; defaults to "fastest" |

Each journey leg returns intermediate stop names and IDs in trip order. The
board and alight stops are excluded from both intermediate-stop lists.

**Response 200 (routes found):**
```json
{
  "options": [
    {
      "option_id": "fastest",
      "label": "Fastest",
      "total_duration_minutes": 60,
      "departure_time": "07:00",
      "arrival_time": "08:00",
      "legs": [
        {
          "leg_index": 0,
          "trip_id": "T01",
          "route_id": "R01",
          "route_name": "Blue Line",
          "route_color": "#2196F3",
          "board_stop_id": "S13",
          "board_stop_name": "Dwarka Sec-21",
          "alight_stop_id": "S01",
          "alight_stop_name": "Rajiv Chowk",
          "departure_time": "07:00",
          "arrival_time": "08:00",
          "intermediate_stops": ["Janakpuri West", "Rajouri Garden", "Connaught Place"],
          "intermediate_stop_ids": ["S14", "S15", "S05"],
          "fare": 30.0,
          "currency": "INR"
        }
      ],
      "transfers": [],
      "total_fare": 30.0,
      "currency": "INR",
      "fare_available": true,
      "crowding_warnings": [],
      "delay_warnings": [],
      "data_status": "scheduled",
      "warnings": []
    }
  ]
}
```

**Response 200 (no route):**
```json
{ "options": [], "message": "No route found from S13 to S01 departing at 23:00." }
```

**Response 400 (invalid input):**
```json
{ "detail": "Unknown origin stop ID: 'INVALID'" }
```

Out-of-range clock values such as `08:75` and unknown stop IDs also return
HTTP 400. If the time is valid but no scheduled connection is available, the
API returns HTTP 200 with an empty `options` list and an explanatory `message`.

---

## Saved Routes

### POST /api/saved-routes

Save a frequently used route.

**Request body:**
```json
{
  "label": "Home to Office",
  "origin_stop_id": "S13",
  "origin_stop_name": "Dwarka Sec-21",
  "destination_stop_id": "S01",
  "destination_stop_name": "Rajiv Chowk",
  "preferred_departure_time": "08:00",
  "preference": "fastest"
}
```

**Response 200:**
```json
{ "saved_route_id": 1, "label": "Home to Office", ... }
```

### GET /api/saved-routes

Return all saved routes, newest first.

**Response 200:** Array of SavedRoute objects.

### GET /api/saved-routes/{id}

**Response 200:** Single SavedRoute.  
**Response 404:** `{ "detail": "Saved route not found." }`

### DELETE /api/saved-routes/{id}

**Response 200:** `{ "message": "Saved route deleted." }`  
**Response 404:** `{ "detail": "Saved route not found." }`

---

## Chat

### POST /api/chat

Send a natural-language transport question.

**Request body:**
```json
{ "message": "How do I get from Rajiv Chowk to Saket?" }
```

**Response 200:**
```json
{
  "intent": "find_route",
  "reply": "The fastest route takes 65 minutes. Path: Rajiv Chowk (08:00) → Connaught Place → AIIMS → Saket (09:05). Fare: ₹20.",
  "data": [...]
}
```

Supported intents: `find_route`, `next_departure`, `explain_route`, `delay_info`, `compare`, `saved_routes`, `help`

---

## Delays (Simulated)

### POST /api/delays

Set a simulated delay for a trip.

**Request body:**
```json
{ "trip_id": "T01", "delay_minutes": 15 }
```

**Response 200:** `{ "message": "Delay set...", "simulated": true }`  
**Response 404:** Trip not found.

### GET /api/delays

**Response 200:** `{ "delays": { "T01": 15 }, "simulated": true }`

### DELETE /api/delays

Clear all delays.

**Response 200:** `{ "message": "All delays cleared.", "simulated": true }`

---

## Fleet Intelligence

### GET /api/fleet/state

Return current simulated fleet.

**Response 200:**
```json
{
  "buses": [
    { "bus_id": "B-T01", "route_id": "R01", "trip_id": "T01", "status": "active", "occupancy_percent": 50, "delay_minutes": 0 },
    { "bus_id": "B-SPARE-1", "route_id": "", "trip_id": "", "status": "spare", "occupancy_percent": 0, "delay_minutes": 0 }
  ],
  "simulated": true
}
```

### POST /api/fleet/disruption

Trigger and evaluate a disruption.

**Request body:**
```json
{
  "disruption_type": "breakdown",
  "affected_bus_id": "B-T01",
  "description": "Bus breakdown at Rajouri Garden",
  "delay_minutes": 0
}
```

`disruption_type`: `"breakdown"` or `"delay"`

**Response 200:**
```json
{
  "disruption": { "disruption_id": "D-B-T01-breakdown", "disruption_type": "breakdown", "affected_bus_id": "B-T01", ... },
  "baseline": {
    "scenario_name": "No action (baseline)",
    "affected_passengers": 25,
    "average_wait_increase_minutes": 30.0,
    "delayed_trips": 1,
    "fleet_utilization_percent": 90.0,
    "total_buses_active": 19,
    "total_buses_available": 21,
    "crowding_increase_percent": 15.0
  },
  "responses": [
    {
      "response_id": "deploy_spare",
      "label": "Deploy Spare Bus",
      "description": "Reassign B-SPARE-1 to cover T01 on route R01.",
      "feasible": true,
      "reason_if_infeasible": "",
      "metrics": { "average_wait_increase_minutes": 10.0, ... },
      "explanation": "A spare bus can reach the route within ~10 minutes...",
      "trade_offs": ["Spare fleet reduced by one bus.", "Initial 10-minute wait."]
    }
  ],
  "recommended_response_id": "deploy_spare"
}
```

**Response 400:** `{ "detail": "disruption_type must be 'breakdown' or 'delay'." }`

### POST /api/fleet/approve

Approve or reject a proposed response.

**Request body:**
```json
{ "disruption_id": "D-B-T01-breakdown", "response_id": "deploy_spare", "approved": true }
```

**Response 200:**
```json
{ "disruption_id": "...", "response_id": "deploy_spare", "action": "approved", "message": "Response 'Deploy Spare Bus' has been approved.", "simulated": true }
```

**Response 400:** Infeasible response.  
**Response 404:** Disruption or response not found.
