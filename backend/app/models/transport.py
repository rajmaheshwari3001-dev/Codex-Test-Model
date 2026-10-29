"""
Pydantic models for transport data.

These models describe the *domain objects* – stops, routes, trips,
stop-times, fares, and occupancy – used throughout the backend.

WHY PYDANTIC?
  Pydantic gives automatic validation and JSON serialization which
  FastAPI can return directly as API responses.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Stop(BaseModel):
    """A physical location where passengers board or alight."""

    stop_id: str
    stop_name: str
    stop_lat: float
    stop_lon: float
    zone_id: str = ""


class Route(BaseModel):
    """A named bus/transit line that connects several stops."""

    route_id: str
    route_name: str
    route_type: str = "bus"
    route_color: str = "#666666"
    description: str = ""


class Trip(BaseModel):
    """One scheduled traversal of a route at a specific time."""

    trip_id: str
    route_id: str
    direction: str = "outbound"
    service_days: str = "weekday"


class StopTime(BaseModel):
    """Scheduled arrival/departure of a trip at a particular stop."""

    trip_id: str
    stop_id: str
    stop_sequence: int
    arrival_time: str   # HH:MM format
    departure_time: str  # HH:MM format


class Fare(BaseModel):
    """Fare rule between two fare-zones on a route."""

    route_id: str
    from_zone_id: str
    to_zone_id: str
    fare_amount: float
    currency: str = "INR"


class Occupancy(BaseModel):
    """Simulated crowding information for a trip at a stop."""

    trip_id: str
    stop_id: str
    occupancy_level: str = "unknown"  # low | medium | high | unknown
    typical_load_percent: int = -1
