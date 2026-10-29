"""
Journey data models – the output of the routing engine.

These describe what a "route search result" looks like from the API's
perspective.  The frontend consumes exactly this shape.
"""

from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel


class JourneyLeg(BaseModel):
    """
    One continuous segment of a journey (board a vehicle, ride it,
    then alight).  A direct journey has one leg.  A transfer journey
    has two or more legs.
    """

    leg_index: int
    trip_id: str
    route_id: str
    route_name: str
    route_color: str
    board_stop_id: str
    board_stop_name: str
    alight_stop_id: str
    alight_stop_name: str
    departure_time: str   # HH:MM - scheduled
    arrival_time: str     # HH:MM - scheduled
    intermediate_stops: List[str] = []  # stop names between board and alight
    intermediate_stop_ids: List[str] = []
    fare: Optional[float] = None
    currency: str = "INR"


class TransferInfo(BaseModel):
    """Details about waiting at a transfer stop."""

    at_stop_id: str
    at_stop_name: str
    wait_minutes: int


class JourneyOption(BaseModel):
    """
    A complete journey from origin to destination.

    Contains one or more legs.  The API returns multiple options (e.g.
    fastest and cheapest) so the passenger can choose.
    """

    option_id: str                   # e.g. "fastest", "cheapest_1"
    label: str                       # human-readable tag
    total_duration_minutes: int
    departure_time: str
    arrival_time: str
    legs: List[JourneyLeg]
    transfers: List[TransferInfo] = []
    total_fare: Optional[float] = None
    currency: str = "INR"
    fare_available: bool = False
    crowding_warnings: List[str] = []
    delay_warnings: List[str] = []
    data_status: str = "scheduled"   # scheduled | estimated | simulated
    warnings: List[str] = []


class SavedRoute(BaseModel):
    """A journey saved by the passenger for quick reuse."""

    saved_route_id: Optional[int] = None
    label: str
    origin_stop_id: str
    origin_stop_name: str
    destination_stop_id: str
    destination_stop_name: str
    preferred_departure_time: str = ""
    preference: str = "fastest"      # fastest | cheapest
