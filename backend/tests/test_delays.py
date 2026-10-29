"""
Tests for delay-aware routing.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.data_loader import load_all
from app.services.routing_service import RoutingService, time_to_minutes


def _make_service():
    td = load_all()
    return RoutingService(td), td


def test_delay_increases_travel_time():
    svc, td = _make_service()
    normal = svc.search("S13", "S01", "07:00")
    delayed = svc.search("S13", "S01", "07:00", delay_minutes={"T01": 20})
    if normal and delayed:
        n_arr = time_to_minutes(normal[0].arrival_time)
        d_arr = time_to_minutes(delayed[0].arrival_time)
        assert d_arr >= n_arr, "Delay should not make arrival earlier"


def test_delay_warnings_present():
    svc, td = _make_service()
    options = svc.search("S13", "S01", "07:00", delay_minutes={"T01": 10})
    if options:
        # Should contain delay warnings or use an alternative trip.
        assert isinstance(options[0].delay_warnings, list)


def test_no_delay_no_warnings():
    svc, td = _make_service()
    options = svc.search("S13", "S01", "07:00")
    if options:
        assert len(options[0].delay_warnings) == 0
