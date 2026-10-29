"""
Fleet simulator – deterministic bus-network simulation for Module B.

WHAT PROBLEM DOES THIS SOLVE?
  A transport operator wants to evaluate "what happens if bus B03 breaks
  down?" and compare possible responses before committing to one.

HOW IT WORKS:
  1. We initialise a fleet state: buses, their assigned trips, positions,
     occupancy, and availability.
  2. A disruption is applied (e.g. bus breakdown, trip delay).
  3. We calculate baseline metrics (what happens if we do nothing).
  4. We generate feasible response options (e.g. reassign a spare bus,
     skip a stop).
  5. We evaluate each response and compute metrics.
  6. All comparisons start from the SAME initial state – the simulator
     resets before each scenario.

IMPORTANT:
  All data here is simulated.  No real buses are affected.

HOW TO TEST IT:
  See backend/tests/test_fleet_simulator.py
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
from typing import Dict, List, Optional


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class Bus:
    """A single bus in the fleet."""
    bus_id: str
    route_id: str           # currently assigned route
    trip_id: str             # currently assigned trip
    status: str = "active"   # active | broken_down | spare | reassigned
    current_stop_index: int = 0   # position along the trip
    occupancy_percent: int = 50
    delay_minutes: int = 0
    capacity: int = 50      # max passengers


@dataclass
class Disruption:
    """A disruption event that affects the fleet."""
    disruption_id: str
    disruption_type: str     # breakdown | delay
    affected_bus_id: str
    description: str
    delay_minutes: int = 0   # additional delay (for delay type)


@dataclass
class ScenarioMetrics:
    """Calculated metrics for one scenario outcome."""
    scenario_name: str
    affected_passengers: int
    average_wait_increase_minutes: float
    delayed_trips: int
    fleet_utilization_percent: float
    total_buses_active: int
    total_buses_available: int
    crowding_increase_percent: float


@dataclass
class ResponseOption:
    """A proposed response to a disruption."""
    response_id: str
    label: str
    description: str
    feasible: bool
    reason_if_infeasible: str = ""
    metrics: Optional[ScenarioMetrics] = None
    explanation: str = ""
    trade_offs: List[str] = field(default_factory=list)


@dataclass
class FleetState:
    """Complete snapshot of the fleet at a moment in time."""
    buses: List[Bus] = field(default_factory=list)
    disruptions: List[Disruption] = field(default_factory=list)
    metrics: Optional[ScenarioMetrics] = None


# ---------------------------------------------------------------------------
# Fleet simulator
# ---------------------------------------------------------------------------

class FleetSimulator:
    """
    Deterministic fleet simulator.

    Usage:
        sim = FleetSimulator()
        sim.init_default_fleet(transport_data)
        state = sim.get_state()
        result = sim.evaluate_disruption(disruption)
    """

    def __init__(self) -> None:
        self._initial_state: Optional[FleetState] = None
        self._current_state: Optional[FleetState] = None

    def init_default_fleet(self, td) -> None:
        """
        Create a default fleet from the loaded transport data.

        One bus per trip, plus two spare buses.
        """
        buses: List[Bus] = []
        for trip in td.trips:
            stop_times = td.stop_times_by_trip.get(trip.trip_id, [])
            if not stop_times:
                continue
            buses.append(Bus(
                bus_id=f"B-{trip.trip_id}",
                route_id=trip.route_id,
                trip_id=trip.trip_id,
                status="active",
                current_stop_index=0,
                occupancy_percent=50,
                delay_minutes=0,
            ))

        # Add two spare buses.
        buses.append(Bus(
            bus_id="B-SPARE-1",
            route_id="",
            trip_id="",
            status="spare",
            occupancy_percent=0,
        ))
        buses.append(Bus(
            bus_id="B-SPARE-2",
            route_id="",
            trip_id="",
            status="spare",
            occupancy_percent=0,
        ))

        self._initial_state = FleetState(buses=buses)
        self._current_state = copy.deepcopy(self._initial_state)

    def get_state(self) -> FleetState:
        """Return the current fleet state."""
        if self._current_state is None:
            return FleetState()
        return copy.deepcopy(self._current_state)

    def reset(self) -> None:
        """Reset to initial state so scenarios start from the same baseline."""
        if self._initial_state:
            self._current_state = copy.deepcopy(self._initial_state)

    def _calculate_metrics(
        self, state: FleetState, scenario_name: str,
        affected_passengers: int = 0,
        wait_increase: float = 0.0,
        delayed_trips: int = 0,
        crowding_increase: float = 0.0,
    ) -> ScenarioMetrics:
        """Calculate metrics from a fleet state snapshot."""
        active = sum(1 for b in state.buses if b.status == "active")
        available = sum(1 for b in state.buses if b.status in ("active", "spare", "reassigned"))
        total = len(state.buses)
        utilization = (active / total * 100) if total > 0 else 0.0
        return ScenarioMetrics(
            scenario_name=scenario_name,
            affected_passengers=affected_passengers,
            average_wait_increase_minutes=round(wait_increase, 1),
            delayed_trips=delayed_trips,
            fleet_utilization_percent=round(utilization, 1),
            total_buses_active=active,
            total_buses_available=available,
            crowding_increase_percent=round(crowding_increase, 1),
        )

    def evaluate_disruption(self, disruption: Disruption) -> Dict:
        """
        Evaluate a disruption and return baseline + response options.

        Returns dict with:
          - disruption: the disruption details
          - baseline: ScenarioMetrics with no response
          - responses: list of ResponseOption

        Each ResponseOption includes calculated metrics, explanation,
        and trade-offs.
        """
        self.reset()
        state = self.get_state()

        affected_bus = None
        for bus in state.buses:
            if bus.bus_id == disruption.affected_bus_id:
                affected_bus = bus
                break

        if not affected_bus:
            return {
                "disruption": disruption,
                "baseline": None,
                "responses": [],
                "error": f"Bus {disruption.affected_bus_id} not found in fleet.",
            }

        # ----- Baseline: do nothing -----
        baseline_state = copy.deepcopy(state)
        for bus in baseline_state.buses:
            if bus.bus_id == disruption.affected_bus_id:
                if disruption.disruption_type == "breakdown":
                    bus.status = "broken_down"
                elif disruption.disruption_type == "delay":
                    bus.delay_minutes += disruption.delay_minutes

        estimated_passengers = affected_bus.occupancy_percent * affected_bus.capacity // 100
        if disruption.disruption_type == "breakdown":
            baseline_wait = 30.0  # average extra wait when a bus is removed
            baseline_delayed = 1
            baseline_crowding = 15.0  # neighbouring routes absorb passengers
        else:
            baseline_wait = float(disruption.delay_minutes)
            baseline_delayed = 1
            baseline_crowding = 5.0

        baseline_metrics = self._calculate_metrics(
            baseline_state, "No action (baseline)",
            affected_passengers=estimated_passengers,
            wait_increase=baseline_wait,
            delayed_trips=baseline_delayed,
            crowding_increase=baseline_crowding,
        )

        # ----- Response options -----
        responses: List[ResponseOption] = []

        # Response A: reassign a spare bus
        spare_buses = [b for b in state.buses if b.status == "spare"]
        if spare_buses and disruption.disruption_type == "breakdown":
            spare = spare_buses[0]
            scenario_state = copy.deepcopy(state)
            for bus in scenario_state.buses:
                if bus.bus_id == disruption.affected_bus_id:
                    bus.status = "broken_down"
                if bus.bus_id == spare.bus_id:
                    bus.status = "reassigned"
                    bus.route_id = affected_bus.route_id
                    bus.trip_id = affected_bus.trip_id

            response_a_metrics = self._calculate_metrics(
                scenario_state, "Deploy spare bus",
                affected_passengers=estimated_passengers // 3,
                wait_increase=10.0,
                delayed_trips=1,
                crowding_increase=5.0,
            )
            responses.append(ResponseOption(
                response_id="deploy_spare",
                label="Deploy Spare Bus",
                description=(
                    f"Reassign {spare.bus_id} to cover {affected_bus.trip_id} "
                    f"on route {affected_bus.route_id}."
                ),
                feasible=True,
                metrics=response_a_metrics,
                explanation=(
                    "A spare bus can reach the route within ~10 minutes. "
                    "This reduces average wait from 30 min to ~10 min. "
                    "However, the spare bus starts empty and mid-route."
                ),
                trade_offs=[
                    "Spare fleet reduced by one bus.",
                    "Initial 10-minute wait until spare arrives.",
                    "Passengers at earlier stops may have been missed.",
                ],
            ))
        elif disruption.disruption_type == "breakdown":
            responses.append(ResponseOption(
                response_id="deploy_spare",
                label="Deploy Spare Bus",
                description="No spare bus is available.",
                feasible=False,
                reason_if_infeasible="All spare buses are already deployed.",
            ))

        # Response B: divert a nearby bus / short-turn
        if disruption.disruption_type == "breakdown":
            same_route_buses = [
                b for b in state.buses
                if b.route_id == affected_bus.route_id
                and b.bus_id != disruption.affected_bus_id
                and b.status == "active"
            ]
            if same_route_buses:
                divert_bus = same_route_buses[0]
                scenario_state_b = copy.deepcopy(state)
                for bus in scenario_state_b.buses:
                    if bus.bus_id == disruption.affected_bus_id:
                        bus.status = "broken_down"
                    elif bus.bus_id == divert_bus.bus_id:
                        bus.status = "reassigned"
                        bus.route_id = affected_bus.route_id
                        bus.trip_id = affected_bus.trip_id

                response_b_metrics = self._calculate_metrics(
                    scenario_state_b, "Short-turn existing bus",
                    affected_passengers=estimated_passengers // 2,
                    wait_increase=15.0,
                    delayed_trips=2,
                    crowding_increase=10.0,
                )
                responses.append(ResponseOption(
                    response_id="short_turn",
                    label="Short-Turn Existing Bus",
                    description=(
                        f"Short-turn {divert_bus.bus_id} to cover the gap left "
                        f"by {disruption.affected_bus_id}."
                    ),
                    feasible=True,
                    metrics=response_b_metrics,
                    explanation=(
                        f"{divert_bus.bus_id} turns around early to cover the "
                        f"remaining stops of {affected_bus.trip_id}. This helps "
                        f"faster than waiting for a spare but disrupts the "
                        f"existing run of {divert_bus.bus_id}."
                    ),
                    trade_offs=[
                        f"{divert_bus.bus_id}'s original passengers face a delay.",
                        "Two trips now degraded instead of one.",
                        "Faster coverage than deploying a spare.",
                    ],
                ))
            else:
                responses.append(ResponseOption(
                    response_id="short_turn",
                    label="Short-Turn Existing Bus",
                    description="No other active bus on the same route.",
                    feasible=False,
                    reason_if_infeasible="No active buses on the same route to divert.",
                ))

        # Response for delay disruption
        if disruption.disruption_type == "delay":
            # Option A: Adjust schedule (absorb delay)
            scenario_delay_a = copy.deepcopy(state)
            for bus in scenario_delay_a.buses:
                if bus.bus_id == disruption.affected_bus_id:
                    bus.delay_minutes += disruption.delay_minutes

            delay_a_metrics = self._calculate_metrics(
                scenario_delay_a, "Absorb delay (adjust schedule)",
                affected_passengers=estimated_passengers,
                wait_increase=float(disruption.delay_minutes) * 0.5,
                delayed_trips=1,
                crowding_increase=3.0,
            )
            responses.append(ResponseOption(
                response_id="absorb_delay",
                label="Absorb Delay",
                description="Accept the delay and shift the schedule forward.",
                feasible=True,
                metrics=delay_a_metrics,
                explanation=(
                    f"The bus continues with a {disruption.delay_minutes}-minute delay. "
                    "Downstream stops are notified of revised arrival times."
                ),
                trade_offs=[
                    "All downstream stops are delayed.",
                    "No fleet resources consumed.",
                    "Passengers at waiting stops experience partial delay.",
                ],
            ))

            # Option B: Express skip some stops
            scenario_delay_b = copy.deepcopy(state)
            for bus in scenario_delay_b.buses:
                if bus.bus_id == disruption.affected_bus_id:
                    bus.delay_minutes += max(0, disruption.delay_minutes - 10)

            delay_b_metrics = self._calculate_metrics(
                scenario_delay_b, "Express run (skip 2 stops)",
                affected_passengers=estimated_passengers // 4,
                wait_increase=max(0, float(disruption.delay_minutes) - 10),
                delayed_trips=1,
                crowding_increase=2.0,
            )
            responses.append(ResponseOption(
                response_id="express_skip",
                label="Express Run (Skip Stops)",
                description="Skip two low-demand intermediate stops to recover time.",
                feasible=True,
                metrics=delay_b_metrics,
                explanation=(
                    "By skipping two stops with low boarding demand, the bus "
                    "recovers approximately 10 minutes. Passengers at skipped "
                    "stops must wait for the next service."
                ),
                trade_offs=[
                    "~8 passengers at skipped stops left waiting.",
                    "Recovers ~10 minutes of schedule.",
                    "Downstream stops receive nearly on-time service.",
                ],
            ))

        # Determine recommendation
        feasible_responses = [r for r in responses if r.feasible and r.metrics]
        recommended_id = None
        if feasible_responses:
            # Pick the one with lowest average_wait_increase
            best = min(feasible_responses, key=lambda r: r.metrics.average_wait_increase_minutes)
            recommended_id = best.response_id

        return {
            "disruption": {
                "disruption_id": disruption.disruption_id,
                "disruption_type": disruption.disruption_type,
                "affected_bus_id": disruption.affected_bus_id,
                "description": disruption.description,
                "delay_minutes": disruption.delay_minutes,
            },
            "baseline": {
                "scenario_name": baseline_metrics.scenario_name,
                "affected_passengers": baseline_metrics.affected_passengers,
                "average_wait_increase_minutes": baseline_metrics.average_wait_increase_minutes,
                "delayed_trips": baseline_metrics.delayed_trips,
                "fleet_utilization_percent": baseline_metrics.fleet_utilization_percent,
                "total_buses_active": baseline_metrics.total_buses_active,
                "total_buses_available": baseline_metrics.total_buses_available,
                "crowding_increase_percent": baseline_metrics.crowding_increase_percent,
            },
            "responses": [
                {
                    "response_id": r.response_id,
                    "label": r.label,
                    "description": r.description,
                    "feasible": r.feasible,
                    "reason_if_infeasible": r.reason_if_infeasible,
                    "metrics": {
                        "scenario_name": r.metrics.scenario_name,
                        "affected_passengers": r.metrics.affected_passengers,
                        "average_wait_increase_minutes": r.metrics.average_wait_increase_minutes,
                        "delayed_trips": r.metrics.delayed_trips,
                        "fleet_utilization_percent": r.metrics.fleet_utilization_percent,
                        "total_buses_active": r.metrics.total_buses_active,
                        "total_buses_available": r.metrics.total_buses_available,
                        "crowding_increase_percent": r.metrics.crowding_increase_percent,
                    } if r.metrics else None,
                    "explanation": r.explanation,
                    "trade_offs": r.trade_offs,
                } for r in responses
            ],
            "recommended_response_id": recommended_id,
        }
