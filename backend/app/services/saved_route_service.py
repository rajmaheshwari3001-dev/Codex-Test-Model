"""
Saved-route service – CRUD operations persisted in SQLite.

This lets passengers save frequently used origin-destination pairs
so they can re-search with one click.
"""

from __future__ import annotations

from typing import List, Optional

from app.database.connection import get_connection
from app.models.journey import SavedRoute


def create_saved_route(route: SavedRoute) -> SavedRoute:
    """Insert a new saved route and return it with its generated ID."""
    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO saved_routes
            (label, origin_stop_id, origin_stop_name,
             destination_stop_id, destination_stop_name,
             preferred_departure_time, preference)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            route.label,
            route.origin_stop_id,
            route.origin_stop_name,
            route.destination_stop_id,
            route.destination_stop_name,
            route.preferred_departure_time,
            route.preference,
        ),
    )
    conn.commit()
    route.saved_route_id = cursor.lastrowid
    return route


def list_saved_routes() -> List[SavedRoute]:
    """Return all saved routes, newest first."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM saved_routes ORDER BY created_at DESC"
    ).fetchall()
    return [
        SavedRoute(
            saved_route_id=row["id"],
            label=row["label"],
            origin_stop_id=row["origin_stop_id"],
            origin_stop_name=row["origin_stop_name"],
            destination_stop_id=row["destination_stop_id"],
            destination_stop_name=row["destination_stop_name"],
            preferred_departure_time=row["preferred_departure_time"],
            preference=row["preference"],
        )
        for row in rows
    ]


def get_saved_route(saved_route_id: int) -> Optional[SavedRoute]:
    """Retrieve a single saved route by ID."""
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM saved_routes WHERE id = ?", (saved_route_id,)
    ).fetchone()
    if not row:
        return None
    return SavedRoute(
        saved_route_id=row["id"],
        label=row["label"],
        origin_stop_id=row["origin_stop_id"],
        origin_stop_name=row["origin_stop_name"],
        destination_stop_id=row["destination_stop_id"],
        destination_stop_name=row["destination_stop_name"],
        preferred_departure_time=row["preferred_departure_time"],
        preference=row["preference"],
    )


def delete_saved_route(saved_route_id: int) -> bool:
    """Delete a saved route. Returns True if a row was deleted."""
    conn = get_connection()
    cursor = conn.execute(
        "DELETE FROM saved_routes WHERE id = ?", (saved_route_id,)
    )
    conn.commit()
    return cursor.rowcount > 0
