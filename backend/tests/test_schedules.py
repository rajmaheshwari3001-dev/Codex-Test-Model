"""
Tests for the schedule and delay services.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.data_loader import load_all
from app.services import schedule_service as sched
from app.services.delay_service import DelayService


def test_next_departures():
    td = load_all()
    deps = sched.next_departures(td, "S02", "06:00", limit=3)
    assert len(deps) > 0
    assert deps[0]["departure_time"] >= "06:00"


def test_no_departures_late():
    td = load_all()
    deps = sched.next_departures(td, "S02", "23:00", limit=3)
    assert len(deps) == 0


def test_delay_service_set_get():
    ds = DelayService()
    ds.set_delay("T01", 10)
    assert ds.get_delay("T01") == 10
    assert ds.get_delay("T99") == 0


def test_delay_service_clear():
    ds = DelayService()
    ds.set_delay("T01", 10)
    ds.set_delay("T02", 5)
    ds.clear_all()
    assert ds.get_all_delays() == {}


def test_delay_service_zero_removes():
    ds = DelayService()
    ds.set_delay("T01", 10)
    ds.set_delay("T01", 0)
    assert ds.get_delay("T01") == 0
    assert "T01" not in ds.get_all_delays()
