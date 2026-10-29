# Aaroh-Saarthi 2.0 — Defects & Bug Tracking Log

**Tracking Period:** Testing & Hardening Phase  
**Repository:** `https://github.com/rajmaheshwari3001-dev/Codex-Test-Model`  

---

## Defect Summary

| Bug ID | Severity | Module | Description | Status |
| :---: | :---: | :---: | :--- | :---: |
| `BUG-001` | **P1 (High)** | Fleet Intelligence | Fetch failure rendered an empty roster with misleading zero metrics instead of an offline error state. | **RESOLVED** |
| `BUG-002` | **P2 (Med)** | Saved Journeys | Invalid closing `</section>` tag inside map loop broke HTML hierarchy. | **RESOLVED** |
| `BUG-003` | **P2 (Med)** | Passenger Planner | Out-of-hours searches (e.g. 17:30) returned 0 trips without explaining that the demo timetable operates 06:30–12:30. | **RESOLVED** |
| `BUG-004` | **P2 (Med)** | UI/Accessibility | Widespread micro-typography (`text-[9px]`, `text-[10px]`) made the UI unreadable on standard desktop displays. | **RESOLVED** |
| `BUG-005` | **P3 (Low)** | Transport Map | Stop markers lacked direct interactive controls to populate the search form. | **RESOLVED** |
| `BUG-006` | **P3 (Low)** | Route Presentation | Passengers had no quick mechanism to copy journey itineraries for offline use or messaging. | **RESOLVED** |

---

## Defect Details & Resolution Evidence

### `BUG-001`: Fleet Dashboard Fetch Failure Rendered Fake Zero-State
* **Severity:** P1 (High)
* **Affected Component:** [`frontend/src/components/FleetDashboard.tsx`](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/FleetDashboard.tsx)
* **Root Cause:** When `getFleetState()` threw an error (e.g. backend offline or connection refused), `loading` was cleared, leaving `buses: []`. The dashboard proceeded to render the normal UI with `Total Fleet: 0`, `Active: 0`, and an empty bus selector, obscuring that the backend had failed to connect.
* **Fix Implemented:** Introduced explicit error handling with `role="alert"`, clear explanation of connection failure to `http://localhost:8000`, and a dedicated `[Retry loading fleet]` button.
* **Verification:** Simulated backend outage; dashboard displayed the error card and successfully recovered when the server was restarted.

---

### `BUG-002`: Malformed Tag Hierarchy in Saved Routes
* **Severity:** P2 (Medium)
* **Affected Component:** [`frontend/src/components/SavedRoutes.tsx`](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/SavedRoutes.tsx)
* **Root Cause:** Line 112 contained `</section>` instead of `</div>` inside the `routes.map` item template, creating unbalanced DOM tree closing tags against the parent container.
* **Fix Implemented:** Replaced rogue `</section>` with proper `</div>` and validated JSX nesting.
* **Verification:** Verified compilation via `tsc -b` and confirmed bookmark delete/list behavior.

---

### `BUG-003`: Confusing Zero-Schedule Search Result for Evening Hours
* **Severity:** P2 (Medium)
* **Affected Component:** [`frontend/src/components/RouteSearchForm.tsx`](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/RouteSearchForm.tsx), [`frontend/src/pages/PassengerPage.tsx`](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/pages/PassengerPage.tsx)
* **Root Cause:** In the sample GTFS dataset, all catalogued trips conclude by 12:30 PM. Searching for times like 17:30 returned 0 routes with no guidance on active hours, causing users to believe the route planner was broken. Furthermore, Route R03 is southbound-only from India Gate.
* **Fix Implemented:**
  1. Added an interactive 3-slot Timetable Operating Windows matrix in the search form showing 06:30–09:30 (Morning Peak) and 09:30–12:30 (Midday).
  2. Added real-time warning when out-of-service hours are entered, offering 1-click jumps to 08:00 AM, 09:30 AM, or 11:00 AM.
  3. Added a Zero-Schedule Diagnostic card when 0 results are returned, diagnosing both time and directional loop constraints with 1-click recovery actions.
* **Verification:** Verified searching India Gate to Kashmere Gate at 17:30 triggers diagnostic card with working 1-click recovery actions.

---

### `BUG-004`: Micro-Typography & Inaccessible Sizing
* **Severity:** P2 (Medium)
* **Affected Components:** Multiple frontend components
* **Root Cause:** The interface made heavy use of `text-[9px]`, `text-[10px]`, and `text-[11px]` with sub-36px touch targets, failing WCAG readability standards on high-resolution displays.
* **Fix Implemented:** Normalized base scale to `text-xs` (12px minimum for subtle metadata), `text-sm` (14px base), and `text-base`/`text-lg` for headings, with $\ge 44\text{px}$ input heights.
* **Verification:** Confirmed visual legibility across all 8 tested viewports.

---

### `BUG-005`: Static Non-Interactive Map Markers
* **Severity:** P3 (Low)
* **Affected Component:** [`frontend/src/components/TransportMap.tsx`](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/TransportMap.tsx)
* **Root Cause:** Stop markers were passive circles that only showed tooltips, requiring users to manually find stop names in dropdowns.
* **Fix Implemented:** Bound interactive Leaflet popups with `[📍 Set Origin]` and `[🎯 Set Dest]` action buttons that update the search form in real time.
* **Verification:** Tested clicking stops on the map; form inputs update instantly.

---

### `BUG-006`: Missing Journey Export / Share Capability
* **Severity:** P3 (Low)
* **Affected Component:** [`frontend/src/components/RouteResultCard.tsx`](file:///c:/Users/rajma/OneDrive/Desktop/PROJECT/Bootcamp/Codex%20%20Invincibles/aaroh-saarthi/frontend/src/components/RouteResultCard.tsx)
* **Root Cause:** No mechanism existed for passengers to copy or export journey itineraries.
* **Fix Implemented:** Added `[📋 Copy Plan]` button that formats legs, times, transfers, and fare into a clean text itinerary and writes to the system clipboard with toast feedback.
* **Verification:** Verified clipboard contents and toast confirmation.

