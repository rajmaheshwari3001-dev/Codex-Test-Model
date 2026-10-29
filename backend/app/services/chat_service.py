"""
Chat service – intent-based conversational assistant.

Rather than relying on an external LLM, V1 uses keyword-based intent
detection to understand the user's question and fetches real data from
the routing engine and schedule service.

SUPPORTED INTENTS:
  • find_route     – "How do I get from X to Y?"
  • next_departure – "When is the next bus from X?"
  • explain_route  – "Tell me about route R01"
  • delay_info     – "Are there any delays?"
  • compare        – "Is there a cheaper route?"
  • saved_routes   – "Show my saved routes"
  • help           – anything unrecognised

If an xAI API key is set, Grok phrases a response using the deterministic
intent layer's verified backend data. Without a key, the intent-based reply
is returned directly.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.services.data_loader import TransportData
from app.services.routing_service import RoutingService
from app.services import schedule_service as sched
from app.services.delay_service import DelayService
from app.services import saved_route_service as sr_service


def detect_intent(message: str) -> str:
    """Map a user message to an intent keyword."""
    lower = message.lower().strip()

    if re.search(r"\b(from|to|get|go|route|travel|journey|reach)\b", lower) and \
       re.search(r"\bto\b", lower):
        return "find_route"
    if re.search(r"\b(next|when|departure|depart|bus from|leave)\b", lower):
        return "next_departure"
    if re.search(r"\b(about|explain|describe|tell me about|route r\d)\b", lower):
        return "explain_route"
    if re.search(r"\b(delay|late|disruption|on time)\b", lower):
        return "delay_info"
    if re.search(r"\b(cheap|cheapest|cheaper|compare|alternative|vs|versus)\b", lower):
        return "compare"
    if re.search(r"\b(save|saved|bookmark|favourite|favorite)\b", lower):
        return "saved_routes"
    return "help"


def _extract_stop_names(
    message: str, stops: Dict[str, Any]
) -> tuple[Optional[str], Optional[str]]:
    """
    Try to find origin and destination stop names in a message.

    Looks for patterns like "from X to Y" or falls back to matching
    known stop names.
    """
    lower = message.lower()

    match = re.search(r"from\s+(.+?)\s+to\s+(.+?)[\?\.]?$", lower)
    if match:
        origin_text = match.group(1).strip()
        dest_text = match.group(2).strip()
    else:
        origin_text = dest_text = None

    def find_stop_id(text: Optional[str]) -> Optional[str]:
        if not text:
            return None
        for sid, stop in stops.items():
            if stop.stop_name.lower() in text or text in stop.stop_name.lower():
                return sid
            if sid.lower() in text:
                return sid
        return None

    origin_id = find_stop_id(origin_text)
    dest_id = find_stop_id(dest_text)

    # Fallback: find any two stop names mentioned.
    if not origin_id or not dest_id:
        mentioned = []
        for sid, stop in stops.items():
            if stop.stop_name.lower() in lower or sid.lower() in lower:
                if sid not in mentioned:
                    mentioned.append(sid)
        if len(mentioned) >= 2 and not origin_id:
            origin_id = mentioned[0]
        if len(mentioned) >= 2 and not dest_id:
            dest_id = mentioned[1]

    return origin_id, dest_id


def _handle_with_rules(
    message: str,
    td: TransportData,
    routing_service: RoutingService,
    delay_service: DelayService,
    service_day: str = "weekday",
) -> Dict[str, Any]:
    """
    Process a user's chat message and return a response.

    Returns:
        {
            "intent": str,
            "reply": str          – human-readable answer,
            "data": Optional[…] – structured data when relevant
        }
    """
    intent = detect_intent(message)

    if intent == "find_route":
        origin_id, dest_id = _extract_stop_names(message, td.stops_by_id)
        if not origin_id or not dest_id:
            return {
                "intent": intent,
                "reply": (
                    "I couldn't identify both stops. Please mention the origin "
                    "and destination by name, e.g. 'How do I get from Rajiv Chowk "
                    "to Hauz Khas?'"
                ),
                "data": None,
            }
        try:
            options = routing_service.search(
                origin_id, dest_id, "08:00",
                preference="fastest",
                delay_minutes=delay_service.get_all_delays(),
                service_day=service_day,
            )
        except ValueError as e:
            return {"intent": intent, "reply": str(e), "data": None}

        if not options:
            return {
                "intent": intent,
                "reply": f"No route found from {td.stops_by_id[origin_id].stop_name} "
                         f"to {td.stops_by_id[dest_id].stop_name} at 08:00.",
                "data": None,
            }
        opt = options[0]
        legs_text = " → ".join(
            f"{leg.board_stop_name} ({leg.departure_time})" for leg in opt.legs
        )
        legs_text += f" → {opt.legs[-1].alight_stop_name} ({opt.legs[-1].arrival_time})"
        reply = (
            f"The {opt.label.lower()} route takes {opt.total_duration_minutes} minutes. "
            f"Path: {legs_text}."
        )
        if opt.total_fare is not None:
            reply += f" Fare: ₹{opt.total_fare}."
        if opt.transfers:
            reply += f" Transfers: {len(opt.transfers)}."
        return {"intent": intent, "reply": reply, "data": [o.model_dump() for o in options]}

    if intent == "next_departure":
        # Try to find the stop name in the message.
        stop_id = None
        lower = message.lower()
        for sid, stop in td.stops_by_id.items():
            if stop.stop_name.lower() in lower or sid.lower() in lower:
                stop_id = sid
                break
        if not stop_id:
            return {
                "intent": intent,
                "reply": "Please specify a stop name, e.g. 'Next bus from Rajiv Chowk'.",
                "data": None,
            }
        deps = sched.next_departures(
            td, stop_id, "08:00", limit=5, service_day=service_day
        )
        if not deps:
            return {
                "intent": intent,
                "reply": f"No upcoming departures from {td.stops_by_id[stop_id].stop_name} after 08:00.",
                "data": None,
            }
        lines = [f"  {d['route_name']} at {d['departure_time']}" for d in deps]
        reply = f"Next departures from {td.stops_by_id[stop_id].stop_name}:\n" + "\n".join(lines)
        return {"intent": intent, "reply": reply, "data": deps}

    if intent == "explain_route":
        route_match = re.search(r"\b(r\d+)\b", message, re.IGNORECASE)
        if route_match:
            route_id = route_match.group(1).upper()
            route = td.routes_by_id.get(route_id)
            if route:
                # Find all stops on any trip of this route.
                trip_ids = [t.trip_id for t in td.trips if t.route_id == route_id]
                if trip_ids:
                    first_trip = trip_ids[0]
                    stop_names = [
                        td.stops_by_id[st.stop_id].stop_name
                        for st in td.stop_times_by_trip.get(first_trip, [])
                        if st.stop_id in td.stops_by_id
                    ]
                    reply = (
                        f"Route {route.route_name} ({route.route_id}): "
                        f"{route.description}. Stops: {' → '.join(stop_names)}."
                    )
                    return {"intent": intent, "reply": reply, "data": route.model_dump()}
        return {
            "intent": intent,
            "reply": "Please specify a route ID like R01, e.g. 'Tell me about route R01'.",
            "data": None,
        }

    if intent == "delay_info":
        delays = delay_service.get_all_delays()
        if not delays:
            return {
                "intent": intent,
                "reply": "No delays are currently active. All services running on schedule (simulated).",
                "data": None,
            }
        lines = [f"  Trip {t}: +{m} min (simulated)" for t, m in delays.items()]
        reply = "Current simulated delays:\n" + "\n".join(lines)
        return {"intent": intent, "reply": reply, "data": delays}

    if intent == "compare":
        origin_id, dest_id = _extract_stop_names(message, td.stops_by_id)
        if not origin_id or not dest_id:
            return {
                "intent": intent,
                "reply": "Please specify two stops to compare routes between them.",
                "data": None,
            }
        options = routing_service.search(
            origin_id, dest_id, "08:00",
            preference="cheapest",
            delay_minutes=delay_service.get_all_delays(),
        )
        if len(options) < 2:
            return {
                "intent": intent,
                "reply": "Only one route option is available for this pair.",
                "data": [o.model_dump() for o in options] if options else None,
            }
        reply_parts = []
        for opt in options:
            fare_str = f"₹{opt.total_fare}" if opt.total_fare is not None else "N/A"
            reply_parts.append(
                f"  {opt.label}: {opt.total_duration_minutes} min, fare {fare_str}"
            )
        reply = "Route comparison:\n" + "\n".join(reply_parts)
        return {"intent": intent, "reply": reply, "data": [o.model_dump() for o in options]}

    if intent == "saved_routes":
        saved = sr_service.list_saved_routes()
        if not saved:
            return {
                "intent": intent,
                "reply": "You have no saved routes yet. Use the 'Save Route' button to bookmark a trip.",
                "data": None,
            }
        lines = [
            f"  {r.label}: {r.origin_stop_name} → {r.destination_stop_name}"
            for r in saved
        ]
        return {
            "intent": intent,
            "reply": "Your saved routes:\n" + "\n".join(lines),
            "data": [r.model_dump() for r in saved],
        }

    # help / unknown intent
    return {
        "intent": "help",
        "reply": (
            "I can help with:\n"
            "  • 'How do I get from Rajiv Chowk to Saket?' – find a route\n"
            "  • 'Next bus from Kashmere Gate' – upcoming departures\n"
            "  • 'Tell me about route R01' – route details\n"
            "  • 'Are there any delays?' – current disruptions\n"
            "  • 'Compare routes from New Delhi Station to Hauz Khas' – alternatives\n"
            "  • 'Show saved routes' – your bookmarks"
        ),
        "data": None,
    }


class GrokChatError(RuntimeError):
    """Raised when the configured Grok provider cannot return a valid reply."""


def _compose_with_grok(message: str, grounded_response: Dict[str, Any]) -> str:
    """Rephrase a deterministic, data-grounded response without adding facts."""
    context = json.dumps(
        {
            "verified_reply": grounded_response["reply"],
            "verified_data": grounded_response["data"],
        },
        ensure_ascii=False,
        default=str,
    )
    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.xai_api_key}"},
                json={
                    "model": settings.xai_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are Aaroh-Saarthi, a public transit assistant. "
                                "Answer the user's question using only the supplied "
                                "verified transit context. Do not invent routes, "
                                "times, fares, live status, or other facts. If the "
                                "context does not answer the question, say so and "
                                "ask what transit detail they need. The transit "
                                "dataset is synthetic and simulated."
                            ),
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Question: {message}\n\n"
                                f"Verified transit context: {context}"
                            ),
                        },
                    ],
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPError as error:
        raise GrokChatError("The configured Grok chat service is unavailable.") from error
    except ValueError as error:
        raise GrokChatError("The configured Grok chat service returned invalid data.") from error

    try:
        reply = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise GrokChatError("The configured Grok chat service returned an invalid response.") from error
    if not isinstance(reply, str) or not reply.strip():
        raise GrokChatError("The configured Grok chat service returned an empty reply.")
    return reply.strip()


def handle_message(
    message: str,
    td: TransportData,
    routing_service: RoutingService,
    delay_service: DelayService,
    service_day: str = "weekday",
) -> Dict[str, Any]:
    """Return transit-grounded chat, optionally phrased by Grok."""
    result = _handle_with_rules(
        message, td, routing_service, delay_service, service_day
    )
    if settings.xai_api_key:
        result["reply"] = _compose_with_grok(message, result)
    return result
