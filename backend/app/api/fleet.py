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
            "vehicle_type": getattr(bus, "vehicle_type", "Tata Starbus EV (12m AC)"),
            "battery_level": getattr(bus, "battery_level", 85),
            "lat": getattr(bus, "lat", 28.6139),
            "lon": getattr(bus, "lon", 77.2090),
            "driver_id": getattr(bus, "driver_id", "DTC-D101"),
            "speed_kmh": getattr(bus, "speed_kmh", 32),
            "heading": getattr(bus, "heading", 90),
            "fuel_co2_saved_kg": getattr(bus, "fuel_co2_saved_kg", 14.5),
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


@router.post("/reset")
def reset_fleet_state():
    """Reset fleet state to baseline and clear past incidents."""
    _simulator.reset()
    _decisions.clear()
    _last_evaluation.clear()
    return {
        "message": "Fleet telemetry and incidents reset to baseline conditions.",
        "simulated": True,
        "fleet_state": _serialize_fleet_state(),
    }


@router.get("/audit-log")
def get_fleet_audit_log():
    """Return log of operational disruption decisions taken during this session."""
    records = []
    for dis_id, decision in _decisions.items():
        eval_data = _last_evaluation.get(dis_id, {})
        dis = eval_data.get("disruption", {})
        resp_list = eval_data.get("responses", [])
        records.append({
            "disruption_id": dis_id,
            "decision": decision,
            "bus_id": dis.get("affected_bus_id", ""),
            "type": dis.get("disruption_type", ""),
            "description": dis.get("description", ""),
            "delay_minutes": dis.get("delay_minutes", 0),
            "total_options_evaluated": len(resp_list),
        })
    return {"audit_log": records}
