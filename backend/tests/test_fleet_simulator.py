"""
Tests for the fleet simulator.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.data_loader import load_all
from app.services.fleet_simulator import FleetSimulator, Disruption


def _make_simulator():
    td = load_all()
    sim = FleetSimulator()
    sim.init_default_fleet(td)
    return sim


def test_fleet_initialised():
    sim = _make_simulator()
    state = sim.get_state()
    assert len(state.buses) > 0
    active = [b for b in state.buses if b.status == "active"]
    spares = [b for b in state.buses if b.status == "spare"]
    assert len(active) > 0
    assert len(spares) == 2


def test_breakdown_evaluation():
    sim = _make_simulator()
    disruption = Disruption(
        disruption_id="D-TEST-1",
        disruption_type="breakdown",
        affected_bus_id="B-T01",
        description="Bus B-T01 breaks down at Rajouri Garden",
    )
    result = sim.evaluate_disruption(disruption)
    assert result["baseline"] is not None
    assert len(result["responses"]) >= 2
    assert result["recommended_response_id"] is not None


def test_delay_evaluation():
    sim = _make_simulator()
    disruption = Disruption(
        disruption_id="D-TEST-2",
        disruption_type="delay",
        affected_bus_id="B-T05",
        description="Bus B-T05 delayed by traffic",
        delay_minutes=15,
    )
    result = sim.evaluate_disruption(disruption)
    assert result["baseline"] is not None
    assert len(result["responses"]) >= 2


def test_scenarios_use_same_initial_state():
    sim = _make_simulator()
    state_before = sim.get_state()
    disruption = Disruption(
        disruption_id="D-TEST-3",
        disruption_type="breakdown",
        affected_bus_id="B-T01",
        description="Test",
    )
    sim.evaluate_disruption(disruption)
    state_after = sim.get_state()
    # After evaluation, fleet should be reset to initial state.
    assert len(state_before.buses) == len(state_after.buses)


def test_infeasible_response_not_recommended():
    sim = _make_simulator()
    # Make all spares unavailable by making them active.
    for bus in sim._initial_state.buses:
        if bus.status == "spare":
            bus.status = "active"
    sim.reset()

    disruption = Disruption(
        disruption_id="D-TEST-4",
        disruption_type="breakdown",
        affected_bus_id="B-T01",
        description="No spares available",
    )
    result = sim.evaluate_disruption(disruption)
    spare_resp = next(
        (r for r in result["responses"] if r["response_id"] == "deploy_spare"),
        None,
    )
    if spare_resp:
        assert spare_resp["feasible"] is False


def test_nonexistent_bus():
    sim = _make_simulator()
    disruption = Disruption(
        disruption_id="D-TEST-5",
        disruption_type="breakdown",
        affected_bus_id="B-NONEXISTENT",
        description="Ghost bus",
    )
    result = sim.evaluate_disruption(disruption)
    assert "error" in result
