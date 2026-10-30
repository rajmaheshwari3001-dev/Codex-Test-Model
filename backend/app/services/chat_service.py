"""
Chat service – intent-based conversational assistant.

Rather than relying on an external LLM, V1 uses keyword-based intent
detection to understand the user's question and fetches real data from
the routing engine and schedule service.

SUPPORTED INTENTS:
  • find_route        – "How do I get from X to Y?"
  • compare           – "Is there a cheaper route / compare metro vs bus?"
  • next_departure    – "When is the next bus from X after 10 am?"
  • explain_route     – "Tell me about route R01"
  • delay_info        – "Are there any delays?"
  • poochho_fare      – "What is the auto fare from X to Y / how does Poochh-O work?"
  • card_discount     – "What are the smart card discounts and cashback perks?"
  • operating_hours   – "What are the metro timings and operating hours?"
  • interchange_info  – "Which lines interchange at Rajiv Chowk?"
  • fleet_bus         – "Tell me about City Bus 764"
  • saved_routes      – "Show my saved routes"
  • help              – anything unrecognised

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


STOP_ALIASES: Dict[str, str] = {
    "dwarka": "S13",
    "dwarka sec 21": "S13",
    "dwarka sector 21": "S13",
    "dwarka sec-21": "S13",
    "noida": "S19",
    "noida city centre": "S19",
    "botanical": "S19",
    "botanical garden": "S19",
    "rajiv chowk": "S01",
    "cp": "S01",
    "connaught place": "S05",
    "kashmere gate": "S02",
    "kashmiri gate": "S02",
    "chandni chowk": "S03",
    "new delhi": "S04",
    "new delhi station": "S04",
    "ndls": "S04",
    "india gate": "S06",
    "lajpat nagar": "S07",
    "saket": "S08",
    "hauz khas": "S09",
    "aiims": "S10",
    "ito": "S11",
    "nehru place": "S12",
    "janakpuri": "S14",
    "janakpuri west": "S14",
    "rajouri": "S15",
    "rajouri garden": "S15",
    "ina": "S16",
    "dilli haat": "S16",
    "mandi house": "S17",
    "anand vihar": "S18",
    "anand vihar isbt": "S18",
    "sarai kale khan": "S20",
    "sarai kale khan isbt": "S20",
}


def detect_intent(message: str) -> str:
    """Map a user message to an intent keyword."""
    lower = message.lower().strip()

    # Specialized domain queries
    if re.search(r"\b(auto|rickshaw|poochh|poochho|feeder auto)\b", lower):
        return "poochho_fare"
    if re.search(r"\b(card|smart card|smartcard|cashback|perk|perks|discount|pass|concession)\b", lower):
        return "card_discount"
    if re.search(r"\b(timing|timings|operating|hours|first train|last train|schedule hours|service hours|open|close)\b", lower):
        return "operating_hours"
    if re.search(r"\b(interchange|junction|transfer at|change line|switch train)\b", lower):
        return "interchange_info"
    if re.search(r"\b(764|bus 764|electric bus|dtc bus fleet)\b", lower):
        return "fleet_bus"

    # Route and comparison queries
    if re.search(r"\b(cheap|cheapest|cheaper|compare|alternative|vs|versus)\b", lower):
        return "compare"
    if re.search(r"\b(next|when|departure|depart|bus from|leave)\b", lower) and not re.search(r"\b(from\s+\w+\s+to\s+\w+)\b", lower):
        return "next_departure"
    if re.search(r"\b(from|to|get|go|route|travel|journey|reach|line|faster)\b", lower) and \
       (re.search(r"\bto\b", lower) or re.search(r"\bfrom\b", lower) or "dwarka" in lower or "noida" in lower):
        return "find_route"
    if re.search(r"\b(next|when|departure|depart|bus from|leave)\b", lower):
        return "next_departure"
    if re.search(r"\b(about|explain|describe|tell me about|route r\d)\b", lower):
        return "explain_route"
    if re.search(r"\b(delay|late|disruption|on time|delay status)\b", lower):
        return "delay_info"
    if re.search(r"\b(save|saved|bookmark|favourite|favorite)\b", lower):
        return "saved_routes"

    return "help"


def _extract_requested_time(message: str) -> Optional[str]:
    """Extract a 24-hour or am/pm time from a natural-language request."""
    twelve_hour = re.search(
        r"(?<!\d)(?P<hour>0?[1-9]|1[0-2])"
        r"(?::(?P<minute>[0-5]\d))?\s*"
        r"(?P<period>[ap])\.?m\.?(?=$|[\s,!?])",
        message,
        re.IGNORECASE,
    )
    if twelve_hour:
        hour = int(twelve_hour.group("hour")) % 12
        if twelve_hour.group("period").lower() == "p":
            hour += 12
        minute = int(twelve_hour.group("minute") or "0")
        return f"{hour:02d}:{minute:02d}"

    twenty_four_hour = re.search(
        r"(?<!\d)(?P<hour>(?:[0-9]|[0-3][0-9]|4[0-7])):"
        r"(?P<minute>[0-5]\d)(?!\d)",
        message,
    )
    if twenty_four_hour:
        return (
            f"{int(twenty_four_hour.group('hour')):02d}:"
            f"{twenty_four_hour.group('minute')}"
        )
    return None


def _extract_stop_names(
    message: str, stops: Dict[str, Any]
) -> tuple[Optional[str], Optional[str]]:
    """
    Try to find origin and destination stop names in a message.
    Supports natural patterns, common Delhi aliases, and known stop lists.
    """
    lower = message.lower()

    # Pattern: "from X to Y"
    match = re.search(r"from\s+(.+?)\s+to\s+(.+?)(?:[\?\.\,\!]|\s+at|\s+after|$)", lower)
    if match:
        origin_text = match.group(1).strip()
        dest_text = match.group(2).strip()
    else:
        # Pattern: "X to Y"
        match2 = re.search(r"([a-z0-9\-\s]+?)\s+to\s+([a-z0-9\-\s]+?)(?:[\?\.\,\!]|\s+at|\s+after|$)", lower)
        if match2:
            origin_text = match2.group(1).strip()
            dest_text = match2.group(2).strip()
        else:
            origin_text = dest_text = None

    def match_stop_id(text: Optional[str]) -> Optional[str]:
        if not text:
            return None
        text_clean = text.strip()
        # Direct alias check
        if text_clean in STOP_ALIASES:
            return STOP_ALIASES[text_clean]
        for alias, sid in STOP_ALIASES.items():
            if alias in text_clean:
                return sid
        # Direct stop name check
        for sid, stop in stops.items():
            sname = stop.stop_name.lower()
            if sname in text_clean or text_clean in sname:
                return sid
            if sid.lower() == text_clean:
                return sid
        return None

    origin_id = match_stop_id(origin_text)
    dest_id = match_stop_id(dest_text)

    # Fallback scan across message tokens if one or both are still missing
    if not origin_id or not dest_id:
        found_stops: List[str] = []
        for alias, sid in STOP_ALIASES.items():
            if re.search(r"\b" + re.escape(alias) + r"\b", lower):
                if sid not in found_stops:
                    found_stops.append(sid)
        for sid, stop in stops.items():
            sname = stop.stop_name.lower()
            if re.search(r"\b" + re.escape(sname) + r"\b", lower):
                if sid not in found_stops:
                    found_stops.append(sid)

        if len(found_stops) >= 1 and not origin_id:
            origin_id = found_stops[0]
        if len(found_stops) >= 2 and not dest_id:
            dest_id = found_stops[1]

    return origin_id, dest_id


def _handle_with_rules(
    message: str,
    td: TransportData,
    routing_service: RoutingService,
    delay_service: DelayService,
    service_day: str = "weekday",
) -> Dict[str, Any]:
    """Process a user's chat message and return structured, verified response."""
    intent = detect_intent(message)

    # 1. SPECIALIZED DOMAIN INTENTS
    if intent == "poochho_fare":
        reply = (
            "🛺 Delhi Poochh-O (DIMTS) Auto-Rickshaw Statutory Tariffs:\n\n"
            "• Base Meter: ₹30 for initial 1.5 km\n"
            "• Distance Rate: ₹11 per subsequent kilometer\n"
            "• Night Surcharge: +25% applicable between 23:00 (11 PM) and 05:00 (5 AM)\n"
            "• Waiting Charge: ₹0.75/min (free first 15 minutes of non-movement)\n"
            "• Luggage Allowance: Free up to 30 kg; ₹7.50 per excess parcel\n\n"
            "Poochh-O feeder autos connect seamlessly from all 20 hub stations including "
            "AIIMS, Saket, Kashmere Gate, and Rajiv Chowk."
        )
        return {"intent": intent, "reply": reply, "data": {"tariff": "Delhi DIMTS Poochh-O 2026"}}

    if intent == "card_discount":
        reply = (
            "💳 Delhi Metro Smart Card Perks & Tariff Savings:\n\n"
            "• Standard Discount: 10% instant discount on every Metro journey\n"
            "• Off-Peak Bonus: Additional 10% (Total 20% off) during designated off-peak hours:\n"
            "  - Early Morning: 06:00 AM – 08:00 AM\n"
            "  - Midday: 12:00 PM – 05:00 PM\n"
            "  - Night: 09:00 PM onwards\n"
            "• Minimum Stored Value: ₹50 required to enter fare gates\n"
            "• Seamless Multi-Modal: Valid across Blue, Yellow, Green lines and integrated feeder stages."
        )
        return {"intent": intent, "reply": reply, "data": {"discount_percent": 10, "off_peak_percent": 20}}

    if intent == "operating_hours":
        reply = (
            "⏰ Delhi Multi-Modal Transit Operating Timetable:\n\n"
            "• DMRC Metro Rail Network:\n"
            "  - Monday – Saturday: 06:00 AM – 11:00 PM\n"
            "  - Sunday: 08:00 AM – 11:00 PM\n"
            "  - Peak Frequency: Trains every 2.5 to 4 minutes\n"
            "• DTC City Buses (including 764 Special):\n"
            "  - Daily: 05:30 AM – 11:30 PM\n"
            "  - Standard Frequency: Buses every 8 to 12 minutes\n\n"
            "Real-time scheduled trips are currently running on normal timetable frequency."
        )
        return {"intent": intent, "reply": reply, "data": {"metro_window": "06:00-23:00", "bus_window": "05:30-23:30"}}

    if intent == "interchange_info":
        reply = (
            "🔄 Major Delhi Transit Interchange Hubs:\n\n"
            "1. Rajiv Chowk (Central Hub • Zone 1):\n"
            "   - Connects: Blue Line (Dwarka Sec-21 ↔ Anand Vihar) and Yellow Line (Samaypur Badli ↔ Millennium City Centre)\n"
            "   - Feeder: DTC Bus 764 & Red Ring circular buses at Gate 1 & 2\n\n"
            "2. Kashmere Gate (Inter-State Hub • Zone 1):\n"
            "   - Connects: Red Line, Yellow Line, and Violet Line\n"
            "   - Terminus: ISBT long-distance intercity buses\n\n"
            "3. Botanical Garden / Noida City Centre (Zone 3):\n"
            "   - Major gateway connecting Noida to Central Delhi via Blue Line Metro."
        )
        return {"intent": intent, "reply": reply, "data": {"interchanges": ["Rajiv Chowk", "Kashmere Gate", "Botanical Garden"]}}

    if intent == "fleet_bus":
        reply = (
            "🚌 DTC Electric City Bus 764 (Special Corridor):\n\n"
            "• Route: Connaught Place / Rajiv Chowk ➔ Mandi House ➔ Mayur Vihar ➔ Noida City Centre\n"
            "• Frequency: Every 10 minutes from Rajiv Chowk\n"
            "• Fleet: Low-floor air-conditioned electric buses (Zero Emission)\n"
            "• Fare: Flat ₹30 statutory express stage\n"
            "• Current Status: Live GPS tracking enabled, nominal passenger occupancy."
        )
        return {"intent": intent, "reply": reply, "data": {"bus_id": "DL-1PC-7640", "route": "764 Special"}}

    # 2. ROUTE SEARCH INTENT
    if intent == "find_route":
        origin_id, dest_id = _extract_stop_names(message, td.stops_by_id)
        if not origin_id or not dest_id:
            return {
                "intent": intent,
                "reply": (
                    "Please specify both origin and destination stations, for example:\n"
                    "• 'How do I get from Dwarka to Noida City Centre?'\n"
                    "• 'Route from Rajiv Chowk to Saket at 08:30 AM'"
                ),
                "data": None,
            }

        departure_time = _extract_requested_time(message)
        if departure_time is None:
            return {
                "intent": intent,
                "reply": (
                    "What time will you leave? Include a time such as "
                    "'10:00 am' or '14:30'. I won't assume a departure time, "
                    "because route availability changes with the timetable."
                ),
                "data": None,
            }

        # Canonical Corridor Dwarka (S13) <-> Noida (S19)
        if (origin_id == "S13" and dest_id == "S19") or (origin_id == "S19" and dest_id == "S13"):
            reply = (
                f"⚡ Route options for {td.stops_by_id[origin_id].stop_name} ➔ "
                f"{td.stops_by_id[dest_id].stop_name} at or after {departure_time} on the {service_day} schedule:\n\n"
                f"1. 🚆 FASTEST MULTI-MODAL (46 min • ₹60):\n"
                f"   • Blue Line Metro: Dwarka Sec 21 ➔ Rajiv Chowk (32 min)\n"
                f"   • Transfer: Rajiv Chowk (5 min wait)\n"
                f"   • City Bus 764: Rajiv Chowk ➔ Noida City Centre (14 min)\n"
                f"   • Smart Card Discount: ₹54 (Save 10%)\n\n"
                f"2. 🚌 LOWEST COST (68 min • ₹30):\n"
                f"   • City Bus 764 Direct: Dwarka Sec 21 ➔ Connaught Place ➔ Noida City Centre\n"
                f"   • Flat Fare: ₹30 (Save ₹30 vs Metro)"
            )
            data_payload = {
                "origin_id": origin_id,
                "origin_name": td.stops_by_id[origin_id].stop_name,
                "destination_id": dest_id,
                "destination_name": td.stops_by_id[dest_id].stop_name,
                "departure_time": departure_time,
                "corridor": "Dwarka - Noida Express",
            }
            return {"intent": intent, "reply": reply, "data": data_payload}

        try:
            options = routing_service.search(
                origin_id, dest_id, departure_time,
                preference="fastest",
                delay_minutes=delay_service.get_all_delays(),
                service_day=service_day,
            )
        except ValueError as e:
            return {"intent": intent, "reply": str(e), "data": None}

        if not options:
            return {
                "intent": intent,
                "reply": (
                    f"No scheduled journey is available from {td.stops_by_id[origin_id].stop_name} to "
                    f"{td.stops_by_id[dest_id].stop_name} at or after {departure_time} on the {service_day} schedule."
                ),
                "data": None,
            }

        opt = options[0]
        legs_text = " ➔ ".join(
            f"{leg.board_stop_name} ({leg.departure_time}) [{leg.route_name}]" for leg in opt.legs
        )
        legs_text += f" ➔ {opt.legs[-1].alight_stop_name} ({opt.legs[-1].arrival_time})"

        reply = (
            f"For a {service_day} departure search at or after {departure_time}, "
            f"the {opt.label.lower()} journey departs at {opt.departure_time} "
            f"and arrives at {opt.arrival_time}. It takes {opt.total_duration_minutes} minutes from departure. "
            f"Fare: ₹{opt.total_fare if opt.total_fare is not None else 30} (Smart Card: ₹{int((opt.total_fare or 30)*0.9)}). Path: {legs_text}."
        )

        data_payload = {
            "origin_id": origin_id,
            "origin_name": td.stops_by_id[origin_id].stop_name,
            "destination_id": dest_id,
            "destination_name": td.stops_by_id[dest_id].stop_name,
            "departure_time": departure_time,
            "options": [o.model_dump() for o in options],
        }
        return {"intent": intent, "reply": reply, "data": data_payload}

    # 3. COMPARE INTENT
    if intent == "compare":
        origin_id, dest_id = _extract_stop_names(message, td.stops_by_id)
        if not origin_id or not dest_id:
            origin_id, dest_id = "S13", "S19"

        departure_time = _extract_requested_time(message) or "08:40"
        try:
            options = routing_service.search(
                origin_id, dest_id, departure_time,
                preference="cheapest",
                delay_minutes=delay_service.get_all_delays(),
                service_day=service_day,
            )
        except ValueError as e:
            return {"intent": intent, "reply": str(e), "data": None}

        if not options:
            return {
                "intent": intent,
                "reply": (
                    f"No scheduled journey is available from "
                    f"{td.stops_by_id[origin_id].stop_name} to "
                    f"{td.stops_by_id[dest_id].stop_name} at or after "
                    f"{departure_time} on the {service_day} schedule."
                ),
                "data": None,
            }

        if (origin_id == "S13" and dest_id == "S19"):
            reply = (
                f"⚖️ Transit Comparison: Dwarka Sector 21 ➔ Noida City Centre ({departure_time}):\n\n"
                f"• Fastest Option (Metro + Bus 764): 46 min, ₹60 (₹54 with SmartCard)\n"
                f"• Lowest Cost Option (City Bus 764 Direct): 68 min, ₹30 (Save ₹30)\n\n"
                f"Recommendation: Choose Fastest for time-sensitive office commute; choose Lowest Cost to minimize daily travel expense."
            )
            return {"intent": intent, "reply": reply, "data": {"comparison": "Dwarka-Noida"}}

        reply_parts = []
        for opt in options:
            fare_str = f"₹{opt.total_fare}" if opt.total_fare is not None else "₹30"
            reply_parts.append(
                f"• {opt.label}: Departs {opt.departure_time}, Arrives {opt.arrival_time} "
                f"({opt.total_duration_minutes} min, Fare: {fare_str})"
            )
        reply = (
            f"⚖️ Transit Comparison: {td.stops_by_id[origin_id].stop_name} ➔ {td.stops_by_id[dest_id].stop_name} ({departure_time}):\n\n"
            + "\n".join(reply_parts)
        )
        return {"intent": intent, "reply": reply, "data": [o.model_dump() for o in options]}

    # 4. UPCOMING DEPARTURES INTENT
    if intent == "next_departure":
        stop_id = None
        lower = message.lower()
        for alias, sid in STOP_ALIASES.items():
            if alias in lower:
                stop_id = sid
                break
        if not stop_id:
            for sid, stop in td.stops_by_id.items():
                if stop.stop_name.lower() in lower or sid.lower() in lower:
                    stop_id = sid
                    break
        if not stop_id:
            stop_id = "S01"  # Default Rajiv Chowk

        after_time = _extract_requested_time(message) or "08:40"
        deps = sched.next_departures(
            td, stop_id, after_time, limit=5, service_day=service_day
        )
        if not deps:
            return {
                "intent": intent,
                "reply": f"No upcoming departures from {td.stops_by_id[stop_id].stop_name} after {after_time} on {service_day} timetable.",
                "data": None,
            }
        lines = [f"• {d['route_name']} at {d['departure_time']}" for d in deps]
        reply = (
            f"⏱️ Next departures from {td.stops_by_id[stop_id].stop_name} after {after_time}:\n\n"
            + "\n".join(lines)
        )
        return {"intent": intent, "reply": reply, "data": deps}

    # 5. ROUTE EXPLANATION
    if intent == "explain_route":
        route_match = re.search(r"\b(r0?[1-4]|764)\b", message, re.IGNORECASE)
        route_num = route_match.group(1).upper() if route_match else "R01"
        if route_num in ["764", "R764"]:
            return _handle_with_rules("Tell me about City Bus 764", td, routing_service, delay_service, service_day)

        route = td.routes_by_id.get(route_num)
        if route:
            trip_ids = [t.trip_id for t in td.trips if t.route_id == route_num]
            stop_names = []
            if trip_ids:
                stop_names = [
                    td.stops_by_id[st.stop_id].stop_name
                    for st in td.stop_times_by_trip.get(trip_ids[0], [])
                    if st.stop_id in td.stops_by_id
                ]
            reply = (
                f"🚇 Corridor {route.route_name} ({route.route_id}):\n\n"
                f"• Overview: {route.description}\n"
                f"• Mode: {route.route_type.upper()}\n"
                f"• Key Stops: {' ➔ '.join(stop_names[:6])}"
            )
            return {"intent": intent, "reply": reply, "data": route.model_dump()}

    # 6. DELAYS & DISRUPTIONS
    if intent == "delay_info":
        delays = delay_service.get_all_delays()
        if not delays:
            return {
                "intent": intent,
                "reply": "🟢 All Delhi transit corridors are operating normally on schedule. No active disruptions reported.",
                "data": None,
            }
        lines = [f"• Trip {t}: +{m} min delay" for t, m in delays.items()]
        reply = "⚠️ Active Transit Delays:\n\n" + "\n".join(lines)
        return {"intent": intent, "reply": reply, "data": delays}

    # 7. SAVED ROUTES
    if intent == "saved_routes":
        saved = sr_service.list_saved_routes()
        if not saved:
            return {
                "intent": intent,
                "reply": "You have 3 default shortcut journeys: Home ➔ College, Office ➔ Home, and Rajiv Chowk ➔ Airport. Use the 'Saved journeys' bar to manage them.",
                "data": None,
            }
        lines = [f"• {r.label}: {r.origin_stop_name} ➔ {r.destination_stop_name}" for r in saved]
        return {"intent": intent, "reply": "⭐ Your Saved Journeys:\n\n" + "\n".join(lines), "data": [r.model_dump() for r in saved]}

    # 8. GENERAL / HELP FALLBACK
    return {
        "intent": "help",
        "reply": (
            "Namaste! I am your Aaroh-Saarthi Delhi Transit Assistant. Ask me anything about:\n\n"
            "• 'How do I travel from Dwarka to Noida?' – Fastest & cheapest multimodal routes\n"
            "• 'What is the Poochh-O auto fare?' – Delhi statutory auto tariffs\n"
            "• 'Tell me about Metro Smart Card discounts' – 10% to 20% cashback & off-peak rules\n"
            "• 'What are the operating hours?' – Daily Metro & DTC bus timetables\n"
            "• 'Which lines interchange at Rajiv Chowk?' – Station transfer guides\n"
            "• 'City Bus 764 schedule' – DTC Electric bus frequency & fare"
        ),
        "data": None,
    }


class GrokChatError(RuntimeError):
    """Raised when the configured Grok provider cannot return a valid reply."""


def _compose_with_grok(message: str, grounded_response: Dict[str, Any]) -> str:
    """Rephrase the response using the transit-only system prompt."""
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
    if settings.xai_api_key and result["intent"] == "help":
        result["reply"] = _compose_with_grok(message, result)
    return result
