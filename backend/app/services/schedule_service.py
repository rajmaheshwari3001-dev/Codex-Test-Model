"""
Schedule service – helpers for checking service availability.

Answers questions like "is this trip running on a Saturday?" or
"when is the next departure from stop X?"
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Tuple

from app.services.data_loader import TransportData
from app.services.routing_service import time_to_minutes, minutes_to_time


def is_service_day(service_days: str, query_date: datetime) -> bool:
    """Return True if the trip runs on the given date."""
    day = query_date.strftime("%A")  # e.g. "Monday"
    if service_days == "weekday":
        return day not in ("Saturday", "Sunday")
    elif service_days == "weekend":
        return day in ("Saturday", "Sunday")
    elif service_days == "daily":
        return True
    return True  # default: assume available


def next_departures(
    td: TransportData,
    stop_id: str,
    after_time: str,
    limit: int = 5,
    service_date: Optional[datetime] = None,
) -> List[dict]:
    """
    Find the next `limit` departures from a stop after a given time.

    Returns a list of dicts:
      [{ trip_id, route_id, route_name, departure_time }, …]
    """
    after_min = time_to_minutes(after_time)
    results: List[Tuple[int, dict]] = []

    for trip_id, stop_times in td.stop_times_by_trip.items():
        trip = td.trips_by_id.get(trip_id)
        if not trip:
            continue
        if service_date and not is_service_day(trip.service_days, service_date):
            continue

        for st in stop_times:
            if st.stop_id == stop_id:
                dep = time_to_minutes(st.departure_time)
                if dep >= after_min:
                    route = td.routes_by_id.get(trip.route_id)
                    results.append((dep, {
                        "trip_id": trip_id,
                        "route_id": trip.route_id,
                        "route_name": route.route_name if route else trip.route_id,
                        "departure_time": st.departure_time,
                    }))

    results.sort(key=lambda r: r[0])
    return [r[1] for r in results[:limit]]
