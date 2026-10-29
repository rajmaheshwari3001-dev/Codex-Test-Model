"""
Comprehensive test suite for Delhi Bus + Metro Data Collection,
Web Scraping, Normalization, and Multimodal Journey Integration.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.pipeline.sources.transport_stack import TransportStackClient
from app.pipeline.sources.dtc_scraper import DTCScraper
from app.pipeline.sources.dmrc_scraper import DMRCScraper
from app.pipeline.sources.otd_scraper import OTDScraper
from app.pipeline.normalizer import haversine_km, TransitDataNormalizer
from app.pipeline.importer import DataImporter


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# ---------------------------------------------------------------------------
# 1. Haversine Distance & Coordinate Tests
# ---------------------------------------------------------------------------

def test_haversine_distance_calculation():
    # Rajiv Chowk (28.6328, 77.2197) to Connaught Place (28.6315, 77.2167) ~ 0.33 km
    dist = haversine_km(28.6328, 77.2197, 28.6315, 77.2167)
    assert 0.2 <= dist <= 0.5

    # Kashmere Gate (28.6674, 77.2289) to Saket (28.5224, 77.2015) ~ 16.3 km
    dist_long = haversine_km(28.6674, 77.2289, 28.5224, 77.2015)
    assert 15.0 <= dist_long <= 18.0

    # Zero coordinates
    assert haversine_km(0, 0, 0, 0) == 0.0


# ---------------------------------------------------------------------------
# 2. Official DTC Fare Calculator Tests
# ---------------------------------------------------------------------------

def test_dtc_bus_fare_calculation():
    # Non-AC bus fares: <=4km: 5, <=8km: 10, >8km: 15
    assert DTCScraper.calculate_bus_fare(3.2, is_ac=False) == 5.0
    assert DTCScraper.calculate_bus_fare(6.5, is_ac=False) == 10.0
    assert DTCScraper.calculate_bus_fare(18.0, is_ac=False) == 15.0

    # AC / Electric bus fares: <=4km: 10, <=8km: 15, <=12km: 20, >12km: 25
    assert DTCScraper.calculate_bus_fare(3.2, is_ac=True) == 10.0
    assert DTCScraper.calculate_bus_fare(6.5, is_ac=True) == 15.0
    assert DTCScraper.calculate_bus_fare(10.0, is_ac=True) == 20.0
    assert DTCScraper.calculate_bus_fare(24.0, is_ac=True) == 25.0

    # Pink Pass / Female traveler concession
    assert DTCScraper.calculate_bus_fare(15.0, is_ac=True, is_female_or_pass=True) == 0.0


# ---------------------------------------------------------------------------
# 3. Official DMRC Metro Fare Calculator Tests
# ---------------------------------------------------------------------------

def test_dmrc_metro_fare_calculation():
    # Weekday Standard Tokens:
    # 0-2km: 11, 2-5km: 21, 5-12km: 32, 12-21km: 43, 21-32km: 54, >32km: 64
    assert DMRCScraper.calculate_metro_fare(1.5, service_day="weekday") == 11.0
    assert DMRCScraper.calculate_metro_fare(4.0, service_day="weekday") == 21.0
    assert DMRCScraper.calculate_metro_fare(10.0, service_day="weekday") == 32.0
    assert DMRCScraper.calculate_metro_fare(18.0, service_day="weekday") == 43.0
    assert DMRCScraper.calculate_metro_fare(26.0, service_day="weekday") == 54.0
    assert DMRCScraper.calculate_metro_fare(38.0, service_day="weekday") == 64.0

    # Sunday Concessions:
    # 2-5km is subsidized to 11.0, 5-12km subsidized to 21.0
    assert DMRCScraper.calculate_metro_fare(4.0, service_day="weekend") == 11.0
    assert DMRCScraper.calculate_metro_fare(10.0, service_day="weekend") == 21.0

    # Smart Card 10% Discount Peak Hour (09:00 AM)
    assert DMRCScraper.calculate_metro_fare(10.0, service_day="weekday", departure_time="09:00", is_smart_card=True) == 28.8

    # Smart Card 20% Discount Off-Peak Hour (07:30 AM or 14:00)
    assert DMRCScraper.calculate_metro_fare(10.0, service_day="weekday", departure_time="07:30", is_smart_card=True) == 25.6


# ---------------------------------------------------------------------------
# 4. Scraper Units (Offline / Mocked where required)
# ---------------------------------------------------------------------------

def test_dtc_scraper_mocked_html():
    html_sample = """
    <html>
        <head><title>Services and Time Table | Delhi Transport Corporation</title></head>
        <body>
            <a href="/sites/default/files/DTC/time_table.pdf">Current D.T.C. Time Table</a>
            <a href="/sites/default/files/DTC/fair_stages.xlsx">All Route Fair Stages</a>
        </body>
    </html>
    """
    scraper = DTCScraper()
    with patch.object(scraper.session, "get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = html_sample
        mock_get.return_value = mock_resp

        result = scraper.scrape_service_links()
        assert result["status_code"] == 200
        assert "Delhi Transport Corporation" in result["page_title"]
        assert len(result["documents"]) == 2
        assert result["documents"][0]["type"] == "pdf"
        assert result["documents"][1]["type"] == "excel"


def test_dmrc_scraper_mocked_html():
    scraper = DMRCScraper()
    with patch.object(scraper.session, "get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = "<html><head><title>DMRC Fare Matrix</title></head><body>DMRC Fare</body></html>"
        mock_get.return_value = mock_resp

        result = scraper.scrape_fare_page()
        assert result["status_code"] == 200
        assert len(result["fare_slabs"]) == 6
        assert "BLUE" in result["network_lines"]


def test_otd_scraper_mocked_html():
    scraper = OTDScraper()
    with patch.object(scraper.session, "get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = """
        <html><body>
            Documentation: The static timetable of Delhi Buses can be accessed using stops.txt, routes.txt, trips.txt.
            Authorised users can request for real-time data at /api/realtime/VehiclePositions.pb?key=YOUR_PRIVATE_KEY
        </body></html>
        """
        mock_get.return_value = mock_resp

        result = scraper.scrape_documentation()
        assert result["status_code"] == 200
        assert "stops.txt" in result["gtfs_files_documented"]
        assert result["realtime_api_spec"]["protocol"] == "Protocol Buffers (GTFS-RT)"
        assert result["realtime_api_spec"]["requires_registration"] is True


# ---------------------------------------------------------------------------
# 5. Pipeline Orchestrator & Metadata Validation
# ---------------------------------------------------------------------------

def test_pipeline_normalizer_and_importer_offline():
    importer = DataImporter()
    result = importer.run_pipeline(download_remote=False)

    assert result["status"] == "success"
    metrics = result["network_metrics"]
    assert metrics["total_stops"] >= 20
    assert metrics["total_routes"] >= 4
    assert metrics["total_transfers"] >= 7
    assert importer.metadata_file.exists()


# ---------------------------------------------------------------------------
# 6. API Endpoints Integration Tests
# ---------------------------------------------------------------------------

def test_api_data_provenance_endpoint(client):
    resp = client.get("/api/data/provenance")
    assert resp.status_code == 200
    data = resp.json()
    assert "application" in data
    assert "datasets" in data
    assert "delhi_buses" in data["datasets"]
    assert "delhi_metro" in data["datasets"]


def test_api_data_refresh_endpoint_offline(client):
    resp = client.post("/api/data/refresh?remote=false")
    assert resp.status_code == 200
    data = resp.json()
    assert "Transit data pipeline completed" in data["message"]


def test_journey_search_includes_distance_and_transfer_modes(client):
    # Search S02 (Kashmere Gate) to S08 (Saket) at 08:00
    resp = client.post(
        "/api/journeys/search",
        json={
            "origin_stop_id": "S02",
            "destination_stop_id": "S08",
            "departure_time": "08:00",
            "preference": "fastest",
        },
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert len(payload["options"]) >= 1
    fastest = payload["options"][0]

    # Verify distance calculations
    assert fastest["total_distance_km"] is not None
    assert fastest["total_distance_km"] > 0
    assert len(fastest["legs"]) >= 2

    # Check legs have distance_km
    for leg in fastest["legs"]:
        assert leg["distance_km"] is not None
        assert leg["distance_km"] > 0

    # Check transfers detail
    assert len(fastest["transfers"]) >= 1
    transfer = fastest["transfers"][0]
    assert transfer["from_mode"] is not None
    assert transfer["to_mode"] is not None
    assert transfer["transfer_description"] is not None
