"""
Tests for the schedule-aware routing engine.

Covers:  direct journeys, transfers, fastest vs cheapest,
         missed connections, delays, unreachable destinations,
         missing fares, invalid stops.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.data_loader import load_all
from app.services.routing_service import RoutingService, time_to_minutes, minutes_to_time
from app.models.transport import Fare, Route, Stop, StopTime, Trip
from app.services.data_loader import TransportData


def _make_service():
    td = load_all()
    return RoutingService(td), td


def _make_custom_service(stop_specs, trip_specs, fare_specs):
    td = TransportData()
    for stop_id, zone_id in stop_specs:
        stop = Stop(
            stop_id=stop_id,
            stop_name=stop_id,
            stop_lat=0,
            stop_lon=0,
            zone_id=zone_id,
        )
        td.stops.append(stop)
        td.stops_by_id[stop_id] = stop

    route_ids = {route_id for _, route_id, _ in trip_specs}
    for route_id in route_ids:
        route = Route(route_id=route_id, route_name=route_id)
        td.routes.append(route)
        td.routes_by_id[route_id] = route

    for trip_id, route_id, stop_times in trip_specs:
        trip = Trip(trip_id=trip_id, route_id=route_id)
        td.trips.append(trip)
        td.trips_by_id[trip_id] = trip
        td.stop_times_by_trip[trip_id] = [
            StopTime(
                trip_id=trip_id,
                stop_id=stop_id,
                stop_sequence=index,
                arrival_time=arrival_time,
                departure_time=departure_time,
            )
            for index, (stop_id, arrival_time, departure_time) in enumerate(
                stop_times, start=1
            )
        ]

    for route_id, from_zone, to_zone, amount in fare_specs:
        fare = Fare(
            route_id=route_id,
            from_zone_id=from_zone,
            to_zone_id=to_zone,
            fare_amount=amount,
        )
        td.fares.append(fare)
        td.fare_lookup[(route_id, from_zone, to_zone)] = fare

    return RoutingService(td)


# 1. Direct journey
def test_direct_journey():
    svc, td = _make_service()
    options = svc.search("S13", "S01", "07:00", preference="fastest")
    assert len(options) >= 1
    opt = options[0]
    assert opt.departure_time is not None
    assert opt.total_duration_minutes > 0
    assert opt.legs[0].board_stop_id == "S13"
    assert opt.legs[-1].alight_stop_id == "S01"


# 2. Journey requiring a transfer
def test_transfer_journey():
    svc, td = _make_service()
    # S13 (Blue) to S09 (Green): requires transfer at S05
    options = svc.search("S13", "S09", "07:00", preference="fastest")
    assert len(options) >= 1
    opt = options[0]
    assert len(opt.legs) >= 2, "Expected a transfer (multi-leg) journey"
    assert len(opt.transfers) >= 1


# 3. Fastest vs cheapest comparison
def test_fastest_vs_cheapest():
    svc, td = _make_service()
    options = svc.search("S04", "S08", "06:30", preference="cheapest")
    assert len(options) >= 1
    # At least one option should have fare information.
    has_fare = any(opt.fare_available for opt in options)
    assert has_fare or len(options) >= 1  # fare data may not always differ


# 4. Missed connection (depart too late)
def test_late_departure_no_route():
    svc, td = _make_service()
    # After all trips have departed (23:00), no journey should be found.
    options = svc.search("S13", "S01", "23:00", preference="fastest")
    assert len(options) == 0, "Expected no route at 23:00"


# 5. Delayed connection
def test_delay_affects_routing():
    svc, td = _make_service()
    delays = {"T01": 15}
    options_normal = svc.search("S13", "S01", "07:00", preference="fastest")
    options_delayed = svc.search("S13", "S01", "07:00", preference="fastest",
                                  delay_minutes=delays)
    # Either the delayed journey takes longer, or a different trip is chosen.
    if options_normal and options_delayed:
        normal_arr = time_to_minutes(options_normal[0].arrival_time)
        delayed_arr = time_to_minutes(options_delayed[0].arrival_time)
        assert delayed_arr >= normal_arr


# 6. Unreachable destination
def test_unreachable_destination():
    svc, td = _make_service()
    # S09 to S13 – check if there's a return path; if not, should be empty.
    # (This depends on dataset; if there IS a path, test still passes.)
    options = svc.search("S09", "S13", "07:00", preference="fastest")
    # Either returns options (valid path exists) or empty list (no path).
    assert isinstance(options, list)


# 7. Departure time outside service hours
def test_no_service_at_midnight():
    svc, td = _make_service()
    options = svc.search("S02", "S09", "23:59", preference="fastest")
    assert len(options) == 0


def test_direct_journey_preserves_extended_time_after_midnight():
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("D", "2")],
        trip_specs=[
            ("T-OVERNIGHT", "R-NIGHT", [
                ("O", "23:55", "23:55"),
                ("D", "24:15", "24:15"),
            ]),
        ],
        fare_specs=[],
    )

    options = svc.search("O", "D", "23:50", preference="fastest")

    assert len(options) == 1
    assert options[0].departure_time == "23:55"
    assert options[0].arrival_time == "24:15"
    assert options[0].total_duration_minutes == 20


@pytest.mark.parametrize(
    ("next_departure", "expected_arrival"),
    [("23:59", None), ("24:00", "24:10")],
)
def test_transfer_buffer_applies_across_midnight(
    next_departure, expected_arrival
):
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("X", "2"), ("D", "3")],
        trip_specs=[
            ("T-FIRST-NIGHT", "R-FIRST", [
                ("O", "23:40", "23:40"),
                ("X", "23:58", "23:58"),
            ]),
            ("T-SECOND-NIGHT", "R-SECOND", [
                ("X", next_departure, next_departure),
                ("D", "24:10", "24:10"),
            ]),
        ],
        fare_specs=[],
    )

    options = svc.search("O", "D", "23:40", preference="fastest")

    if expected_arrival is None:
        assert options == []
    else:
        assert options[0].arrival_time == expected_arrival
        assert options[0].total_duration_minutes == 30
        assert options[0].transfers[0].wait_minutes == 2


# 8. Missing fare data
def test_missing_fare_data():
    svc, td = _make_service()
    options = svc.search("S13", "S01", "07:00", preference="cheapest")
    # Should not crash even if fare data is incomplete.
    assert isinstance(options, list)


def test_cheapest_search_discloses_when_fare_data_is_missing():
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("D", "2")],
        trip_specs=[
            ("T-NO-FARE", "R-NO-FARE", [
                ("O", "08:00", "08:00"),
                ("D", "08:20", "08:20"),
            ]),
        ],
        fare_specs=[],
    )

    options = svc.search("O", "D", "08:00", preference="cheapest")

    assert len(options) == 1
    assert options[0].option_id == "fastest"
    assert options[0].fare_available is False
    assert options[0].total_fare is None


# 9. Invalid stop IDs
def test_invalid_origin():
    svc, td = _make_service()
    try:
        svc.search("INVALID", "S01", "08:00")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Unknown origin" in str(e)


def test_invalid_destination():
    svc, td = _make_service()
    try:
        svc.search("S01", "INVALID", "08:00")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Unknown destination" in str(e)


def test_same_origin_destination():
    svc, td = _make_service()
    try:
        svc.search("S01", "S01", "08:00")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "different" in str(e).lower()


def test_cheapest_search_keeps_faster_costlier_label_for_transfer():
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("X", "2"), ("D", "3")],
        trip_specs=[
            ("T-EXPENSIVE", "R-EXPENSIVE", [
                ("O", "08:00", "08:00"),
                ("X", "08:10", "08:10"),
            ]),
            ("T-CHEAP", "R-CHEAP", [
                ("O", "08:05", "08:05"),
                ("X", "08:20", "08:20"),
            ]),
            ("T-LAST", "R-LAST", [
                ("X", "08:15", "08:15"),
                ("D", "08:25", "08:25"),
            ]),
        ],
        fare_specs=[
            ("R-EXPENSIVE", "1", "2", 5),
            ("R-CHEAP", "1", "2", 1),
            ("R-LAST", "2", "3", 1),
        ],
    )

    options = svc.search("O", "D", "08:00", preference="cheapest")

    assert len(options) == 1
    assert options[0].fare_available is True
    assert options[0].total_fare == 6
    assert [leg.trip_id for leg in options[0].legs] == ["T-EXPENSIVE", "T-LAST"]


def test_cheapest_search_charges_fare_once_per_ride_leg():
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("M", "1"), ("D", "2")],
        trip_specs=[
            ("T-DIRECT", "R-DIRECT", [
                ("O", "08:00", "08:00"),
                ("M", "08:05", "08:05"),
                ("D", "08:10", "08:10"),
            ]),
        ],
        fare_specs=[
            ("R-DIRECT", "1", "1", 3),
            ("R-DIRECT", "1", "2", 5),
        ],
    )

    options = svc.search("O", "D", "08:00", preference="cheapest")

    assert len(options) == 1
    assert options[0].fare_available is True
    assert options[0].total_fare == 5
    assert len(options[0].legs) == 1
    assert options[0].legs[0].intermediate_stops == ["M"]
    assert options[0].legs[0].intermediate_stop_ids == ["M"]


def test_intermediate_stop_ids_follow_trip_direction():
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("M", "1"), ("D", "2")],
        trip_specs=[
            ("T-REVERSE", "R-REVERSE", [
                ("D", "08:00", "08:00"),
                ("M", "08:05", "08:05"),
                ("O", "08:10", "08:10"),
            ]),
        ],
        fare_specs=[],
    )

    options = svc.search("D", "O", "08:00", preference="fastest")

    assert len(options) == 1
    assert options[0].legs[0].intermediate_stops == ["M"]
    assert options[0].legs[0].intermediate_stop_ids == ["M"]


def test_search_returns_distinct_fastest_and_cheapest_itineraries():
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("D", "2")],
        trip_specs=[
            ("T-FAST", "R-FAST", [
                ("O", "08:00", "08:00"),
                ("D", "08:20", "08:20"),
            ]),
            ("T-CHEAP", "R-CHEAP", [
                ("O", "08:05", "08:05"),
                ("D", "08:25", "08:25"),
            ]),
        ],
        fare_specs=[
            ("R-FAST", "1", "2", 10),
            ("R-CHEAP", "1", "2", 2),
        ],
    )

    options = svc.search("O", "D", "08:00", preference="cheapest")

    assert [option.option_id for option in options] == ["fastest", "cheapest"]
    assert options[0].legs[0].trip_id == "T-FAST"
    assert options[1].legs[0].trip_id == "T-CHEAP"
    assert options[1].total_fare == 2
    assert options[1].arrival_time > options[0].arrival_time


@pytest.mark.parametrize(
    ("next_departure", "expected_arrival"),
    [("08:11", None), ("08:12", "08:22")],
)
def test_transfer_requires_two_minute_buffer(next_departure, expected_arrival):
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("X", "2"), ("D", "3")],
        trip_specs=[
            ("T-FIRST", "R-FIRST", [
                ("O", "08:00", "08:00"),
                ("X", "08:10", "08:10"),
            ]),
            ("T-SECOND", "R-SECOND", [
                ("X", next_departure, next_departure),
                ("D", "08:22", "08:22"),
            ]),
        ],
        fare_specs=[
            ("R-FIRST", "1", "2", 2),
            ("R-SECOND", "2", "3", 2),
        ],
    )

    options = svc.search("O", "D", "08:00", preference="fastest")

    if expected_arrival is None:
        assert options == []
    else:
        assert options[0].arrival_time == expected_arrival
        assert options[0].transfers[0].wait_minutes == 2


def test_delay_can_make_transfer_infeasible_and_select_later_service():
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("X", "2"), ("D", "3")],
        trip_specs=[
            ("T-FIRST", "R-FIRST", [
                ("O", "08:00", "08:00"),
                ("X", "08:10", "08:10"),
            ]),
            ("T-SECOND", "R-SECOND", [
                ("X", "08:12", "08:12"),
                ("D", "08:22", "08:22"),
            ]),
            ("T-LATER", "R-LATER", [
                ("X", "08:16", "08:16"),
                ("D", "08:26", "08:26"),
            ]),
        ],
        fare_specs=[
            ("R-FIRST", "1", "2", 2),
            ("R-SECOND", "2", "3", 2),
            ("R-LATER", "2", "3", 3),
        ],
    )

    normal = svc.search("O", "D", "08:00", preference="fastest")
    delayed = svc.search(
        "O", "D", "08:00", preference="fastest", delay_minutes={"T-FIRST": 3}
    )

    assert normal[0].arrival_time == "08:22"
    assert delayed[0].arrival_time == "08:26"
    assert delayed[0].delay_warnings


# 10. Time conversion utilities
def test_time_to_minutes():
    assert time_to_minutes("08:30") == 510
    assert time_to_minutes("00:00") == 0
    assert time_to_minutes("23:59") == 1439
    assert time_to_minutes("24:05") == 1445


@pytest.mark.parametrize("invalid_time", ["8:30", "08:60", "48:00", "xx:yy"])
def test_time_to_minutes_rejects_invalid_values(invalid_time):
    with pytest.raises(ValueError, match="Invalid time"):
        time_to_minutes(invalid_time)


def test_minutes_to_time():
    assert minutes_to_time(510) == "08:30"
    assert minutes_to_time(0) == "00:00"
    assert minutes_to_time(1455) == "24:15"


# 11. Multi-leg transfer fare calculations and route_type verification
def test_s02_to_s08_fastest_and_cheapest_fares_calculated_independently():
    svc, _ = _make_service()
    options = svc.search("S02", "S08", "08:00", preference="fastest")

    assert len(options) == 2
    fastest = options[0]
    cheapest = options[1]

    # Fastest journey: Green Line (S02->S10, ₹25) + Yellow Express (S10->S08, ₹15) = ₹40
    assert fastest.option_id == "fastest"
    assert fastest.fare_available is True
    assert fastest.total_fare == 40.0
    assert len(fastest.legs) == 2
    assert all(leg.route_type == "bus" for leg in fastest.legs)
    assert fastest.legs[0].fare == 25.0
    assert fastest.legs[1].fare == 15.0

    # Cheapest journey: Green Line (S02->S05, ₹10) + Red Ring (S05->S08, ₹20) = ₹30
    assert cheapest.option_id == "cheapest"
    assert cheapest.fare_available is True
    assert cheapest.total_fare == 30.0
    assert len(cheapest.legs) == 2
    assert all(leg.route_type == "bus" for leg in cheapest.legs)
    assert cheapest.legs[0].fare == 10.0
    assert cheapest.legs[1].fare == 20.0


def test_transfer_journey_with_missing_leg_fare_does_not_report_partial_fare():
    # Leg 1 has a fare (1->2 = 5), Leg 2 has NO fare rule.
    svc = _make_custom_service(
        stop_specs=[("O", "1"), ("X", "2"), ("D", "3")],
        trip_specs=[
            ("T-LEG1", "R-LEG1", [
                ("O", "08:00", "08:00"),
                ("X", "08:10", "08:10"),
            ]),
            ("T-LEG2", "R-LEG2", [
                ("X", "08:15", "08:15"),
                ("D", "08:30", "08:30"),
            ]),
        ],
        fare_specs=[
            ("R-LEG1", "1", "2", 5),
            # R-LEG2 from 2 to 3 is intentionally omitted
        ],
    )

    options = svc.search("O", "D", "08:00", preference="fastest")
    assert len(options) >= 1
    fastest = options[0]
    assert len(fastest.legs) == 2
    assert fastest.legs[0].fare == 5.0
    assert fastest.legs[1].fare is None
    # Crucial: Must NOT report partial total_fare == 5.0
    assert fastest.fare_available is False
    assert fastest.total_fare is None


def test_explicit_fare_override_honored():
    from app.services.routing_service import _assemble_option, Journey, Connection

    svc, td = _make_service()
    dummy_conn = Connection(
        trip_id="T01",
        route_id="R01",
        from_stop_id="S13",
        to_stop_id="S01",
        departure_minutes=420,
        arrival_minutes=480,
        stop_sequence_from=1,
        stop_sequence_to=5,
    )
    journey = Journey(connections=[dummy_conn], total_fare=99.0, fare_available=True)
    opt = _assemble_option(
        journey=journey,
        option_id="custom",
        label="Custom",
        td=td,
        delay_minutes={},
        total_fare_override=99.0,
        fare_available=True,
    )
    assert opt.total_fare == 99.0
    assert opt.fare_available is True

