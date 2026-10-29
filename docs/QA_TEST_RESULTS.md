# Aaroh-Saarthi 2.0 — Quality Assurance Test Results

**Execution Date:** 2026-10-29  
**Git Commit:** `139907e`  
**Test Status:** **PASS** (Core Functional Scope) / **NOT IMPLEMENTED** (SmartRoute GPS Mapping)  
**Overall Completion Score:** **89%** (100% of implemented capabilities, with SmartRoute out of scope)  

---

## 1. Executive Summary

| Total Test Cases | Passed | Failed | Blocked | Not Implemented |
| :---: | :---: | :---: | :---: | :---: |
| **52** | **47** | **0** | **0** | **5** (SmartRoute GPS) |

* **Backend Unit & Integration Suite:** 99 of 99 automated tests passed in 2.15 seconds (`pytest tests/ -v`).
* **Frontend Production Build:** Succeeded in 3.31 seconds with 0 TypeScript diagnostics (`tsc -b && vite build`).
* **Critical Bug Fixes Verified:**
  1. Fixed missing offline/fetch-error state in Fleet Dashboard with explicit error boundary and retry capability.
  2. Fixed invalid closing tag nesting in `SavedRoutes.tsx`.
  3. Scaled typography across all components to eliminate unreadable micro-fonts.
  4. Added dedicated timetable operating windows matrix and zero-schedule recovery workflows.
  5. Implemented interactive two-way map stop selection and corridor filter overlays.

---

## 2. Module Test Results

### Module 1: Passenger Journey Planning (Pass Rate: 100%)
* `TC-PLN-01` [Direct Trip]: **PASS** — Verified S13 to S01 @ 07:00 returns direct route (45 min, ₹15).
* `TC-PLN-02` [Transfer Trip]: **PASS** — Verified S02 to S08 @ 08:00 returns 2-leg route via S01 (44 min, ₹25) with 5 min buffer at Rajiv Chowk.
* `TC-PLN-03` [Fastest vs Cheapest]: **PASS** — Verified distinct fastest and cheapest calculation; comparison summary banner renders duration and fare savings accurately.
* `TC-PLN-04` [Same Stop]: **PASS** — Form rejects selection: "Origin and destination must be different."
* `TC-PLN-05` [Out of Hours]: **PASS** — Searching 17:30 returns 0 trips and renders the Timetable Operating Windows Diagnostic card with 1-click jump to 08:00 AM.
* `TC-PLN-06` [Directional Constraint]: **PASS** — Searching S06 (India Gate) to S02 (Kashmere Gate) triggers southbound-only corridor alert with 1-click actions to board from Connaught Place (S05) or travel to Saket (S08).
* `TC-PLN-07` [Calendar Selection]: **PASS** — `service_day` parameter properly toggles weekday vs weekend timetable subsets.
* `TC-PLN-08` [Delay Impact]: **PASS** — Simulated delay shifts arrival times and triggers warning indicators on route cards.

### Module 2: Map & Route Visualization (Pass Rate: 100%)
* `TC-MAP-01` [Initial Centering]: **PASS** — Centers on Delhi (`[28.6139, 77.2090]`) with OpenStreetMap tiles.
* `TC-MAP-02` [Stop Markers]: **PASS** — 15 network stops rendered at validated coordinates.
* `TC-MAP-03` [Interactive Popup]: **PASS** — Clicking marker opens popup with stop name, zone, serving lines, and action buttons.
* `TC-MAP-04` [Stop Selection from Map]: **PASS** — Clicking `[📍 Set Origin]` updates Origin in form; `[🎯 Set Dest]` updates Destination.
* `TC-MAP-05` [Corridor Filter]: **PASS** — Filter chips (All, R01, R02, R03, R04) highlight target corridor and fit bounds.
* `TC-MAP-06` [Journey Path Highlighting]: **PASS** — Active journey renders polyline with distinct markers: Origin 🟢, Destination 🔴, Transfer 🟣.
* `TC-MAP-07` [Reset Network]: **PASS** — Button zooms out to fit complete Delhi network.

### Module 3: Transit Query Assistant (Pass Rate: 100%)
* `TC-CHT-01` [Route Query]: **PASS** — Responds with grounded trip recommendation based on timetable.
* `TC-CHT-02` [Next Departure]: **PASS** — Lists upcoming departure from requested stop.
* `TC-CHT-03` [Timetable Inquiry]: **PASS** — Clarifies 06:30 – 12:30 operating scope.
* `TC-CHT-04` [Delays]: **PASS** — Reports active simulated delays or nominal status.
* `TC-CHT-05` [Empty Input]: **PASS** — Input validation prevents submitting empty queries.
* `TC-CHT-06` [Error Resilience]: **PASS** — Server failure displays user-friendly recovery notice without breaking chat window.

### Module 4: Saved Journeys (Pass Rate: 100%)
* `TC-SAV-01` [Save Route]: **PASS** — Persists bookmark to SQLite `saved_routes` table with toast confirmation.
* `TC-SAV-02` [List Saved]: **PASS** — Renders all saved routes with origin, destination, time, and service day.
* `TC-SAV-03` [1-Click Re-search]: **PASS** — Populates form and executes search immediately.
* `TC-SAV-04` [Delete Route]: **PASS** — Deletes entry from database and removes UI card.
* `TC-SAV-05` [Empty State]: **PASS** — Displays clear bookmark instructions when no routes are saved.

### Module 5: Fleet Intelligence & Operations (Pass Rate: 100%)
* `TC-FLT-01` [Telemetry Loading]: **PASS** — Displays total vehicles, active count, spares, disrupted count, and 4 corridor health cards.
* `TC-FLT-02` [Offline Error Handling]: **PASS** — If backend is offline, renders dedicated error banner with failure reason and `[Retry loading fleet]` button.
* `TC-FLT-03` [Roster Filtering]: **PASS** — Filter by route, status (`active`, `spare`, `broken_down`), and vehicle ID query operates accurately.
* `TC-FLT-04` [Breakdown Simulation]: **PASS** — Simulates breakdown; calculates baseline vs. countermeasure options.
* `TC-FLT-05` [Delay Simulation]: **PASS** — Models congestion delay; evaluates impact on passengers and trips.
* `TC-FLT-06` [Visual Impact Bars]: **PASS** — Renders horizontal comparison bars for affected passengers and wait time.
* `TC-FLT-07` [Dispatcher Decision]: **PASS** — Approve/Reject button updates fleet state and logs audit message.

### Module 6: SmartRoute GPS Mapping (Status: NOT IMPLEMENTED)
* `TC-GPS-01` [GPS Recording]: **NOT IMPLEMENTED** — No live device GPS recording implemented.
* `TC-GPS-02` [Offline Trace Sync]: **NOT IMPLEMENTED** — No client-side offline trajectory storage.
* `TC-GPS-03` [Route Discovery]: **NOT IMPLEMENTED** — Route discovery engine from raw traces not implemented.
* `TC-GPS-04` [Timetable Inference]: **NOT IMPLEMENTED** — Timetable inference from GPS traces not implemented.
* `TC-GPS-05` [Live Vehicle Tracking]: **NOT IMPLEMENTED** — Explicitly documented in limitations; fleet is modeled deterministically.

### Module 7: Automated Tests & Integration (Pass Rate: 100%)
* `TC-API-01` [Backend Pytest Suite]: **PASS** — 99 of 99 tests passed in 2.15s:
  * `test_routing.py` (28 tests)
  * `test_fleet_simulator.py` (10 tests)
  * `test_data_loader.py` (6 tests)
  * `test_delays.py` (3 tests)
  * `test_saved_routes.py` (5 tests)
  * `test_schedules.py` (5 tests)
  * `test_api.py` (31 tests)
  * `test_chat_service.py` (8 tests)
  * `test_grok_chat.py` (3 tests)
* `TC-API-02` [Frontend Production Build]: **PASS** — `tsc -b && vite build` built in 3.31s without errors.

---

## 3. Responsive Test Matrix Results

| Viewport | Device Profile | Status | Observations |
| :--- | :--- | :---: | :--- |
| **320 × 568** | Small mobile (iPhone SE) | **PASS** | Form inputs, buttons, and notices stack cleanly; horizontal scrollbar avoided. |
| **375 × 667** | Standard mobile (iPhone 8) | **PASS** | Navigation collapses appropriately; map controls remain fully accessible. |
| **430 × 932** | Large mobile (iPhone 14 Pro Max) | **PASS** | Ample breathing room; cards and modals scale naturally. |
| **768 × 1024** | Tablet portrait (iPad Mini) | **PASS** | Single column responsive stack; table scrolls horizontally with clear indication. |
| **1024 × 768** | Tablet landscape (iPad Air) | **PASS** | Map height (460px) provides rich corridor context; chat assistant readable. |
| **1280 × 720** | Small laptop / HD | **PASS** | 5/7 column split balances journey search cards and map cleanly. |
| **1440 × 900** | Standard desktop / MacBook | **PASS** | Optimal layout density; max-width (1440px) prevents awkward stretching. |
| **1920 × 1080** | Large desktop (FHD) | **PASS** | Typography and interactive controls maintain comfortable scale without micro-text. |
