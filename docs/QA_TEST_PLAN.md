# Aaroh-Saarthi 2.0 — Quality Assurance Test Plan

**Document Version:** 2.0.0  
**Application:** Aaroh-Saarthi Public Transit Route Assistant & Fleet Intelligence System  
**Repository:** `https://github.com/rajmaheshwari3001-dev/Codex-Test-Model`  
**Test Lead:** Senior QA Engineer & Release Team  

---

## 1. Scope & Objectives

The purpose of this test plan is to establish a rigorous, repeatable verification matrix for the Aaroh-Saarthi transit platform across:
1. **Passenger Journey Planning:** Schedule-aware CSA routing, fastest vs. cheapest comparison, transfer validation, timetable boundaries.
2. **Interactive Transport Map:** OpenStreetMap Leaflet integration, Delhi coordinates, stop marker interaction, corridor filters.
3. **Transit Query Chat Assistant:** Deterministic rule-grounded responses, intent extraction, time parsing, optional xAI/Grok phrasing.
4. **Saved Journeys:** SQLite CRUD persistence, re-search workflows, deletion, error resilience.
5. **Fleet Intelligence & Operations:** Simulated rolling stock telemetry, incident simulation, baseline vs. candidate countermeasure evaluation, dispatcher approval workflows.
6. **SmartRoute GPS Mapping:** Verifying implementation state vs. scope requirements.
7. **Visual Redesign & Responsive Layouts:** 14-token design palette, WCAG 2.2 AA contrast, 8 viewport breakpoints.
8. **Accessibility & Security:** Keyboard navigation, ARIA semantics, focus management, data integrity.

---

## 2. Test Environment & Setup

### 2.1 Backend (FastAPI + Python 3.14)
* **Directory:** `aaroh-saarthi/backend`
* **Python Executable:** `backend/.venv/Scripts/python.exe`
* **Dependencies:** `pip install -e .` (FastAPI 0.115+, Pydantic 2.10+, NetworkX 3.4+, AnyIO, Pytest 9.1+)
* **Database:** SQLite local file (`transit.db`)
* **Start Command:**
  ```powershell
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
* **Run Test Suite:**
  ```powershell
  pytest tests/ -v
  ```

### 2.2 Frontend (React 19 + TypeScript + Vite)
* **Directory:** `aaroh-saarthi/frontend`
* **Node.js:** v24.19.0 / npm 11.17.0
* **API Proxy:** `/api` -> `http://localhost:8000` (configured in `vite.config.ts`)
* **Dev Server Command:**
  ```powershell
  npm run dev
  ```
* **Production Build Command:**
  ```powershell
  npm run build
  ```

---

## 3. Test Cases & Verification Matrix

### Module 1: Passenger Journey Planner (Weight: 20%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-PLN-01` | Search direct trip (*Dwarka S13 → Rajiv Chowk S01 @ 07:00*) | Returns single-leg journey on R01/R02 with departure 07:00 and arrival. |
| `TC-PLN-02` | Search transfer trip (*Kashmere Gate S02 → Saket S08 @ 08:00*) | Returns 2-leg journey transferring at Rajiv Chowk S01 with $\ge 2\text{ min}$ transfer wait buffer. |
| `TC-PLN-03` | Fastest vs. Cheapest comparison | If alternative routes exist with different tariffs/durations, both options are returned and compared. |
| `TC-PLN-04` | Same origin and destination (*S01 → S01*) | Blocked by UI and rejected with validation message: "Origin and destination must be different." |
| `TC-PLN-05` | Out-of-hours search (*17:30 or 21:00*) | Zero routes returned; triggers dedicated Timetable Operating Windows recovery banner with 1-click active morning presets. |
| `TC-PLN-06` | Directional loop constraint (*India Gate S06 → Kashmere Gate S02*) | R03 southbound-only topology detected; diagnostic card provides 1-click actions to board from CP S05 or travel to Saket S08. |
| `TC-PLN-07` | Calendar schedule selection (*Weekday vs Weekend*) | Backend filters trips matching `service_id` (`weekday` vs `weekend`). |
| `TC-PLN-08` | Delay impact on routing | Setting delay on a trip increases arrival time or re-routes to next available service. |

### Module 2: GIS Leaflet Transport Map (Weight: 10%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-MAP-01` | Map initial rendering & Delhi center | Centers at `[28.6139, 77.2090]` with OpenStreetMap tiles and attribution. |
| `TC-MAP-02` | Stop markers rendering | All stops rendered at real GPS coordinates; invalid/NaN coordinates safely omitted. |
| `TC-MAP-03` | Interactive stop popup | Clicking a stop opens popup with Stop Name, Zone ID, serving routes, and `[Set Origin]` / `[Set Dest]` buttons. |
| `TC-MAP-04` | Setting stops from map | Clicking `[Set Origin]` updates Origin in search form; `[Set Dest]` updates Destination. |
| `TC-MAP-05` | Corridor filter overlay | Selecting a corridor (R01, R02, R03, R04) highlights the route, dims others, and zooms to corridor bounds. |
| `TC-MAP-06` | Selected journey path | Active journey draws highlighted polyline with distinct markers: Origin 🟢, Destination 🔴, Transfer 🟣. |
| `TC-MAP-07` | Reset view control | `Reset View` button fits network bounding box. |

### Module 3: Transit Query Chat Assistant (Weight: 5%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-CHT-01` | Route query with departure time (*"Route from S02 to S08 at 08:00"*) | Parses stops and time, computes grounded route, returns departure and arrival. |
| `TC-CHT-02` | Next departure query (*"When is the next bus from ITO after 10:00?"*) | Identifies stop and time, lists next matching trip from schedule. |
| `TC-CHT-03` | Schedule hours inquiry (*"What are the active timetable hours?"*) | Informs user that demo GTFS operates 06:30 – 12:30. |
| `TC-CHT-04` | Delay inquiry (*"Are there any delays?"*) | Queries active delay service and reports real delay status or "no active delays". |
| `TC-CHT-05` | Empty or whitespace input | Form prevents submission. |
| `TC-CHT-06` | Backend offline failure | Error message shown cleanly with retry capability; does not crash UI. |

### Module 4: Saved Journeys (Weight: 5%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-SAV-01` | Bookmark route from search card | Inserts into SQLite `saved_routes` table; button displays `★ Saved`. |
| `TC-SAV-02` | List saved journeys | Displays saved route label, origin, destination, preferred time, and calendar. |
| `TC-SAV-03` | Re-search saved journey | Clicking `Search` populates form and automatically triggers search. |
| `TC-SAV-04` | Delete saved journey | Deletes record via `DELETE /api/saved-routes/{id}`; removes card from list. |
| `TC-SAV-05` | Empty saved journeys | Renders clean empty state with instruction to save routes. |

### Module 5: Fleet Intelligence & Operations (Weight: 15%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-FLT-01` | Fleet telemetry loading | Displays total fleet, active service, spares, disrupted count, and corridor health bars. |
| `TC-FLT-02` | Backend offline error state | When backend is unreachable, renders dedicated alert with failure detail and `[Retry loading fleet]` button. |
| `TC-FLT-03` | Roster search and filtering | Filters table by Route ID, operational status (`active`, `spare`, `broken_down`), and Bus ID query. |
| `TC-FLT-04` | Mechanical breakdown simulation | Injects bus failure; computes unmitigated baseline vs. countermeasure scenarios (e.g. spare dispatch). |
| `TC-FLT-05` | Corridor congestion delay simulation | Injects delay; computes passenger wait increase and schedule adherence impact. |
| `TC-FLT-06` | Visual comparative impact bars | Displays horizontal progress bars comparing Baseline vs. Mitigated values for wait time and affected riders. |
| `TC-FLT-07` | Dispatcher Approve / Reject | Approval applies reassignment; logs decision; locks secondary submissions. |

### Module 6: SmartRoute GPS Mapping (Weight: 10%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-GPS-01` | Verify GPS recording / discovery code | Audited: Codebase does not implement live GPS tracking or trace inference. Documented as NOT IMPLEMENTED. |

### Module 7: API & Backend Integration (Weight: 10%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-API-01` | Full test suite execution | `pytest tests/ -v` executes all 99 integration and unit tests successfully. |
| `TC-API-02` | FastAPI startup & CORS | Server starts cleanly; CORS middleware permits Vite frontend origin. |

### Module 8: Visual Design & Responsive Layouts (Weight: 10%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-VIS-01` | 14-token design palette | Midnight Navy, Electric Cobalt, Crimson Red, Burnt Amber, Warm Ivory, etc., configured in CSS tokens. |
| `TC-VIS-02` | 8-viewport responsive matrix | Tested across 320x568, 375x667, 430x932, 768x1024, 1024x768, 1280x720, 1440x900, 1920x1080. |

### Module 9: Accessibility (WCAG 2.2 AA) (Weight: 5%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-ACC-01` | Contrast ratios | All text-to-background combinations meet $\ge 4.5:1$ ($\ge 3:1$ for large text). |
| `TC-ACC-02` | Keyboard navigation & focus | All inputs, buttons, and route cards reachable and actionable via keyboard. |

### Module 10: Security & Performance (Weight: 10%)
| Test ID | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| `TC-SEC-01` | Secrets in repository | No API keys, credentials, or private credentials committed. |
| `TC-PERF-01` | Frontend production bundle | Bundle builds in $<4\text{s}$ with $<150\text{KB}$ gzipped JavaScript. |

