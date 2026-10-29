"""
Crowd service – provides occupancy information for trips.

Occupancy data comes from the loaded CSV.  In a real system this would
be updated from live sensors; here it is static sample data.
"""

from __future__ import annotations

from typing import Optional

from app.services.data_loader import TransportData


def get_occupancy(td: TransportData, trip_id: str, stop_id: str) -> dict:
    """
    Return occupancy info for a trip at a specific stop.

    Returns:
        dict with keys: level ("low"/"medium"/"high"/"unknown"),
                        load_percent (int, -1 if unavailable),
                        available (bool).
    """
    occ = td.occupancy_lookup.get((trip_id, stop_id))
    if occ:
        return {
            "level": occ.occupancy_level,
            "load_percent": occ.typical_load_percent,
            "available": True,
        }
    return {
        "level": "unknown",
        "load_percent": -1,
        "available": False,
    }


def trip_crowding_summary(td: TransportData, trip_id: str) -> dict:
    """
    Summarise the crowding for an entire trip.

    Returns the worst occupancy level across all recorded stops.
    """
    worst_level = "unknown"
    worst_pct = -1
    any_data = False
    priority = {"low": 1, "medium": 2, "high": 3, "unknown": 0}

    for (t_id, s_id), occ in td.occupancy_lookup.items():
        if t_id != trip_id:
            continue
        any_data = True
        if priority.get(occ.occupancy_level, 0) > priority.get(worst_level, 0):
            worst_level = occ.occupancy_level
            worst_pct = occ.typical_load_percent

    return {
        "trip_id": trip_id,
        "worst_level": worst_level,
        "worst_load_percent": worst_pct,
        "data_available": any_data,
    }
