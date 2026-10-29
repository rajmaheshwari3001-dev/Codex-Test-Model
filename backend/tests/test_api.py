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
from app.api import chat as chat_api
from app.api import routes as passenger_api
from app.models.transport import Occupancy


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
    for opt in data["options"]:
        assert opt["primary_mode"] == "metro"
        for leg in opt["legs"]:
            assert "route_type" in leg
            assert leg["route_type"] == "metro"


def test_journey_search_s02_to_s08_transfer_fares_and_route_type(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S02",
        "destination_stop_id": "S08",
        "departure_time": "08:00",
        "preference": "fastest",
        "service_day": "weekday",
    })
    assert resp.status_code == 200
    data = resp.json()
    options = data["options"]
    assert len(options) == 2

    fastest = options[0]
    cheapest = options[1]

    # Verify fastest transfer journey fare and leg route_types
    assert fastest["option_id"] == "fastest"
    assert fastest["fare_available"] is True
    assert fastest["total_fare"] == 40.0
    assert len(fastest["legs"]) == 2
    assert fastest["legs"][0]["route_type"] == "metro"
    assert fastest["legs"][1]["route_type"] == "bus"
    assert fastest["primary_mode"] == "multimodal"
    assert fastest["legs"][0]["fare"] == 25.0
    assert fastest["legs"][1]["fare"] == 15.0

    # Verify cheapest transfer journey fare
    assert cheapest["option_id"] == "cheapest"
    assert cheapest["fare_available"] is True
    assert cheapest["total_fare"] == 30.0
    assert len(cheapest["legs"]) == 2
    assert cheapest["legs"][0]["route_type"] == "metro"
    assert cheapest["legs"][1]["route_type"] == "bus"
    assert cheapest["primary_mode"] == "multimodal"
    assert cheapest["legs"][0]["fare"] == 10.0
    assert cheapest["legs"][1]["fare"] == 20.0


def test_journey_search_filters_service_day(client):
    request = {
        "origin_stop_id": "S13",
        "destination_stop_id": "S01",
        "departure_time": "07:00",
        "preference": "fastest",
    }

    weekday = client.post(
        "/api/journeys/search",
        json={**request, "service_day": "weekday"},
    )
    weekend = client.post(
        "/api/journeys/search",
        json={**request, "service_day": "weekend"},
    )

    assert weekday.status_code == 200
    assert weekend.status_code == 200
    assert weekday.json()["options"][0]["legs"][0]["trip_id"] == "T01"
    assert weekend.json()["options"][0]["legs"][0]["trip_id"] == "T16"


def test_journey_search_invalid_stop(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "INVALID",
        "destination_stop_id": "S01",
        "departure_time": "08:00",
        "preference": "fastest",
    })
    assert resp.status_code == 400


def test_journey_search_rejects_out_of_range_time(client):
    for departure_time in ("08:75", "48:00"):
        resp = client.post("/api/journeys/search", json={
            "origin_stop_id": "S13",
            "destination_stop_id": "S01",
            "departure_time": departure_time,
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
        "service_day": "weekend",
    })
    assert resp.status_code == 200
    saved_id = resp.json()["saved_route_id"]
    assert resp.json()["service_day"] == "weekend"

    # List
    resp = client.get("/api/saved-routes")
    assert resp.status_code == 200
    assert any(r["saved_route_id"] == saved_id for r in resp.json())

    # Get
    resp = client.get(f"/api/saved-routes/{saved_id}")
    assert resp.status_code == 200
    assert resp.json()["service_day"] == "weekend"

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


def test_chat_route_search_respects_requested_time(client):
    resp = client.post(
        "/api/chat",
        json={
            "message": "How do I get from ITO to Hauz Khas at 10 am?",
            "service_day": "weekday",
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "find_route"
    assert data["data"] is None
    assert "at or after 10:00 on the weekday schedule" in data["reply"]


def test_chat_route_search_requires_departure_time(client):
    resp = client.post(
        "/api/chat",
        json={"message": "How do I get from ITO to Hauz Khas?"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "find_route"
    assert data["data"] is None
    assert "What time will you leave?" in data["reply"]


def test_chat_compare_uses_requested_time_and_service_day(client, monkeypatch):
    routing_service = chat_api._routing_service
    assert routing_service is not None
    received = {}

    def fake_search(
        origin_id,
        destination_id,
        departure_time,
        preference,
        delay_minutes,
        service_day,
    ):
        received.update(
            origin_id=origin_id,
            destination_id=destination_id,
            departure_time=departure_time,
            preference=preference,
            service_day=service_day,
        )
        return []

    monkeypatch.setattr(routing_service, "search", fake_search)
    resp = client.post(
        "/api/chat",
        json={
            "message": "Is there a cheaper route from ITO to Hauz Khas at 10 am?",
            "service_day": "weekend",
        },
    )

    assert resp.status_code == 200
    assert resp.json()["intent"] == "compare"
    assert resp.json()["data"] is None
    assert "at or after 10:00 on the weekend schedule" in resp.json()["reply"]
    assert received == {
        "origin_id": "S11",
        "destination_id": "S09",
        "departure_time": "10:00",
        "preference": "cheapest",
        "service_day": "weekend",
    }


def test_chat_next_departure_uses_requested_time(client):
    resp = client.post(
        "/api/chat",
        json={"message": "When is the next bus from ITO after 10 am?"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "next_departure"
    assert data["data"]
    assert all(departure["departure_time"] >= "10:00" for departure in data["data"])


def test_chat_passes_service_day_to_chat_service(client, monkeypatch):
    received = {}

    def fake_handle_message(message, **kwargs):
        received["message"] = message
        received.update(kwargs)
        return {"intent": "help", "reply": "ok", "data": None}

    monkeypatch.setattr(chat_api.chat_service, "handle_message", fake_handle_message)

    resp = client.post(
        "/api/chat",
        json={"message": "Next bus from Rajiv Chowk", "service_day": "weekend"},
    )

    assert resp.status_code == 200
    assert received["service_day"] == "weekend"


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
    assert data["fleet_state"]["simulated"] is True
    assert any("occupancy_percent * capacity" in note for note in data["metric_notes"])
    assert any("synthetic assumptions" in note for note in data["metric_notes"])
    affected_bus = next(
        bus for bus in data["fleet_state"]["buses"]
        if bus["bus_id"] == "B-T01"
    )
    assert affected_bus["status"] == "active"


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
    baseline_leg = baseline_option["legs"][0]
    assert baseline_leg["boarding_crowding_level"] == "high"
    assert baseline_leg["boarding_crowding_percent"] == 80

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


def test_journey_reports_unknown_crowding_when_sample_data_is_missing(client):
    response = client.post("/api/journeys/search", json={
        "origin_stop_id": "S01",
        "destination_stop_id": "S05",
        "departure_time": "11:50",
        "preference": "fastest",
    })

    assert response.status_code == 200
    option = next(
        option for option in response.json()["options"]
        if any(leg["trip_id"] == "T04" for leg in option["legs"])
    )
    leg = next(leg for leg in option["legs"] if leg["trip_id"] == "T04")
    assert leg["boarding_crowding_level"] == "unknown"
    assert leg["boarding_crowding_percent"] is None


def test_journey_does_not_expose_invalid_crowding_data(client, monkeypatch):
    for level, load_percent, expected_level in (
        ("high", 140, "high"),
        ("unrecognized", 70, "unknown"),
    ):
        monkeypatch.setitem(
            passenger_api._td.occupancy_lookup,
            ("T04", "S01"),
            Occupancy(
                trip_id="T04",
                stop_id="S01",
                occupancy_level=level,
                typical_load_percent=load_percent,
            ),
        )
        response = client.post("/api/journeys/search", json={
            "origin_stop_id": "S01",
            "destination_stop_id": "S05",
            "departure_time": "11:50",
            "preference": "fastest",
        })

        assert response.status_code == 200
        leg = response.json()["options"][0]["legs"][0]
        assert leg["boarding_crowding_level"] == expected_level
        assert leg["boarding_crowding_percent"] is None


def test_fleet_approval_applies_spare_assignment_and_prevents_second_decision(client):
    result = client.post("/api/fleet/disruption", json={
        "disruption_type": "breakdown",
        "affected_bus_id": "B-T01",
        "description": "Approval workflow test",
    })
    assert result.status_code == 200
    payload = result.json()
    disruption_id = payload["disruption"]["disruption_id"]
    response_id = payload["recommended_response_id"]
    assert response_id == "deploy_spare"
    response_metrics = next(
        option["metrics"] for option in payload["responses"]
        if option["response_id"] == response_id
    )

    approved = client.post("/api/fleet/approve", json={
        "disruption_id": disruption_id,
        "response_id": response_id,
        "approved": True,
    })
    assert approved.status_code == 200
    assert approved.json()["action"] == "approved"
    assert approved.json()["simulated"] is True
    buses = {
        bus["bus_id"]: bus
        for bus in approved.json()["fleet_state"]["buses"]
    }
    assert buses["B-T01"]["status"] == "broken_down"
    assert buses["B-SPARE-1"]["status"] == "reassigned"
    assert buses["B-SPARE-1"]["route_id"] == "R01"
    assert buses["B-SPARE-1"]["trip_id"] == "T01"
    assert client.get("/api/fleet/state").json() == approved.json()["fleet_state"]
    assert sum(bus["status"] == "active" for bus in buses.values()) == (
        response_metrics["total_buses_active"]
    )
    assert sum(
        bus["status"] in ("active", "spare", "reassigned")
        for bus in buses.values()
    ) == response_metrics["total_buses_available"]

    second_decision = client.post("/api/fleet/approve", json={
        "disruption_id": disruption_id,
        "response_id": response_id,
        "approved": False,
    })
    assert second_decision.status_code == 409


def test_fleet_rejection_leaves_simulated_state_unchanged(client):
    result = client.post("/api/fleet/disruption", json={
        "disruption_type": "breakdown",
        "affected_bus_id": "B-T02",
    })
    payload = result.json()
    before = payload["fleet_state"]

    rejected = client.post("/api/fleet/approve", json={
        "disruption_id": payload["disruption"]["disruption_id"],
        "response_id": "deploy_spare",
        "approved": False,
    })

    assert rejected.status_code == 200
    assert rejected.json()["action"] == "rejected"
    assert rejected.json()["fleet_state"] == before
    assert client.get("/api/fleet/state").json() == before


def test_evaluating_new_scenario_resets_previously_approved_state(client):
    breakdown = client.post("/api/fleet/disruption", json={
        "disruption_type": "breakdown",
        "affected_bus_id": "B-T01",
    }).json()
    approved = client.post("/api/fleet/approve", json={
        "disruption_id": breakdown["disruption"]["disruption_id"],
        "response_id": "deploy_spare",
        "approved": True,
    })
    assert approved.status_code == 200
    approved_buses = {
        bus["bus_id"]: bus for bus in approved.json()["fleet_state"]["buses"]
    }
    assert approved_buses["B-T01"]["status"] == "broken_down"

    next_scenario = client.post("/api/fleet/disruption", json={
        "disruption_type": "delay",
        "affected_bus_id": "B-T05",
        "delay_minutes": 15,
    })

    assert next_scenario.status_code == 200
    buses = {
        bus["bus_id"]: bus
        for bus in next_scenario.json()["fleet_state"]["buses"]
    }
    assert buses["B-T01"]["status"] == "active"
    assert buses["B-SPARE-1"]["status"] == "spare"


def test_approved_short_turn_reassigns_same_route_bus(client):
    result = client.post("/api/fleet/disruption", json={
        "disruption_type": "breakdown",
        "affected_bus_id": "B-T01",
    })
    payload = result.json()
    disruption_id = payload["disruption"]["disruption_id"]
    response_metrics = next(
        option["metrics"] for option in payload["responses"]
        if option["response_id"] == "short_turn"
    )

    approved = client.post("/api/fleet/approve", json={
        "disruption_id": disruption_id,
        "response_id": "short_turn",
        "approved": True,
    })

    assert approved.status_code == 200
    buses = {
        bus["bus_id"]: bus
        for bus in approved.json()["fleet_state"]["buses"]
    }
    assert buses["B-T01"]["status"] == "broken_down"
    assert buses["B-T02"]["status"] == "reassigned"
    assert buses["B-T02"]["trip_id"] == "T01"
    assert sum(bus["status"] == "active" for bus in buses.values()) == (
        response_metrics["total_buses_active"]
    )
    assert sum(
        bus["status"] in ("active", "spare", "reassigned")
        for bus in buses.values()
    ) == response_metrics["total_buses_available"]


def test_approved_delay_responses_apply_their_modeled_delay(client):
    for response_id, expected_delay in [
        ("absorb_delay", 15),
        ("express_skip", 5),
    ]:
        result = client.post("/api/fleet/disruption", json={
            "disruption_type": "delay",
            "affected_bus_id": "B-T05",
            "delay_minutes": 15,
        })
        disruption_id = result.json()["disruption"]["disruption_id"]

        approved = client.post("/api/fleet/approve", json={
            "disruption_id": disruption_id,
            "response_id": response_id,
            "approved": True,
        })

        assert approved.status_code == 200
        affected_bus = next(
            bus for bus in approved.json()["fleet_state"]["buses"]
            if bus["bus_id"] == "B-T05"
        )
        assert affected_bus["delay_minutes"] == expected_delay


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


def test_journey_search_metro_preference_and_budget(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S04",
        "destination_stop_id": "S10",
        "departure_time": "08:00",
        "mode_preference": "metro",
        "max_budget": 30.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["options"]) >= 1
    opt = data["options"][0]
    assert opt["primary_mode"] == "metro"
    assert opt["total_fare"] == 25.0
    assert "Within budget" in opt["budget_status"]
    assert "Metro vs Bus" in opt["fare_comparison_note"]
