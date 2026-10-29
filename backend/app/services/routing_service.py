"""
Schedule-aware routing service.

WHAT PROBLEM DOES THIS SOLVE?
  Simple graph shortest-path (like Dijkstra) finds the fewest hops or
  the shortest distance.  Transit routing is harder because you must
  also account for:

    • When does the next bus actually leave?
    • Can I physically make this transfer, or has the connecting trip
      already departed?
    • Is the cheapest path the same as the fastest one?

HOW IT WORKS (algorithm overview):
  We implement a simplified Connection Scan Algorithm (CSA) variant:

  1.  Build single-trip ride segments from every boarding stop to each
      later alighting stop, preserving the scheduled departure and arrival.

  2.  Sort ride segments by departure time so we can scan forward in time.

  3.  From the origin stop at the requested departure time, greedily
      find the earliest arrival at the destination.  We track the
      "earliest arrival time" at every stop and propagate it through
      reachable connections.

  4.  For the cheapest option we re-run with a separate fare-weighted
      objective.

  We also build a NetworkX graph to support future extensions (e.g.
  walking transfers, isochrone maps).

HOW TO TEST IT:
  See backend/tests/test_routing.py
  Run: pytest tests/test_routing.py -v
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import networkx as nx

from app.models.journey import JourneyLeg, JourneyOption, TransferInfo
from app.models.transport import Stop, StopTime, Trip
from app.services.data_loader import TransportData


# ---------------------------------------------------------------------------
# Helper: time parsing utilities
# ---------------------------------------------------------------------------

def time_to_minutes(time_str: str) -> int:
    """
    Convert "HH:MM" to minutes since midnight.

    Example:
        time_to_minutes("08:30")  ->  510

    We use integer minutes throughout the routing engine so comparisons
    are simple arithmetic rather than datetime subtraction.
    """
    if not re.fullmatch(r"\d{2}:\d{2}", time_str):
        raise ValueError(f"Invalid time {time_str!r}; expected HH:MM.")

    hours, minutes = (int(part) for part in time_str.split(":"))
    if hours > 47 or minutes > 59:
        raise ValueError(f"Invalid time {time_str!r}; expected a valid HH:MM value.")
    return hours * 60 + minutes


def minutes_to_time(minutes: int) -> str:
    """
    Convert minutes since midnight back to "HH:MM".

    Handles past-midnight correctly (e.g. 1440 -> "24:00").
    """
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


# ---------------------------------------------------------------------------
# Connection – smallest unit of traversal
# ---------------------------------------------------------------------------

@dataclass
class Connection:
    """
    A ride segment: board a trip at one stop and alight at a later stop.

    A trip with N stops produces N*(N-1)/2 ride segments.
    """
    trip_id: str
    route_id: str
    from_stop_id: str
    to_stop_id: str
    departure_minutes: int        # departure from from_stop
    arrival_minutes: int          # arrival at to_stop
    stop_sequence_from: int       # position of from_stop in the trip
    stop_sequence_to: int         # position of to_stop in the trip


@dataclass
class Journey:
    """
    A complete journey assembled from a sequence of connections.

    We reconstruct this *after* the scan to produce a JourneyOption.
    """
    connections: List[Connection] = field(default_factory=list)
    total_fare: Optional[float] = None
    fare_available: bool = False


@dataclass(eq=False)
class FareLabel:
    """A nondominated fare/arrival label used by cheapest-route search."""

    arrival_minutes: int
    total_fare: float
    trip_id: Optional[str] = None
    previous: Optional["FareLabel"] = None
    connection: Optional[Connection] = None


# ---------------------------------------------------------------------------
# Build connections list from loaded data
# ---------------------------------------------------------------------------

def build_connections(td: TransportData) -> List[Connection]:
    """
    Create all Connection objects from the stop_times data.

    For each trip, we pair consecutive stop-times to create connections.

    Example:
      Trip T01 stops: S13 (07:00) -> S14 (07:18) -> S15 (07:35) -> ...
      Connections produced:
        S13 -> S14  depart 07:00 arrive 07:18
        S14 -> S15  depart 07:19 arrive 07:35  (departure = 07:19 since
                                                  bus waits 1 min at S14)
    """
    connections: List[Connection] = []
    for trip_id, stop_times in td.stop_times_by_trip.items():
        trip = td.trips_by_id.get(trip_id)
        if not trip:
            continue
        route_id = trip.route_id

        for i in range(len(stop_times) - 1):
            from_st = stop_times[i]
            to_st = stop_times[i + 1]
            conn = Connection(
                trip_id=trip_id,
                route_id=route_id,
                from_stop_id=from_st.stop_id,
                to_stop_id=to_st.stop_id,
                departure_minutes=time_to_minutes(from_st.departure_time),
                arrival_minutes=time_to_minutes(to_st.arrival_time),
                stop_sequence_from=from_st.stop_sequence,
                stop_sequence_to=to_st.stop_sequence,
            )
            connections.append(conn)

    # Sort by departure time so we can scan forward chronologically.
    connections.sort(key=lambda c: c.departure_minutes)
    return connections


def build_ride_segments(td: TransportData) -> List[Connection]:
    """Build every feasible single-trip ride from each stop to a later stop."""
    segments: List[Connection] = []
    for trip_id, stop_times in td.stop_times_by_trip.items():
        trip = td.trips_by_id.get(trip_id)
        if not trip:
            continue

        for start_index, from_st in enumerate(stop_times[:-1]):
            for to_st in stop_times[start_index + 1:]:
                segments.append(Connection(
                    trip_id=trip_id,
                    route_id=trip.route_id,
                    from_stop_id=from_st.stop_id,
                    to_stop_id=to_st.stop_id,
                    departure_minutes=time_to_minutes(from_st.departure_time),
                    arrival_minutes=time_to_minutes(to_st.arrival_time),
                    stop_sequence_from=from_st.stop_sequence,
                    stop_sequence_to=to_st.stop_sequence,
                ))

    segments.sort(key=lambda segment: segment.departure_minutes)
    return segments


# ---------------------------------------------------------------------------
# NetworkX graph (for future extensions)
# ---------------------------------------------------------------------------

def build_network_graph(td: TransportData) -> nx.DiGraph:
    """
    Build a directed weighted graph of the transport network.

    Nodes are stop IDs.  Each edge represents a direct connection between
    two stops on a trip.  Edge weight = travel time in minutes.

    This graph is used for quick reachability checks and will support
    walking-transfer edges in future versions.
    """
    G = nx.DiGraph()

    for stop in td.stops:
        G.add_node(stop.stop_id, name=stop.stop_name)

    for trip_id, stop_times in td.stop_times_by_trip.items():
        for i in range(len(stop_times) - 1):
            from_st = stop_times[i]
            to_st = stop_times[i + 1]
            travel_time = (
                time_to_minutes(to_st.arrival_time)
                - time_to_minutes(from_st.departure_time)
            )
            G.add_edge(
                from_st.stop_id,
                to_st.stop_id,
                weight=travel_time,
                trip_id=trip_id,
            )
    return G


# ---------------------------------------------------------------------------
# Core scan algorithm
# ---------------------------------------------------------------------------

def _find_fastest_journey(
    origin_id: str,
    destination_id: str,
    departure_minutes: int,
    connections: List[Connection],
    delay_minutes: Dict[str, int],  # trip_id -> extra delay in minutes
) -> Optional[Journey]:
    """
    Find the journey that arrives earliest at the destination.

    Algorithm:
      - earliest_arrival[stop] = minimum arrival time reached so far
      - We scan ride segments in effective departure-time order.
      - If we can board the segment (we have arrived at from_stop
        before it departs), we update earliest_arrival at to_stop.
      - Ride segments avoid treating a vehicle's one-minute stop dwell as a
        passenger transfer.

    Args:
        origin_id:          Starting stop ID.
        destination_id:     Target stop ID.
        departure_minutes:  When the passenger is ready to depart.
        connections:        Ride segments sorted by departure time.
        delay_minutes:      Simulated delays to add per trip.

    Returns:
        A Journey object, or None if destination is unreachable.
    """
    INF = math.inf

    # earliest_arrival[stop_id] = earliest minute we can be at that stop
    earliest_arrival: Dict[str, float] = {c.from_stop_id: INF for c in connections}
    earliest_arrival.update({c.to_stop_id: INF for c in connections})
    earliest_arrival[origin_id] = float(departure_minutes)

    # For each stop, which connection last improved it
    arriving_connection: Dict[str, Optional[Connection]] = {}

    ordered_connections = sorted(
        connections,
        key=lambda conn: conn.departure_minutes + delay_minutes.get(conn.trip_id, 0),
    )

    for conn in ordered_connections:
        # Apply any simulated delay for this trip.
        effective_departure = conn.departure_minutes + delay_minutes.get(conn.trip_id, 0)
        effective_arrival = conn.arrival_minutes + delay_minutes.get(conn.trip_id, 0)

        from_arrival = earliest_arrival.get(conn.from_stop_id, INF)

        # Can we board this connection?
        # At the origin stop we just need to be there before departure.
        # At a transfer stop we require a 2-minute buffer.
        if conn.from_stop_id == origin_id:
            can_board = from_arrival <= effective_departure
        else:
            can_board = from_arrival <= effective_departure - 2

        if can_board:
            if effective_arrival < earliest_arrival.get(conn.to_stop_id, INF):
                earliest_arrival[conn.to_stop_id] = effective_arrival
                arriving_connection[conn.to_stop_id] = conn

    if earliest_arrival.get(destination_id, INF) == INF:
        return None  # unreachable

    # Reconstruct the sequence of connections.
    path: List[Connection] = []
    current_stop = destination_id
    while current_stop != origin_id:
        conn = arriving_connection.get(current_stop)
        if conn is None:
            return None  # path broken (shouldn't happen)
        path.append(conn)
        current_stop = conn.from_stop_id
    path.reverse()

    return Journey(connections=path)


def _find_cheapest_journey(
    origin_id: str,
    destination_id: str,
    departure_minutes: int,
    ride_segments: List[Connection],
    td: TransportData,
    delay_minutes: Dict[str, int],
) -> Optional[Journey]:
    """
    Find the journey with the lowest total fare that is still feasible.

    Ride segments represent one complete boarding-to-alighting leg, so fares
    are charged once per vehicle leg rather than once per adjacent stop pair.
    Multiple nondominated labels are retained at each stop because a cheaper
    but later arrival may miss a connection that a costlier arrival can catch.

    IMPORTANT:
      This is a separate objective.  A journey might be slower but
      cheaper if it uses fewer zones.  If no fare data exists, we return
      None and the API reports fare_available=False.

    Args:
        td: loaded transport data for fare lookups.

    Returns:
        A Journey object, or None if cheapest route cannot be determined.
    """
    initial_label = FareLabel(
        arrival_minutes=departure_minutes,
        total_fare=0.0,
    )
    labels_by_stop: Dict[str, List[FareLabel]] = {origin_id: [initial_label]}
    ordered_segments = sorted(
        ride_segments,
        key=lambda segment: (
            segment.departure_minutes + delay_minutes.get(segment.trip_id, 0)
        ),
    )

    for conn in ordered_segments:
        effective_departure = conn.departure_minutes + delay_minutes.get(conn.trip_id, 0)
        effective_arrival = conn.arrival_minutes + delay_minutes.get(conn.trip_id, 0)

        from_stop = td.stops_by_id.get(conn.from_stop_id)
        to_stop = td.stops_by_id.get(conn.to_stop_id)
        if not from_stop or not to_stop:
            continue

        fare_key = (conn.route_id, from_stop.zone_id, to_stop.zone_id)
        fare_rule = td.fare_lookup.get(fare_key)
        if fare_rule is None:
            continue

        for previous_label in list(labels_by_stop.get(conn.from_stop_id, [])):
            if previous_label.trip_id == conn.trip_id:
                continue

            transfer_buffer = 0 if conn.from_stop_id == origin_id else 2
            if previous_label.arrival_minutes > effective_departure - transfer_buffer:
                continue

            new_label = FareLabel(
                arrival_minutes=effective_arrival,
                total_fare=previous_label.total_fare + fare_rule.fare_amount,
                trip_id=conn.trip_id,
                previous=previous_label,
                connection=conn,
            )
            labels = labels_by_stop.setdefault(conn.to_stop_id, [])
            if any(
                label.total_fare <= new_label.total_fare
                and label.arrival_minutes <= new_label.arrival_minutes
                for label in labels
            ):
                continue

            labels[:] = [
                label for label in labels
                if not (
                    new_label.total_fare <= label.total_fare
                    and new_label.arrival_minutes <= label.arrival_minutes
                )
            ]
            labels.append(new_label)

    destination_labels = labels_by_stop.get(destination_id, [])
    if not destination_labels:
        return None  # no fare-complete path found

    best_label = min(
        destination_labels,
        key=lambda label: (label.total_fare, label.arrival_minutes),
    )
    path: List[Connection] = []
    current_label = best_label
    while current_label.connection is not None:
        path.append(current_label.connection)
        if current_label.previous is None:
            return None
        current_label = current_label.previous
    path.reverse()

    return Journey(
        connections=path,
        total_fare=best_label.total_fare,
        fare_available=True,
    )


# ---------------------------------------------------------------------------
# Assembling a JourneyOption from a Journey
# ---------------------------------------------------------------------------

def _assemble_option(
    journey: Journey,
    option_id: str,
    label: str,
    td: TransportData,
    delay_minutes: Dict[str, int],
    total_fare_override: Optional[float] = None,
    fare_available: bool = False,
) -> JourneyOption:
    """
    Convert a Journey (list of raw connections) into a rich JourneyOption.

    This function:
      - Groups consecutive connections on the same trip into one leg.
      - Identifies transfer stops.
      - Calculates total duration.
      - Looks up fare, route color, crowding info, and delay warnings.
    """
    if not journey.connections:
        raise ValueError("Cannot assemble option from empty journey.")

    # Group consecutive connections on the same trip into legs.
    legs: List[JourneyLeg] = []
    transfers: List[TransferInfo] = []
    warnings: List[str] = []
    crowding_warnings: List[str] = []
    delay_warnings: List[str] = []

    def _make_leg(trip_id: str, conns: List[Connection], leg_idx: int) -> JourneyLeg:
        """Build a JourneyLeg from a contiguous block of same-trip connections."""
        trip = td.trips_by_id[trip_id]
        route = td.routes_by_id.get(trip.route_id)
        first_conn = conns[0]
        last_conn = conns[-1]

        dep_min = first_conn.departure_minutes + delay_minutes.get(trip_id, 0)
        arr_min = last_conn.arrival_minutes + delay_minutes.get(trip_id, 0)

        # Intermediate stop names
        intermediate_stop_times = [
            stop_time
            for stop_time in td.stop_times_by_trip[trip_id]
            if first_conn.stop_sequence_from < stop_time.stop_sequence
            < last_conn.stop_sequence_to
            and stop_time.stop_id in td.stops_by_id
        ]
        intermediate = [
            td.stops_by_id[stop_time.stop_id].stop_name
            for stop_time in intermediate_stop_times
        ]

        # Fare for this leg
        from_stop = td.stops_by_id.get(first_conn.from_stop_id)
        to_stop = td.stops_by_id.get(last_conn.to_stop_id)
        leg_fare = None
        if from_stop and to_stop:
            fare_key = (trip.route_id, from_stop.zone_id, to_stop.zone_id)
            fare_rule = td.fare_lookup.get(fare_key)
            if fare_rule:
                leg_fare = fare_rule.fare_amount

        # Crowding check for the boarding stop.
        occ = td.occupancy_lookup.get((trip_id, first_conn.from_stop_id))
        if occ and occ.occupancy_level in ("high",):
            crowding_warnings.append(
                f"Trip {trip_id} is crowded at "
                f"{td.stops_by_id[first_conn.from_stop_id].stop_name} "
                f"({occ.occupancy_level} load, ~{occ.typical_load_percent}%)"
            )

        return JourneyLeg(
            leg_index=leg_idx,
            trip_id=trip_id,
            route_id=trip.route_id,
            route_name=route.route_name if route else trip.route_id,
            route_color=route.route_color if route else "#666666",
            board_stop_id=first_conn.from_stop_id,
            board_stop_name=td.stops_by_id.get(
                first_conn.from_stop_id, Stop(
                    stop_id=first_conn.from_stop_id,
                    stop_name=first_conn.from_stop_id,
                    stop_lat=0, stop_lon=0,
                )
            ).stop_name,
            alight_stop_id=last_conn.to_stop_id,
            alight_stop_name=td.stops_by_id.get(
                last_conn.to_stop_id, Stop(
                    stop_id=last_conn.to_stop_id,
                    stop_name=last_conn.to_stop_id,
                    stop_lat=0, stop_lon=0,
                )
            ).stop_name,
            departure_time=minutes_to_time(dep_min),
            arrival_time=minutes_to_time(arr_min),
            intermediate_stops=intermediate,
            intermediate_stop_ids=[
                stop_time.stop_id for stop_time in intermediate_stop_times
            ],
            fare=leg_fare,
        )

    # --- Group connections into legs ---
    current_trip_id = journey.connections[0].trip_id
    current_group: List[Connection] = []

    for conn in journey.connections:
        if conn.trip_id == current_trip_id:
            current_group.append(conn)
        else:
            # New trip = transfer occurred.
            legs.append(_make_leg(current_trip_id, current_group, len(legs)))

            # Transfer info: the alight stop of the last leg is the transfer point.
            transfer_stop_id = current_group[-1].to_stop_id
            transfer_stop = td.stops_by_id.get(transfer_stop_id)
            wait_dep = conn.departure_minutes + delay_minutes.get(conn.trip_id, 0)
            wait_arr = current_group[-1].arrival_minutes + delay_minutes.get(
                current_trip_id, 0
            )
            wait_min = wait_dep - wait_arr

            transfers.append(TransferInfo(
                at_stop_id=transfer_stop_id,
                at_stop_name=transfer_stop.stop_name if transfer_stop else transfer_stop_id,
                wait_minutes=max(wait_min, 0),
            ))

            # Check delays.
            delay_val = delay_minutes.get(current_trip_id, 0)
            if delay_val > 0:
                delay_warnings.append(
                    f"Trip {current_trip_id} is running {delay_val} minutes late "
                    f"(simulated delay). Times shown are estimated."
                )

            current_trip_id = conn.trip_id
            current_group = [conn]

    # Final leg.
    legs.append(_make_leg(current_trip_id, current_group, len(legs)))
    last_delay = delay_minutes.get(current_trip_id, 0)
    if last_delay > 0:
        delay_warnings.append(
            f"Trip {current_trip_id} is running {last_delay} minutes late "
            f"(simulated delay)."
        )

    first_dep = time_to_minutes(legs[0].departure_time)
    last_arr = time_to_minutes(legs[-1].arrival_time)
    total_duration = last_arr - first_dep

    data_status = "simulated" if delay_minutes else "scheduled"

    total_fare = total_fare_override
    if total_fare is None and fare_available:
        total_fare = sum(leg.fare or 0 for leg in legs)

    return JourneyOption(
        option_id=option_id,
        label=label,
        total_duration_minutes=total_duration,
        departure_time=legs[0].departure_time,
        arrival_time=legs[-1].arrival_time,
        legs=legs,
        transfers=transfers,
        total_fare=total_fare,
        fare_available=fare_available,
        crowding_warnings=crowding_warnings,
        delay_warnings=delay_warnings,
        data_status=data_status,
        warnings=warnings,
    )


# ---------------------------------------------------------------------------
# Public interface used by the API
# ---------------------------------------------------------------------------

class RoutingService:
    """
    Entry point for route searches.

    Usage:
        service = RoutingService(transport_data)
        options = service.search(origin, destination, departure_time, preference)
    """

    def __init__(self, td: TransportData) -> None:
        self.td = td
        self.connections = build_connections(td)
        self.ride_segments = build_ride_segments(td)
        self.graph = build_network_graph(td)

    def reload(self, td: TransportData) -> None:
        """Rebuild connections if the data has changed (e.g. after delays applied)."""
        self.td = td
        self.connections = build_connections(td)
        self.ride_segments = build_ride_segments(td)
        self.graph = build_network_graph(td)

    def search(
        self,
        origin_id: str,
        destination_id: str,
        departure_time: str,
        preference: str = "fastest",
        delay_minutes: Optional[Dict[str, int]] = None,
    ) -> List[JourneyOption]:
        """
        Search for journey options from origin to destination.

        Args:
            origin_id:      Stop ID of the origin.
            destination_id: Stop ID of the destination.
            departure_time: "HH:MM" – the passenger's ready time.
            preference:     "fastest" or "cheapest".
            delay_minutes:  Optional dict of trip_id -> delay_minutes
                            to apply simulated disruptions.

        Returns:
            List of JourneyOption (may be empty if no route exists).

        Raises:
            ValueError: if origin or destination stop ID is unknown.
        """
        if delay_minutes is None:
            delay_minutes = {}

        # Validate stop IDs.
        if origin_id not in self.td.stops_by_id:
            raise ValueError(f"Unknown origin stop ID: {origin_id!r}")
        if destination_id not in self.td.stops_by_id:
            raise ValueError(f"Unknown destination stop ID: {destination_id!r}")
        if origin_id == destination_id:
            raise ValueError("Origin and destination must be different stops.")

        dep_minutes = time_to_minutes(departure_time)
        options: List[JourneyOption] = []

        # Always compute the fastest option.
        fastest = _find_fastest_journey(
            origin_id, destination_id, dep_minutes, self.ride_segments, delay_minutes
        )
        if fastest:
            opt = _assemble_option(
                fastest, "fastest", "Fastest", self.td, delay_minutes
            )
            options.append(opt)

        # For "cheapest" preference, also compute the cheapest path.
        cheapest = _find_cheapest_journey(
            origin_id, destination_id, dep_minutes, self.ride_segments, self.td,
            delay_minutes,
        )
        if cheapest:
            cheapest_opt = _assemble_option(
                cheapest,
                "cheapest",
                "Cheapest",
                self.td,
                delay_minutes,
                total_fare_override=cheapest.total_fare,
                fare_available=True,
            )
            fastest_signature = [
                (leg.trip_id, leg.board_stop_id, leg.alight_stop_id)
                for leg in options[0].legs
            ] if options else None
            cheapest_signature = [
                (leg.trip_id, leg.board_stop_id, leg.alight_stop_id)
                for leg in cheapest_opt.legs
            ]
            if not options or cheapest_signature != fastest_signature:
                options.append(cheapest_opt)
            elif cheapest_opt.total_fare is not None and options:
                # Same path but now we have fare data – enrich the fastest option.
                options[0].total_fare = cheapest_opt.total_fare
                options[0].fare_available = True

        return options
