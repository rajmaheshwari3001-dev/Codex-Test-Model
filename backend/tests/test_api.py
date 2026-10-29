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
from app.api import fleet as fleet_api


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


def test_journey_search_rejects_out_of_range_time(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S13",
        "destination_stop_id": "S01",
        "departure_time": "08:75",
        "preference": "fastest",
    })
    assert resp.status_code == 400
    assert "Invalid time" in resp.json()["detail"]


def test_journey_search_rejects_malformed_time(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S13",
        "destination_stop_id": "S01",
        "departure_time": "8:00",
        "preference": "fastest",
    })
    assert resp.status_code == 422


def test_journey_search_rejects_unknown_preference(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S13",
        "destination_stop_id": "S01",
        "departure_time": "08:00",
        "preference": "shortest",
    })
    assert resp.status_code == 400
    assert "preference must be" in resp.json()["detail"]


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
        "message": "Tell me about route R01"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "intent" in data
    assert data["intent"] == "explain_route"
    assert data["data"]["route_id"] == "R01"
    assert "Blue Line" in data["reply"]


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


def test_delay_changes_journey_times_and_crowding_is_reported(client):
    request = {
        "origin_stop_id": "S05",
        "destination_stop_id": "S01",
        "departure_time": "07:56",
        "preference": "fastest",
    }
    baseline = client.post("/api/journeys/search", json=request)
    assert baseline.status_code == 200
    baseline_option = baseline.json()["options"][0]
    assert baseline_option["arrival_time"] == "08:00"
    assert any("crowded" in warning for warning in baseline_option["crowding_warnings"])

    delay = client.post(
        "/api/delays", json={"trip_id": "T01", "delay_minutes": 15}
    )
    assert delay.status_code == 200

    delayed = client.post("/api/journeys/search", json=request)
    assert delayed.status_code == 200
    delayed_option = delayed.json()["options"][0]
    assert delayed_option["arrival_time"] == "08:15"
    assert any("15 minutes late" in warning for warning in delayed_option["delay_warnings"])
    assert delayed_option["data_status"] == "simulated"

    client.delete("/api/delays")


def test_fleet_approval_and_rejection_are_explicit(client):
    result = client.post("/api/fleet/disruption", json={
        "disruption_type": "breakdown",
        "affected_bus_id": "B-T01",
        "description": "Approval workflow test",
    })
    assert result.status_code == 200
    payload = result.json()
    disruption_id = payload["disruption"]["disruption_id"]
    response_id = payload["recommended_response_id"]

    approved = client.post("/api/fleet/approve", json={
        "disruption_id": disruption_id,
        "response_id": response_id,
        "approved": True,
    })
    assert approved.status_code == 200
    assert approved.json()["action"] == "approved"
    assert approved.json()["simulated"] is True

    rejected = client.post("/api/fleet/approve", json={
        "disruption_id": disruption_id,
        "response_id": response_id,
        "approved": False,
    })
    assert rejected.status_code == 200
    assert rejected.json()["action"] == "rejected"


def test_fleet_cannot_approve_without_evaluation_or_unknown_response(client):
    missing_disruption = client.post("/api/fleet/approve", json={
        "disruption_id": "D-NOT-EVALUATED",
        "response_id": "deploy_spare",
        "approved": True,
    })
    assert missing_disruption.status_code == 404

    result = client.post("/api/fleet/disruption", json={
        "disruption_type": "breakdown",
        "affected_bus_id": "B-T01",
    })
    disruption_id = result.json()["disruption"]["disruption_id"]
    missing_response = client.post("/api/fleet/approve", json={
        "disruption_id": disruption_id,
        "response_id": "not-a-response",
        "approved": True,
    })
    assert missing_response.status_code == 404


def test_fleet_rejects_unknown_bus(client):
    response = client.post("/api/fleet/disruption", json={
        "disruption_type": "breakdown",
        "affected_bus_id": "B-UNKNOWN",
    })
    assert response.status_code == 404
    assert "not found in fleet" in response.json()["detail"]


def test_fleet_cannot_approve_infeasible_response(client, monkeypatch):
    disruption_id = "D-TEST-INFEASIBLE"
    monkeypatch.setitem(
        fleet_api._last_evaluation,
        disruption_id,
        {
            "responses": [{
                "response_id": "deploy_spare",
                "label": "Deploy Spare Bus",
                "feasible": False,
            }],
        },
    )

    response = client.post("/api/fleet/approve", json={
        "disruption_id": disruption_id,
        "response_id": "deploy_spare",
        "approved": True,
    })

    assert response.status_code == 400
    assert "infeasible" in response.json()["detail"]
