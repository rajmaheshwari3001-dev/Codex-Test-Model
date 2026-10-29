"""
Tests for the data loader service.

Verifies that CSV files are parsed correctly and lookup
dictionaries are built.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.data_loader import load_all


def test_loads_stops():
    td = load_all()
    assert len(td.stops) > 0, "No stops loaded"
    assert "S01" in td.stops_by_id, "Stop S01 not found"
    assert td.stops_by_id["S01"].stop_name == "Rajiv Chowk"


def test_loads_routes():
    td = load_all()
    assert len(td.routes) >= 4, "Expected at least 4 routes"
    assert "R01" in td.routes_by_id


def test_loads_trips():
    td = load_all()
    assert len(td.trips) > 0
    assert "T01" in td.trips_by_id
    assert td.trips_by_id["T01"].route_id == "R01"


def test_stop_times_sorted():
    td = load_all()
    for trip_id, sts in td.stop_times_by_trip.items():
        for i in range(len(sts) - 1):
            assert sts[i].stop_sequence < sts[i + 1].stop_sequence, \
                f"Stop times not sorted for trip {trip_id}"


def test_fares_loaded():
    td = load_all()
    assert len(td.fares) > 0
    assert ("R01", "3", "1") in td.fare_lookup


def test_occupancy_loaded():
    td = load_all()
    assert len(td.occupancy) > 0
    assert ("T01", "S13") in td.occupancy_lookup
