# Data Dictionary

All fields used in the Aaroh-Saarthi transport dataset.

> **Important:** All data is synthetic and created for demonstration purposes. No values represent real transit operations.

## Stop

| Field     | Type   | Example         | Description                                |
|-----------|--------|-----------------|--------------------------------------------|
| stop_id   | string | `S01`           | Unique identifier for the stop             |
| stop_name | string | `Rajiv Chowk`   | Human-readable stop name                   |
| stop_lat  | float  | `28.6328`       | Latitude (WGS84, approximate Delhi area)   |
| stop_lon  | float  | `77.2197`       | Longitude (WGS84)                          |
| zone_id   | string | `1`             | Fare zone: 1 (central), 2 (mid), 3 (outer)|

## Route

| Field        | Type   | Example                    | Description                         |
|--------------|--------|----------------------------|-------------------------------------|
| route_id     | string | `R01`                      | Unique route identifier             |
| route_name   | string | `Blue Line`                | Display name                        |
| route_type   | string | `bus`                      | Always "bus" in V1                  |
| route_color  | string | `#2196F3`                  | Hex color for UI/map rendering      |
| description  | string | `Dwarka to Rajiv Chowk...` | Route description                   |

## Trip

| Field        | Type   | Example     | Description                              |
|--------------|--------|-------------|------------------------------------------|
| trip_id      | string | `T01`       | Unique trip identifier                   |
| route_id     | string | `R01`       | Parent route                             |
| direction    | string | `outbound`  | "outbound" or "inbound"                  |
| service_days | string | `weekday`   | "weekday", "weekend", or "daily"         |

## StopTime

| Field          | Type   | Example | Description                                |
|----------------|--------|---------|--------------------------------------------|
| trip_id        | string | `T01`   | Which trip                                 |
| stop_id        | string | `S13`   | Which stop                                 |
| stop_sequence  | int    | `1`     | Order in trip (1 = first stop)             |
| arrival_time   | string | `07:00` | Scheduled arrival (HH:MM)                 |
| departure_time | string | `07:00` | Scheduled departure (HH:MM)               |

## Fare

| Field        | Type   | Example | Description                                |
|--------------|--------|---------|--------------------------------------------|
| route_id     | string | `R01`   | Which route                                |
| from_zone_id | string | `3`     | Boarding fare zone                         |
| to_zone_id   | string | `1`     | Alighting fare zone                        |
| fare_amount  | float  | `30`    | Fare in specified currency                 |
| currency     | string | `INR`   | Currency code                              |

## Occupancy

| Field               | Type   | Example  | Description                           |
|---------------------|--------|----------|---------------------------------------|
| trip_id             | string | `T01`    | Which trip                            |
| stop_id             | string | `S13`    | At which stop                         |
| occupancy_level     | string | `low`    | "low" / "medium" / "high" / "unknown" |
| typical_load_percent| int    | `20`     | Estimated % of capacity. -1 = unknown |

## JourneyOption (API response)

| Field                  | Type     | Description                               |
|------------------------|----------|-------------------------------------------|
| option_id              | string   | "fastest" or "cheapest"                   |
| label                  | string   | Human-readable label                      |
| total_duration_minutes | int      | Total journey time in minutes             |
| departure_time         | string   | When the passenger departs (HH:MM)       |
| arrival_time           | string   | Estimated arrival (HH:MM)                |
| legs                   | array    | List of JourneyLeg objects                |
| transfers              | array    | List of TransferInfo objects              |
| total_fare             | float?   | Total fare (null if unavailable)          |
| fare_available         | boolean  | Whether fare data was found               |
| crowding_warnings      | string[] | Crowding alerts                           |
| delay_warnings         | string[] | Delay alerts (simulated)                  |
| data_status            | string   | "scheduled" / "estimated" / "simulated"   |

## BusState (Fleet API)

| Field              | Type   | Description                              |
|--------------------|--------|------------------------------------------|
| bus_id             | string | Unique bus identifier                    |
| route_id           | string | Assigned route (empty for spare)         |
| trip_id            | string | Assigned trip (empty for spare)          |
| status             | string | "active" / "spare" / "broken_down" / "reassigned" |
| occupancy_percent  | int    | Current load as percentage of capacity   |
| delay_minutes      | int    | Current delay (0 = on time)              |

## ScenarioMetrics (Fleet API)

| Field                          | Type   | Description                                |
|--------------------------------|--------|--------------------------------------------|
| scenario_name                  | string | Label for this scenario                    |
| affected_passengers            | int    | Estimated passengers impacted              |
| average_wait_increase_minutes  | float  | Average extra wait time                    |
| delayed_trips                  | int    | Number of trips with degraded service      |
| fleet_utilization_percent      | float  | Active buses / total buses × 100           |
| total_buses_active             | int    | Buses currently in service                 |
| total_buses_available          | int    | Buses that could serve (active+spare)      |
| crowding_increase_percent      | float  | Estimated crowding increase on other routes|
