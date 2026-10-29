"""
API routes – fleet intelligence endpoints.

Endpoints:
  GET  /api/fleet/state               – current fleet state
  POST /api/fleet/disruption          – trigger + evaluate a disruption
  POST /api/fleet/approve             – approve/reject a response
"""

from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.fleet_simulator import Disruption, FleetSimulator

router = APIRouter(prefix="/api/fleet", tags=["fleet"])

_simulator: FleetSimulator | None = None


def init(simulator: FleetSimulator):
    global _simulator
    _simulator = simulator


class DisruptionRequest(BaseModel):
    disruption_type: str = Field(
        ..., description="'breakdown' or 'delay'"
    )
    affected_bus_id: str
    description: str = ""
    delay_minutes: int = Field(default=0, ge=0, le=120)


class ApproveRequest(BaseModel):
    disruption_id: str
    response_id: str
    approved: bool


_last_evaluation = {}
_decisions: dict[str, str] = {}


def _serialize_fleet_state():
    state = _simulator.get_state()
    buses = [
        {
            "bus_id": bus.bus_id,
            "route_id": bus.route_id,
            "trip_id": bus.trip_id,
            "status": bus.status,
            "occupancy_percent": bus.occupancy_percent,
            "delay_minutes": bus.delay_minutes,
        }
        for bus in state.buses
    ]
    return {"buses": buses, "simulated": True}


@router.get("/state")
def get_fleet_state():
    """Return the current simulated fleet state."""
    return _serialize_fleet_state()


@router.post("/disruption")
def evaluate_disruption(req: DisruptionRequest):
    """
    Trigger a disruption and evaluate response options.

    The simulator resets before each scenario so all comparisons
    start from equivalent initial conditions.
    """
    if req.disruption_type not in ("breakdown", "delay"):
        raise HTTPException(
            status_code=400,
            detail="disruption_type must be 'breakdown' or 'delay'."
        )

    disruption = Disruption(
        disruption_id=f"D-{req.affected_bus_id}-{req.disruption_type}-{uuid4().hex[:8]}",
        disruption_type=req.disruption_type,
        affected_bus_id=req.affected_bus_id,
        description=req.description or f"{req.disruption_type} affecting {req.affected_bus_id}",
        delay_minutes=req.delay_minutes,
    )

    result = _simulator.evaluate_disruption(disruption)
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    result["fleet_state"] = _serialize_fleet_state()
    _last_evaluation[disruption.disruption_id] = result
    return result


@router.post("/approve")
def approve_response(req: ApproveRequest):
    """Approve or reject a proposed disruption response."""
    evaluation = _last_evaluation.get(req.disruption_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Disruption not found. Run evaluation first.")
    if req.disruption_id in _decisions:
        raise HTTPException(
            status_code=409,
            detail=f"A response has already been {_decisions[req.disruption_id]}.",
        )

    response = next(
        (r for r in evaluation["responses"] if r["response_id"] == req.response_id),
        None,
    )
    if not response:
        raise HTTPException(status_code=404, detail="Response option not found.")
    if not response["feasible"]:
        raise HTTPException(status_code=400, detail="Cannot approve an infeasible response.")

    action = "approved" if req.approved else "rejected"
    if req.approved:
        disruption_data = evaluation["disruption"]
        disruption = Disruption(
            disruption_id=disruption_data["disruption_id"],
            disruption_type=disruption_data["disruption_type"],
            affected_bus_id=disruption_data["affected_bus_id"],
            description=disruption_data["description"],
            delay_minutes=disruption_data["delay_minutes"],
        )
        try:
            _simulator.apply_response(disruption, req.response_id)
        except (RuntimeError, ValueError) as error:
            raise HTTPException(status_code=409, detail=str(error)) from error

    _decisions[req.disruption_id] = action
    return {
        "disruption_id": req.disruption_id,
        "response_id": req.response_id,
        "action": action,
        "message": f"Response '{response['label']}' has been {action}.",
        "simulated": True,
        "fleet_state": _serialize_fleet_state(),
    }
