"""
Tests for saved routes – SQLite CRUD operations.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import sqlite3
from app.database import connection as db_conn
from app.database.init_db import init_database
from app.models.journey import SavedRoute
from app.services import saved_route_service as sr_service


def _setup_test_db():
    """Use an in-memory database for tests."""
    db_conn._connection = sqlite3.connect(":memory:", check_same_thread=False)
    db_conn._connection.row_factory = sqlite3.Row
    init_database()


def test_create_and_list():
    _setup_test_db()
    route = SavedRoute(
        label="Home to Office",
        origin_stop_id="S13",
        origin_stop_name="Dwarka Sec-21",
        destination_stop_id="S01",
        destination_stop_name="Rajiv Chowk",
        preferred_departure_time="08:00",
        preference="fastest",
    )
    saved = sr_service.create_saved_route(route)
    assert saved.saved_route_id is not None

    routes = sr_service.list_saved_routes()
    assert len(routes) == 1
    assert routes[0].label == "Home to Office"


def test_get_by_id():
    _setup_test_db()
    route = SavedRoute(
        label="Test Route",
        origin_stop_id="S02",
        origin_stop_name="Kashmere Gate",
        destination_stop_id="S09",
        destination_stop_name="Hauz Khas",
    )
    saved = sr_service.create_saved_route(route)
    fetched = sr_service.get_saved_route(saved.saved_route_id)
    assert fetched is not None
    assert fetched.label == "Test Route"


def test_delete():
    _setup_test_db()
    route = SavedRoute(
        label="To Delete",
        origin_stop_id="S01",
        origin_stop_name="Rajiv Chowk",
        destination_stop_id="S08",
        destination_stop_name="Saket",
    )
    saved = sr_service.create_saved_route(route)
    deleted = sr_service.delete_saved_route(saved.saved_route_id)
    assert deleted is True

    routes = sr_service.list_saved_routes()
    assert len(routes) == 0


def test_delete_nonexistent():
    _setup_test_db()
    deleted = sr_service.delete_saved_route(9999)
    assert deleted is False


def test_get_nonexistent():
    _setup_test_db()
    fetched = sr_service.get_saved_route(9999)
    assert fetched is None
