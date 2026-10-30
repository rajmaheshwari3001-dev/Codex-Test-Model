"""
Tests for PoochhO (DIMTS) Auto-Rickshaw & Multimodal Integration.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.pipeline.sources.poochho_scraper import (
    PoochhOScraper,
    is_night_time,
    get_traffic_speed_kmh,
)
from app.services.data_loader import load_all
from app.services.routing_service import RoutingService


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def routing_service():
    td = load_all()
    return RoutingService(td)


def test_is_night_time():
    assert is_night_time("23:00") is True
    assert is_night_time("23:45") is True
    assert is_night_time("00:30") is True
    assert is_night_time("04:59") is True
    assert is_night_time("05:00") is False
    assert is_night_time("12:00") is False
    assert is_night_time("22:59") is False


def test_traffic_speeds_by_time():
    assert get_traffic_speed_kmh("09:00") == 18.0  # morning peak
    assert get_traffic_speed_kmh("18:30") == 18.0  # evening peak
    assert get_traffic_speed_kmh("14:00") == 22.0  # off-peak afternoon
    assert get_traffic_speed_kmh("23:30") == 28.0  # night


def test_auto_fare_short_distance():
    scraper = PoochhOScraper()
    # <= 1.5 km should return minimum base fare (Rs. 30)
    fare = scraper.calculate_auto_fare(1.0, departure_time="14:00")
    assert fare == 30.0
    fare_exact = scraper.calculate_auto_fare(1.5, departure_time="14:00")
    assert fare_exact == 30.0


def test_auto_fare_additional_km():
    scraper = PoochhOScraper()
    # 5.5 km: 30 base for 1.5 km + 4.0 km * 11 = 30 + 44 = 74
    fare = scraper.calculate_auto_fare(5.5, departure_time="14:00")
    assert fare == 74.0


def test_auto_fare_night_surcharge():
    scraper = PoochhOScraper()
    # 5.5 km daytime = 74. Night (+25%) = 74 * 1.25 = 92.5
    day_fare = scraper.calculate_auto_fare(5.5, departure_time="14:00")
    night_fare = scraper.calculate_auto_fare(5.5, departure_time="23:30")
    assert day_fare == 74.0
    assert night_fare == 92.5


def test_auto_fare_waiting_and_luggage():
    scraper = PoochhOScraper()
    # 5.5 km with 10 mins waiting (10 * 0.75 = 7.5) and 2 luggage pieces (2 * 10 = 20)
    # Total = 74 + 7.5 + 20 = 101.5
    fare = scraper.calculate_auto_fare(
        5.5, departure_time="14:00", waiting_minutes=10, luggage_pieces=2
    )
    assert fare == 101.5


def test_taxi_fare_non_ac_and_ac():
    scraper = PoochhOScraper()
    # 5.0 km: base 40 for 1 km + 4 km * 17 (Non-AC) = 40 + 68 = 108
    non_ac = scraper.calculate_taxi_fare(5.0, is_ac=False, departure_time="12:00")
    assert non_ac == 108.0

    # 5.0 km AC: base 40 for 1 km + 4 km * 20 (AC) = 40 + 80 = 120
    ac = scraper.calculate_taxi_fare(5.0, is_ac=True, departure_time="12:00")
    assert ac == 120.0


def test_poochho_scraper_app_metadata():
    scraper = PoochhOScraper()
    meta = scraper.fetch_app_metadata()
    assert meta["package_name"] == "com.dimts.delhiautojunction"
    assert "auto_rickshaw" in meta["modes_supported"]
    assert "taxi" in meta["modes_supported"]
    assert "fare_rules" in meta
    assert meta["fare_rules"]["auto_rickshaw"]["base_fare"] == 30.0
    assert meta["fare_rules"]["auto_rickshaw"]["rate_per_km"] == 11.0


def test_routing_service_auto_mode(routing_service):
    # S02 (Kashmere Gate) to S08 (Saket) by auto
    options = routing_service.search(
        origin_id="S02",
        destination_id="S08",
        departure_time="08:00",
        mode_preference="auto",
    )
    assert len(options) == 1
    opt = options[0]
    assert opt.primary_mode == "auto"
    assert opt.label == "PoochhO Auto"
    assert opt.total_fare is not None and opt.total_fare > 30.0
    assert opt.total_distance_km is not None and opt.total_distance_km > 10.0
    assert len(opt.legs) == 1
    assert opt.legs[0].route_type == "auto"
    assert opt.legs[0].fare_provenance == "PoochhO / Delhi Govt Statutory Tariff"


def test_routing_service_poochho_estimate(routing_service):
    estimate = routing_service.get_poochho_estimate("S02", "S08", "08:00")
    assert estimate["origin_stop_id"] == "S02"
    assert estimate["destination_stop_id"] == "S08"
    assert estimate["estimated_road_distance_km"] > 0
    assert estimate["estimated_duration_minutes"] > 0
    assert estimate["auto_rickshaw"]["fare"] > 0
    assert estimate["taxi"]["non_ac_fare"] > 0
    assert estimate["taxi"]["ac_fare"] > estimate["taxi"]["non_ac_fare"]
    assert "feeder_recommendation" in estimate


def test_api_poochho_estimate_endpoint(client):
    resp = client.get("/api/poochho/estimate?origin_stop_id=S01&destination_stop_id=S05&departure_time=14:00")
    assert resp.status_code == 200
    data = resp.json()
    assert data["origin_stop_id"] == "S01"
    assert data["destination_stop_id"] == "S05"
    assert "auto_rickshaw" in data
    assert "taxi" in data
    assert "feeder_recommendation" in data


def test_api_poochho_info_endpoint(client):
    resp = client.get("/api/poochho/info")
    assert resp.status_code == 200
    data = resp.json()
    assert data["package_name"] == "com.dimts.delhiautojunction"
    assert "fare_rules" in data


def test_api_journey_search_includes_poochho_estimate(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S13",
        "destination_stop_id": "S01",
        "departure_time": "08:00",
        "preference": "fastest",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "options" in data
    assert "poochho_estimate" in data
    assert data["poochho_estimate"]["auto_rickshaw"]["fare"] > 0


def test_api_journey_search_mode_auto(client):
    resp = client.post("/api/journeys/search", json={
        "origin_stop_id": "S02",
        "destination_stop_id": "S08",
        "departure_time": "08:00",
        "preference": "fastest",
        "mode_preference": "auto",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["options"]) == 1
    assert data["options"][0]["primary_mode"] == "auto"
    assert data["options"][0]["total_fare"] is not None

