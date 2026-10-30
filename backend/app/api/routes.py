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
    mode_preference: Literal["all", "metro", "bus", "auto"] = Field(
        default="all",
        description="Filter by transport mode: 'all', 'metro', 'bus', or 'auto'",
    )
    include_auto: bool = Field(
        default=False,
        description="Whether to include auto-rickshaw option in response options",
    )
    max_budget: Optional[float] = Field(
        default=None,
        description="Maximum budget in INR to check against fare",
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
    # Normalize preference (defaults to 'fastest' or 'cheapest')
    pref = (req.preference or "fastest").lower()
    normalized_pref = "cheapest" if pref in ("cheapest", "cost", "cheap") else "fastest"

    try:
        options = _routing_service.search(
            origin_id=req.origin_stop_id,
            destination_id=req.destination_stop_id,
            departure_time=req.departure_time,
            preference=normalized_pref,
            delay_minutes=_delay_service.get_all_delays(),
            service_day=req.service_day,
            mode_preference=req.mode_preference,
            max_budget=req.max_budget,
        )
        if req.include_auto and req.mode_preference != "auto":
            auto_opt = _routing_service.get_poochho_auto_option(
                req.origin_stop_id, req.destination_stop_id, req.departure_time
            )
            options.append(auto_opt)

        poochho_estimate = _routing_service.get_poochho_estimate(
            req.origin_stop_id, req.destination_stop_id, req.departure_time
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
            "poochho_estimate": poochho_estimate,
        }

    return {
        "options": [opt.model_dump() for opt in options],
        "poochho_estimate": poochho_estimate,
    }


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


@router.get("/data/provenance")
@router.get("/transit/provenance")
def get_data_provenance():
    """
    Return metadata, data provenance, and scraping audit details
    for Delhi Buses (DTC/DoT) and Delhi Metro (DMRC).
    """
    import json
    from pathlib import Path
    meta_path = Path(__file__).resolve().parent.parent / "data" / "metadata.json"
    if meta_path.exists():
        with open(meta_path, encoding="utf-8") as f:
            return json.load(f)

    return {
        "application": "Aaroh-Saarthi Delhi Multimodal Transit Engine",
        "version": "2.1.0",
        "status": "ready",
        "datasets": {
            "delhi_buses": "Delhi Transport Stack & DTC Verified Stages",
            "delhi_metro": "Delhi Transport Stack & DMRC Verified Slabs",
        },
        "stops_count": len(_td.stops_by_id) if _td else 0,
        "routes_count": len(_td.routes_by_id) if _td else 0,
    }


@router.post("/data/refresh")
@router.post("/transit/refresh")
def refresh_transit_data(remote: bool = False):
    """
    Trigger the transit data import / refresh pipeline.
    If remote=True, connects to external APIs/scrapers;
    If remote=False, re-normalizes from local verified GTFS and fare tables.
    """
    global _td, _routing_service
    from app.pipeline.importer import DataImporter
    from app.services.data_loader import load_all

    importer = DataImporter()
    result = importer.run_pipeline(download_remote=remote)

    new_td = load_all()
    _td = new_td
    if _routing_service:
        _routing_service.reload(new_td)

    import app.services.data_loader as dl
    dl.data = new_td

    return {
        "message": "Transit data pipeline completed and reloaded into routing engine.",
        "pipeline_result": result,
    }


@router.get("/poochho/estimate")
def get_poochho_estimate(
    origin_stop_id: str,
    destination_stop_id: str,
    departure_time: str = "12:00",
):
    """
    Get PoochhO (DIMTS) statutory auto-rickshaw and taxi fare, distance,
    travel time, and first/last-mile feeder recommendation.
    """
    if not _td:
        raise HTTPException(status_code=503, detail="Transit data not loaded.")
    if origin_stop_id not in _td.stops_by_id:
        raise HTTPException(status_code=400, detail=f"Unknown origin stop ID: {origin_stop_id!r}")
    if destination_stop_id not in _td.stops_by_id:
        raise HTTPException(status_code=400, detail=f"Unknown destination stop ID: {destination_stop_id!r}")

    estimate = _routing_service.get_poochho_estimate(
        origin_stop_id, destination_stop_id, departure_time
    )
    return estimate


@router.get("/poochho/info")
def get_poochho_info():
    """Return PoochhO (DIMTS) integration details, features, and statutory tariff formulas."""
    from app.pipeline.sources.poochho_scraper import PoochhOScraper
    scraper = PoochhOScraper()
    return scraper.fetch_app_metadata()
