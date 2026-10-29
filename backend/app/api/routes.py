"""
API routes – passenger journey endpoints.

Endpoints:
  GET  /api/health             – health check
  GET  /api/stops              – list all stops
  GET  /api/routes             – list all routes
  POST /api/journeys/search    – find journeys
  POST /api/delays             – set a simulated delay
  GET  /api/delays             – list active delays
  DELETE /api/delays           – clear all delays
"""

from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["passenger"])


# These will be injected from main.py at startup.
_td = None
_routing_service = None
_delay_service = None


def init(td, routing_service, delay_service):
    """Inject dependencies (called once at startup)."""
    global _td, _routing_service, _delay_service
    _td = td
    _routing_service = routing_service
    _delay_service = delay_service


# --- Request / response models ---

class JourneySearchRequest(BaseModel):
    origin_stop_id: str
    destination_stop_id: str
    departure_time: str = Field(
        ..., pattern=r"^\d{2}:\d{2}$",
        description="Departure time in HH:MM format"
    )
    preference: str = Field(
        default="fastest",
        description="Search preference: 'fastest' or 'cheapest'"
    )
    service_day: Literal["weekday", "weekend"] = Field(
        default="weekday",
        description="Sample schedule category to search",
    )


class DelayRequest(BaseModel):
    trip_id: str
    delay_minutes: int = Field(..., ge=0, le=120)


# --- Endpoints ---

@router.get("/health")
def health_check():
    return {"status": "ok", "application": "Aaroh-Saarthi"}


@router.get("/stops")
def get_stops():
    """Return all available stops."""
    return [stop.model_dump() for stop in _td.stops]


@router.get("/routes")
def get_routes():
    """Return all available routes with their details."""
    result = []
    for route in _td.routes:
        # Find the stops served by the first trip on this route.
        trip = next(
            (t for t in _td.trips if t.route_id == route.route_id), None
        )
        stops_list = []
        if trip:
            for st in _td.stop_times_by_trip.get(trip.trip_id, []):
                stop = _td.stops_by_id.get(st.stop_id)
                if stop:
                    stops_list.append({
                        "stop_id": stop.stop_id,
                        "stop_name": stop.stop_name,
                        "stop_lat": stop.stop_lat,
                        "stop_lon": stop.stop_lon,
                    })
        result.append({
            **route.model_dump(),
            "stops": stops_list,
        })
    return result


@router.post("/journeys/search")
def search_journeys(req: JourneySearchRequest):
    """
    Find journey options from origin to destination.

    Returns a list of JourneyOption objects (fastest, cheapest, etc.)
    """
    # Validate preference.
    if req.preference not in ("fastest", "cheapest"):
        raise HTTPException(
            status_code=400,
            detail="preference must be 'fastest' or 'cheapest'.",
        )

    try:
        options = _routing_service.search(
            origin_id=req.origin_stop_id,
            destination_id=req.destination_stop_id,
            departure_time=req.departure_time,
            preference=req.preference,
            delay_minutes=_delay_service.get_all_delays(),
            service_day=req.service_day,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not options:
        return {
            "options": [],
            "message": (
                f"No route found from {req.origin_stop_id} to "
                f"{req.destination_stop_id} departing at {req.departure_time} "
                f"on the {req.service_day} schedule."
            ),
        }

    return {"options": [opt.model_dump() for opt in options]}


@router.post("/delays")
def set_delay(req: DelayRequest):
    """Set a simulated delay for a trip."""
    if req.trip_id not in _td.trips_by_id:
        raise HTTPException(status_code=404, detail=f"Trip {req.trip_id} not found.")
    _delay_service.set_delay(req.trip_id, req.delay_minutes)
    return {
        "message": f"Delay set for trip {req.trip_id}: {req.delay_minutes} minutes.",
        "simulated": True,
    }


@router.get("/delays")
def get_delays():
    """Return all active simulated delays."""
    return {
        "delays": _delay_service.get_all_delays(),
        "simulated": True,
    }


@router.delete("/delays")
def clear_delays():
    """Clear all simulated delays."""
    _delay_service.clear_all()
    return {"message": "All delays cleared.", "simulated": True}
