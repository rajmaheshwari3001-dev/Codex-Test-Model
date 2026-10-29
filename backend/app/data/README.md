# Aaroh-Saarthi Dataset

## Overview

This directory contains the **synthetic demonstration dataset** used by Aaroh-Saarthi V1.

**All data in this directory is fictional.** It was created specifically for hackathon demonstration and does not represent any real transit system, schedule, fare structure, or passenger count.

## File Descriptions

### stops.csv
| Field      | Type   | Description                                        |
|------------|--------|----------------------------------------------------|
| stop_id    | string | Unique identifier (e.g. S01)                       |
| stop_name  | string | Human-readable stop name                           |
| stop_lat   | float  | Latitude (WGS84) – approximate Delhi-area coords   |
| stop_lon   | float  | Longitude (WGS84)                                  |
| zone_id    | string | Fare zone (1, 2, or 3)                             |

15 stops across 3 fare zones, with coordinates placed in the greater Delhi area for realistic map display.

### routes.csv
| Field        | Type   | Description                                     |
|--------------|--------|-------------------------------------------------|
| route_id     | string | Unique route identifier (e.g. R01)              |
| route_name   | string | Human-readable name (e.g. "Blue Line")          |
| route_type   | string | Mode of transport (always "bus" in V1)          |
| route_color  | string | Hex color for map/UI display                    |
| description  | string | Brief description of the route                  |

4 routes: Blue Line, Green Line, Red Ring, Yellow Express.

### trips.csv
| Field        | Type   | Description                                     |
|--------------|--------|-------------------------------------------------|
| trip_id      | string | Unique trip identifier (e.g. T01)               |
| route_id     | string | Which route this trip belongs to                |
| direction    | string | "outbound" or "inbound"                         |
| service_days | string | "weekday", "weekend", or "daily"                |

19 trips across 4 routes, including weekday and weekend services.

### stop_times.csv
| Field          | Type   | Description                                   |
|----------------|--------|-----------------------------------------------|
| trip_id        | string | Which trip this stop-time belongs to           |
| stop_id        | string | Which stop                                    |
| stop_sequence  | int    | Order of this stop in the trip (1-based)       |
| arrival_time   | string | Scheduled arrival (HH:MM format)              |
| departure_time | string | Scheduled departure (HH:MM format)            |

Each trip has 4-6 stop-times defining when the bus arrives and departs each stop.

### fares.csv
| Field        | Type   | Description                                     |
|--------------|--------|-------------------------------------------------|
| route_id     | string | Which route this fare applies to                |
| from_zone_id | string | Boarding zone                                   |
| to_zone_id   | string | Alighting zone                                  |
| fare_amount  | float  | Fare in INR                                     |
| currency     | string | Always "INR"                                    |

Fares are zone-based: same zone = cheapest, cross-zone = more expensive.

### occupancy.csv
| Field               | Type   | Description                              |
|---------------------|--------|------------------------------------------|
| trip_id             | string | Which trip                               |
| stop_id             | string | At which stop                            |
| occupancy_level     | string | "low", "medium", or "high"              |
| typical_load_percent| int    | Estimated percentage of capacity used    |

Not every trip+stop combination has occupancy data. Missing data = "unknown".

## Limitations

- All schedule times are fictional and do not match any real bus schedule.
- Geographic coordinates are approximate and placed for map demo purposes.
- Fares do not reflect real pricing.
- Occupancy data is static – it does not change during a session.
- The network is small (15 stops, 4 routes) for testing and demo purposes.
- No GTFS feed is consumed; the CSV format is inspired by GTFS but simplified.
