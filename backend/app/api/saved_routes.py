"""
API routes – saved routes CRUD endpoints.

Endpoints:
  POST   /api/saved-routes               – save a new route
  GET    /api/saved-routes               – list all saved routes
  GET    /api/saved-routes/{id}          – get one saved route
  DELETE /api/saved-routes/{id}          – delete a saved route
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.journey import SavedRoute
from app.services import saved_route_service as sr_service

router = APIRouter(prefix="/api/saved-routes", tags=["saved-routes"])


class SaveRouteRequest(BaseModel):
    label: str
    origin_stop_id: str
    origin_stop_name: str
    destination_stop_id: str
    destination_stop_name: str
    preferred_departure_time: str = ""
    preference: str = "fastest"


@router.post("")
def create_saved_route(req: SaveRouteRequest):
    """Save a frequently used route."""
    route = SavedRoute(**req.model_dump())
    saved = sr_service.create_saved_route(route)
    return saved.model_dump()


@router.get("")
def list_saved_routes():
    """Return all saved routes."""
    return [r.model_dump() for r in sr_service.list_saved_routes()]


@router.get("/{saved_route_id}")
def get_saved_route(saved_route_id: int):
    """Retrieve a single saved route."""
    route = sr_service.get_saved_route(saved_route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Saved route not found.")
    return route.model_dump()


@router.delete("/{saved_route_id}")
def delete_saved_route(saved_route_id: int):
    """Delete a saved route."""
    deleted = sr_service.delete_saved_route(saved_route_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Saved route not found.")
    return {"message": "Saved route deleted."}
