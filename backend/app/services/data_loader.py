"""
Data loader – reads CSV files and creates in-memory lookup structures.

HOW IT WORKS:
  On startup the application calls `load_all()`.  Each CSV is read into
  a list of Pydantic models (Stop, Route, etc.) and also stored in
  convenience dictionaries keyed by their primary identifier.

  Other services import `data` from this module and access e.g.
  `data.stops_by_id["S01"]`.

WHY NOT A DATABASE FOR SOURCE DATA?
  For V1, keeping source data in CSV makes it trivial to inspect,
  edit, and version-control the demo dataset.  SQLite is used only
  for mutable user data (saved routes).
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List

from app.config import settings
from app.models.transport import (
    Fare,
    Occupancy,
    Route,
    Stop,
    StopTime,
    Trip,
)


class TransportData:
    """Container for all loaded transport data."""

    def __init__(self) -> None:
        self.stops: List[Stop] = []
        self.routes: List[Route] = []
        self.trips: List[Trip] = []
        self.stop_times: List[StopTime] = []
        self.fares: List[Fare] = []
        self.occupancy: List[Occupancy] = []

        # Quick-lookup dictionaries built after loading.
        self.stops_by_id: Dict[str, Stop] = {}
        self.routes_by_id: Dict[str, Route] = {}
        self.trips_by_id: Dict[str, Trip] = {}
        # stop_times grouped by trip_id, sorted by sequence
        self.stop_times_by_trip: Dict[str, List[StopTime]] = {}
        # fare indexed as (route_id, from_zone, to_zone)
        self.fare_lookup: Dict[tuple, Fare] = {}
        # occupancy indexed as (trip_id, stop_id)
        self.occupancy_lookup: Dict[tuple, Occupancy] = {}


def _read_csv(file_name: str) -> List[dict]:
    """Read a CSV file from the data directory and return rows as dicts."""
    path = Path(settings.data_dir) / file_name
    if not path.exists():
        return []
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def load_all() -> TransportData:
    """
    Read every CSV and build the full TransportData object.

    Returns:
        A populated TransportData instance ready for the routing engine.
    """
    td = TransportData()

    # -- Stops --
    for row in _read_csv("stops.csv"):
        stop = Stop(
            stop_id=row["stop_id"],
            stop_name=row["stop_name"],
            stop_lat=float(row["stop_lat"]),
            stop_lon=float(row["stop_lon"]),
            zone_id=row.get("zone_id", ""),
        )
        td.stops.append(stop)
        td.stops_by_id[stop.stop_id] = stop

    # -- Routes --
    for row in _read_csv("routes.csv"):
        route = Route(
            route_id=row["route_id"],
            route_name=row["route_name"],
            route_type=row.get("route_type", "bus"),
            route_color=row.get("route_color", "#666666"),
            description=row.get("description", ""),
        )
        td.routes.append(route)
        td.routes_by_id[route.route_id] = route

    # -- Trips --
    for row in _read_csv("trips.csv"):
        trip = Trip(
            trip_id=row["trip_id"],
            route_id=row["route_id"],
            direction=row.get("direction", "outbound"),
            service_days=row.get("service_days", "weekday"),
        )
        td.trips.append(trip)
        td.trips_by_id[trip.trip_id] = trip

    # -- Stop Times --
    for row in _read_csv("stop_times.csv"):
        st = StopTime(
            trip_id=row["trip_id"],
            stop_id=row["stop_id"],
            stop_sequence=int(row["stop_sequence"]),
            arrival_time=row["arrival_time"],
            departure_time=row["departure_time"],
        )
        td.stop_times.append(st)
        td.stop_times_by_trip.setdefault(st.trip_id, []).append(st)

    # Sort each trip's stop_times by sequence.
    for trip_id in td.stop_times_by_trip:
        td.stop_times_by_trip[trip_id].sort(key=lambda s: s.stop_sequence)

    # -- Fares --
    for row in _read_csv("fares.csv"):
        fare = Fare(
            route_id=row["route_id"],
            from_zone_id=row["from_zone_id"],
            to_zone_id=row["to_zone_id"],
            fare_amount=float(row["fare_amount"]),
            currency=row.get("currency", "INR"),
        )
        td.fares.append(fare)
        key = (fare.route_id, fare.from_zone_id, fare.to_zone_id)
        td.fare_lookup[key] = fare

    # -- Occupancy --
    for row in _read_csv("occupancy.csv"):
        occ = Occupancy(
            trip_id=row["trip_id"],
            stop_id=row["stop_id"],
            occupancy_level=row.get("occupancy_level", "unknown"),
            typical_load_percent=int(row.get("typical_load_percent", -1)),
        )
        td.occupancy.append(occ)
        td.occupancy_lookup[(occ.trip_id, occ.stop_id)] = occ

    return td


# Module-level singleton – populated on first import of main.py
data = TransportData()
