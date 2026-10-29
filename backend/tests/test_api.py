"""
API integration tests using FastAPI's TestClient.

The TestClient must be used as a context manager so the app lifespan
runs (loading data, creating the DB, etc.).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["application"] == "Aaroh-Saarthi"


def test_get_stops(client):
    resp = client.get("/api/stops")
    assert resp.status_code == 200
    stops = resp.json()
    assert len(stops) >= 15


def test_get_routes(client):
    resp = client.get("/api/routes")
    assert resp.status_code == 200
    routes = resp.json()
    assert len(routes) >= 4


def test_journey_search_valid(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S13",
        "destination_stop_id": "S01",
        "departure_time": "07:00",
        "preference": "fastest",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "options" in data
    assert len(data["options"]) >= 1


def test_journey_search_invalid_stop(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "INVALID",
        "destination_stop_id": "S01",
        "departure_time": "08:00",
        "preference": "fastest",
    })
    assert resp.status_code == 400


def test_journey_search_no_route(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S13",
        "destination_stop_id": "S01",
        "departure_time": "23:00",
        "preference": "fastest",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["options"]) == 0


def test_saved_routes_crud(client):
    # Create
    resp = client.post("/api/saved-routes", json={
        "label": "Test",
        "origin_stop_id": "S01",
        "origin_stop_name": "Rajiv Chowk",
        "destination_stop_id": "S08",
        "destination_stop_name": "Saket",
    })
    assert resp.status_code == 200
    saved_id = resp.json()["saved_route_id"]

    # List
    resp = client.get("/api/saved-routes")
    assert resp.status_code == 200
    assert any(r["saved_route_id"] == saved_id for r in resp.json())

    # Get
    resp = client.get(f"/api/saved-routes/{saved_id}")
    assert resp.status_code == 200

    # Delete
    resp = client.delete(f"/api/saved-routes/{saved_id}")
    assert resp.status_code == 200


def test_chat_endpoint(client):
    resp = client.post("/api/chat", json={
        "message": "How do I get from Rajiv Chowk to Saket?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "intent" in data


def test_fleet_state(client):
    resp = client.get("/api/fleet/state")
    assert resp.status_code == 200
    data = resp.json()
    assert "buses" in data
    assert data["simulated"] is True


def test_fleet_disruption(client):
    resp = client.post("/api/fleet/disruption", json={
        "disruption_type": "breakdown",
        "affected_bus_id": "B-T01",
        "description": "Test breakdown",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["baseline"] is not None
    assert len(data["responses"]) >= 1


def test_delays_crud(client):
    # Set
    resp = client.post("/api/delays", json={"trip_id": "T01", "delay_minutes": 10})
    assert resp.status_code == 200

    # List
    resp = client.get("/api/delays")
    assert resp.status_code == 200
    assert "T01" in resp.json()["delays"]

    # Clear
    resp = client.delete("/api/delays")
    assert resp.status_code == 200
    resp = client.get("/api/delays")
    assert len(resp.json()["delays"]) == 0
