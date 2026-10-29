# Testing Guide

## Prerequisites

- Backend virtual environment activated
- Backend dependencies installed

## Running All Tests

```powershell
cd aaroh-saarthi\backend
.venv\Scripts\Activate.ps1
python -m pytest tests/ -v
```

## Test Summary (49 tests)

### test_data_loader.py (6 tests)
| Test | What it verifies |
|------|-----------------|
| `test_loads_stops` | Stops CSV loads, S01 = "Rajiv Chowk" |
| `test_loads_routes` | At least 4 routes loaded |
| `test_loads_trips` | Trips load, T01 belongs to R01 |
| `test_stop_times_sorted` | Stop times are sorted by sequence |
| `test_fares_loaded` | Fare lookup works for zone 3→1 |
| `test_occupancy_loaded` | Occupancy data accessible |

### test_routing.py (13 tests)
| Test | What it verifies |
|------|-----------------|
| `test_direct_journey` | S13→S01 returns a result with correct origin/dest |
| `test_transfer_journey` | S13→S09 requires ≥2 legs (transfer at S05) |
| `test_fastest_vs_cheapest` | Both objectives return results |
| `test_late_departure_no_route` | No route at 23:00 |
| `test_delay_affects_routing` | Delayed arrival ≥ normal arrival |
| `test_unreachable_destination` | Returns list (empty or with results) |
| `test_no_service_at_midnight` | No service at 23:59 |
| `test_missing_fare_data` | Doesn't crash with incomplete fares |
| `test_invalid_origin` | ValueError for unknown stop |
| `test_invalid_destination` | ValueError for unknown stop |
| `test_same_origin_destination` | ValueError when origin = destination |
| `test_time_to_minutes` | 08:30 = 510 minutes |
| `test_minutes_to_time` | 510 = "08:30" |

### test_schedules.py (5 tests)
| Test | What it verifies |
|------|-----------------|
| `test_next_departures` | Finds departures from S02 after 06:00 |
| `test_no_departures_late` | No departures from S02 after 23:00 |
| `test_delay_service_set_get` | Set/get delay works |
| `test_delay_service_clear` | Clear removes all delays |
| `test_delay_service_zero_removes` | Setting delay=0 removes it |

### test_saved_routes.py (5 tests)
| Test | What it verifies |
|------|-----------------|
| `test_create_and_list` | Create a route, list shows it |
| `test_get_by_id` | Retrieve by ID works |
| `test_delete` | Delete removes the route |
| `test_delete_nonexistent` | Deleting ID 9999 returns False |
| `test_get_nonexistent` | Getting ID 9999 returns None |

### test_delays.py (3 tests)
| Test | What it verifies |
|------|-----------------|
| `test_delay_increases_travel_time` | Delayed arrival ≥ normal |
| `test_delay_warnings_present` | Delay warnings list exists |
| `test_no_delay_no_warnings` | No warnings without delays |

### test_fleet_simulator.py (6 tests)
| Test | What it verifies |
|------|-----------------|
| `test_fleet_initialised` | Buses created, 2 spares exist |
| `test_breakdown_evaluation` | Baseline + ≥2 responses returned |
| `test_delay_evaluation` | Delay scenario produces responses |
| `test_scenarios_use_same_initial_state` | State unchanged after eval |
| `test_infeasible_response_not_recommended` | No-spare = infeasible |
| `test_nonexistent_bus` | Error returned for ghost bus |

### test_api.py (11 tests)
| Test | What it verifies |
|------|-----------------|
| `test_health` | GET /api/health returns ok |
| `test_get_stops` | ≥15 stops returned |
| `test_get_routes` | ≥4 routes returned |
| `test_journey_search_valid` | POST search returns options |
| `test_journey_search_invalid_stop` | 400 for bad stop ID |
| `test_journey_search_no_route` | Empty options at 23:00 |
| `test_saved_routes_crud` | Create/list/get/delete lifecycle |
| `test_chat_endpoint` | Chat returns reply + intent |
| `test_fleet_state` | Fleet state returned with simulated=true |
| `test_fleet_disruption` | Disruption evaluation works |
| `test_delays_crud` | Set/list/clear delays |

## Expected Output

```
49 passed in ~1.2s
```

## Writing New Tests

1. Create a file `tests/test_yourfeature.py`
2. Import the service you're testing
3. Write functions starting with `test_`
4. Use `assert` to check results
5. Run: `python -m pytest tests/test_yourfeature.py -v`

Example:
```python
from app.services.routing_service import time_to_minutes

def test_noon():
    assert time_to_minutes("12:00") == 720
```
