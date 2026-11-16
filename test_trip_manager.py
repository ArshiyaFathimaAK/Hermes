"""
test_trip_manager.py
====================
Purpose : Functional and non-functional tests for the Hermes "Saved Trips"
          screen (UC-09 View Saved Trips) and "Edit trip" screen (UC-10
          Manage Trip). Test data mirrors the 'Austin weekend' mock-ups.
Run     : pytest -v            (writes test_results.md automatically)
Creator : <Your Name>

ID scheme
---------
TC-F-xx  functional (successful, alternative, invalid input, exceptional)
TC-N-xx  non-functional (performance, reliability, usability)

Each docstring lists: scenario type, preconditions, test data, expected result.
Fixture 'seeded' (conftest.py): alice has Austin weekend (Nov 20-22, 2026,
3 stops on Fri, 1 on Sat), Paris getaway, Tokyo spring; bob has one trip.
"""
import time
from datetime import date

import pytest

import trip_manager as tm
from trip_manager import (AccessDeniedError, TripNotFoundError, ValidationError)

CREATOR = "<Your Name>"
FRI, SAT, SUN = date(2026, 11, 20), date(2026, 11, 21), date(2026, 11, 22)


# ===========================================================================
# UC-09  View Saved Trips  (TC-F-01 .. TC-F-10)
# ===========================================================================
@pytest.mark.tc("TC-F-01")
def test_saved_trips_list_soonest_first(seeded):
    """Successful flow. Pre: alice has 3 saved trips.
    Expect: Austin weekend, Paris getaway, Tokyo spring (soonest first)."""
    result = seeded["service"].view_saved_trips("alice")
    assert [t.name for t in result.trips] == [
        "Austin weekend", "Paris getaway", "Tokyo spring"]
    assert result.message == ""


@pytest.mark.tc("TC-F-02")
def test_trip_card_shows_name_destination_and_time_frame(seeded):
    """Successful flow. Data: Austin weekend card.
    Expect: destination 'Austin, Texas, United States' and time frame
    'Nov 20, 2026 to Nov 22, 2026'."""
    trip = seeded["service"].view_saved_trips("alice").trips[0]
    assert trip.name == "Austin weekend"
    assert trip.destination == "Austin, Texas, United States"
    assert trip.time_frame_label == "Nov 20, 2026 to Nov 22, 2026"


@pytest.mark.tc("TC-F-03")
def test_saved_trips_empty_state(service):
    """Exceptional condition. Pre: user has no saved trips.
    Expect: empty list and message 'You have no saved trips.'"""
    result = service.view_saved_trips("newuser")
    assert result.trips == []
    assert result.message == "You have no saved trips."


@pytest.mark.tc("TC-F-04")
def test_saved_trips_only_shows_own_trips(seeded):
    """Security. Data: owner='bob'. Expect only "Bob's trip"."""
    result = seeded["service"].view_saved_trips("bob")
    assert [t.name for t in result.trips] == ["Bob's trip"]


@pytest.mark.tc("TC-F-05")
def test_day_tabs_match_trip_dates(seeded):
    """Successful flow. Data: Austin weekend (Nov 20-22, 2026).
    Expect tabs 'Fri 20', 'Sat 21', 'Sun 22'."""
    trip = seeded["austin"]
    assert trip.day_tabs() == ["Fri 20", "Sat 21", "Sun 22"]


@pytest.mark.tc("TC-F-06")
def test_friday_itinerary_heading_count_and_order(seeded):
    """Successful flow. Data: Friday tab. Stops were saved out of order.
    Expect heading 'Friday, November 20', '3 stops', and chronological
    stops with time ranges 09:00-10:30, 12:00-13:00, 15:00-16:00."""
    trip = seeded["austin"]
    stops = trip.stops_for_day(FRI)
    assert trip.day_heading(FRI) == "Friday, November 20"
    assert trip.stop_count_label(FRI) == "3 stops"
    assert [s.title for s in stops] == [
        "Walk Lady Bird Lake", "Lunch on South Congress",
        "Check in at Lakeside House"]
    assert [s.time_range_label for s in stops] == [
        "09:00–10:30", "12:00–13:00", "15:00–16:00"]


@pytest.mark.tc("TC-F-07")
def test_stop_detail_lines_show_category_duration_cost(seeded):
    """Successful flow. Data: Friday's three stops.
    Expect 'Destination · 1.5 hours · Free', 'Activity · 1 hour · Est. $28',
    'Lodging · 1 night · Est. $145'."""
    stops = seeded["austin"].stops_for_day(FRI)
    assert [s.detail_label for s in stops] == [
        "Destination · 1.5 hours · Free",
        "Activity · 1 hour · Est. $28",
        "Lodging · 1 night · Est. $145"]


@pytest.mark.tc("TC-F-08")
def test_saturday_one_stop_and_sunday_no_stops(seeded):
    """Alternative flow. Expect Saturday '1 stop' (singular) and Sunday
    '0 stops' with an empty stop list."""
    trip = seeded["austin"]
    assert trip.stop_count_label(SAT) == "1 stop"
    assert trip.stop_count_label(SUN) == "0 stops"
    assert trip.stops_for_day(SUN) == []


@pytest.mark.tc("TC-F-09")
def test_trip_details_not_found(seeded):
    """Exceptional condition. Data: trip id 9999.
    Expect TripNotFoundError 'Trip not found.'"""
    with pytest.raises(TripNotFoundError) as exc:
        seeded["service"].get_trip_details("alice", 9999)
    assert str(exc.value) == "Trip not found."


@pytest.mark.tc("TC-F-10")
def test_trip_details_other_users_trip_denied(seeded):
    """Security. Data: alice requests bob's trip.
    Expect AccessDeniedError with the permission message."""
    with pytest.raises(AccessDeniedError) as exc:
        seeded["service"].get_trip_details("alice", seeded["bob"].trip_id)
    assert str(exc.value) == "You do not have permission to access this trip."


# ===========================================================================
# UC-10  Manage Trip: edit / delete  (TC-F-11 .. TC-F-18)
# ===========================================================================
@pytest.mark.tc("TC-F-11")
def test_edit_trip_name_destination_and_dates(seeded):
    """Successful flow. Data: name='Austin long weekend', destination=
    'Austin, TX, USA', dates Nov 19-23, 2026 (extended; stops still fit).
    Expect changes saved and 5 day tabs Thu 19 .. Mon 23."""
    svc, tid = seeded["service"], seeded["austin"].trip_id
    svc.update_trip("alice", tid, name="Austin long weekend",
                    destination="Austin, TX, USA",
                    start_date="2026-11-19", end_date="2026-11-23")
    trip = svc.get_trip_details("alice", tid)
    assert (trip.name, trip.destination) == ("Austin long weekend",
                                             "Austin, TX, USA")
    assert trip.day_tabs() == ["Thu 19", "Fri 20", "Sat 21", "Sun 22", "Mon 23"]
    assert len(trip.stops) == 4          # itinerary untouched


@pytest.mark.tc("TC-F-12")
def test_trip_privacy_defaults_private_and_can_share_by_link(seeded):
    """Alternative flow. Pre: new trips are 'Private' (only the owner can
    view). Data: privacy='link' then back to 'private'. Expect each saved."""
    svc, tid = seeded["service"], seeded["austin"].trip_id
    assert seeded["austin"].privacy == "private"
    assert svc.update_trip("alice", tid, privacy="link").privacy == "link"
    assert svc.update_trip("alice", tid, privacy="private").privacy == "private"


@pytest.mark.tc("TC-F-13")
@pytest.mark.parametrize("changes, msg", [
    ({"name": "   "}, "Trip name is required."),
    ({"destination": ""}, "Destination is required."),
    ({"start_date": "11/20/2026"}, "Dates must be in YYYY-MM-DD format."),
    ({"end_date": "2026-11-10"}, "End date cannot be before start date."),
    ({"privacy": "public"}, "Trip privacy must be 'private' or 'link'."),
    ({"budget": 500}, "Unknown field: budget"),
])
def test_edit_trip_invalid_inputs(seeded, changes, msg):
    """Invalid input. Blank name, blank destination, wrong date format,
    end before start, bad privacy, unknown field. Expect ValidationError
    with the exact message."""
    with pytest.raises(ValidationError) as exc:
        seeded["service"].update_trip("alice", seeded["austin"].trip_id, **changes)
    assert str(exc.value) == msg


@pytest.mark.tc("TC-F-14")
def test_edit_trip_dates_conflicting_with_stops(seeded):
    """Exceptional condition. Pre: a stop on Sat Nov 21. Data: end date
    changed to Nov 20. Expect rejection and the stops-conflict message."""
    with pytest.raises(ValidationError) as exc:
        seeded["service"].update_trip(
            "alice", seeded["austin"].trip_id, end_date="2026-11-20")
    assert str(exc.value) == "Existing stops fall outside the new trip dates."


@pytest.mark.tc("TC-F-15")
def test_edit_trip_not_found_and_denied(seeded):
    """Exceptional/security. Missing id -> 'Trip not found.';
    other user's id -> permission message."""
    svc = seeded["service"]
    with pytest.raises(TripNotFoundError):
        svc.update_trip("alice", 9999, name="X")
    with pytest.raises(AccessDeniedError):
        svc.update_trip("alice", seeded["bob"].trip_id, name="X")


@pytest.mark.tc("TC-F-16")
def test_delete_trip_success(seeded):
    """Successful flow. 'Delete Trip' on Austin weekend.
    Expect 'Trip deleted.' and 2 trips left in Saved Trips."""
    svc = seeded["service"]
    assert svc.delete_trip("alice", seeded["austin"].trip_id) == "Trip deleted."
    names = [t.name for t in svc.view_saved_trips("alice").trips]
    assert names == ["Paris getaway", "Tokyo spring"]


@pytest.mark.tc("TC-F-17")
def test_delete_trip_twice_fails(seeded):
    """Exceptional condition. Second delete -> 'Trip not found.'"""
    svc, tid = seeded["service"], seeded["austin"].trip_id
    svc.delete_trip("alice", tid)
    with pytest.raises(TripNotFoundError) as exc:
        svc.delete_trip("alice", tid)
    assert str(exc.value) == "Trip not found."


@pytest.mark.tc("TC-F-18")
def test_delete_other_users_trip_denied_and_trip_survives(seeded):
    """Security. alice cannot delete bob's trip; the trip must still exist."""
    svc, bob_id = seeded["service"], seeded["bob"].trip_id
    with pytest.raises(AccessDeniedError):
        svc.delete_trip("alice", bob_id)
    assert svc.get_trip_details("bob", bob_id).name == "Bob's trip"


# ===========================================================================
# UC-10  Manage Trip: itinerary via "Edit itinerary"  (TC-F-19 .. TC-F-22)
# ===========================================================================
@pytest.mark.tc("TC-F-19")
def test_add_stop_success(seeded):
    """Successful flow. Data: 'Brunch', Sun Nov 22, 10:00-11:30, Activity,
    est. $32.50. Expect Sunday '1 stop' and 'Activity · 1.5 hours · Est. $32.50'."""
    svc, tid = seeded["service"], seeded["austin"].trip_id
    trip = svc.add_stop("alice", tid, "Brunch", "2026-11-22",
                        "10:00", "11:30", "Activity", est_cost=32.50)
    assert trip.stop_count_label(SUN) == "1 stop"
    assert trip.stops_for_day(SUN)[0].detail_label == (
        "Activity · 1.5 hours · Est. $32.50")


_STOP = dict(title="Museum", day="2026-11-21", start_time="09:00",
             end_time="10:00", category="Activity")


@pytest.mark.tc("TC-F-20")
@pytest.mark.parametrize("override, msg", [
    ({"title": ""}, "Stop title is required."),
    ({"day": "2026-12-01"}, "Stop date must fall within the trip dates."),
    ({"start_time": "9am"}, "Times must be in HH:MM format."),
    ({"end_time": "08:00"}, "End time must be after start time."),
    ({"category": "Shopping"},
     "Category must be one of: Destination, Activity, Lodging."),
    ({"est_cost": -5}, "Estimated cost cannot be negative."),
    ({"category": "Lodging", "nights": 0}, "Lodging stays must be at least 1 night."),
])
def test_add_stop_invalid_inputs(seeded, override, msg):
    """Invalid input. Empty title, date outside trip, bad time format, end
    before start, bad category, negative cost, lodging with 0 nights.
    Expect ValidationError with the exact message."""
    kwargs = {**_STOP, **override}
    with pytest.raises(ValidationError) as exc:
        seeded["service"].add_stop("alice", seeded["austin"].trip_id, **kwargs)
    assert str(exc.value) == msg


@pytest.mark.tc("TC-F-21")
def test_remove_stop_success(seeded):
    """Successful flow. Remove 'Lunch on South Congress' from Friday.
    Expect Friday '2 stops' and lunch no longer listed."""
    svc, trip = seeded["service"], seeded["austin"]
    lunch = next(s for s in trip.stops if s.title == "Lunch on South Congress")
    trip = svc.remove_stop("alice", trip.trip_id, lunch.stop_id)
    assert trip.stop_count_label(FRI) == "2 stops"
    assert "Lunch on South Congress" not in [s.title for s in trip.stops]


@pytest.mark.tc("TC-F-22")
def test_remove_stop_not_found(seeded):
    """Exceptional condition. Data: stop id 999 -> 'Stop not found.'"""
    with pytest.raises(ValidationError) as exc:
        seeded["service"].remove_stop("alice", seeded["austin"].trip_id, 999)
    assert str(exc.value) == "Stop not found."


# ===========================================================================
# Non-functional tests (measurable acceptance criteria)
# ===========================================================================
@pytest.mark.tc("TC-N-01")
def test_nf_performance_saved_trips_1000_under_200ms(service):
    """Performance. Pre: 1,000 saved trips. Criterion: list load < 200 ms."""
    for i in range(1000):
        service.save_trip("heavy", f"Trip {i:04d}", "Somewhere",
                          "2027-06-01", "2027-06-05")
    start = time.perf_counter()
    result = service.view_saved_trips("heavy")
    elapsed_ms = (time.perf_counter() - start) * 1000
    assert len(result.trips) == 1000
    assert elapsed_ms < 200, f"took {elapsed_ms:.1f} ms"


@pytest.mark.tc("TC-N-02")
def test_nf_performance_day_view_with_500_stops_under_100ms(service):
    """Performance. Pre: one day holding 500 stops. Criterion: loading trip
    details and building that day's list < 100 ms."""
    trip = service.save_trip("u", "Big", "Place", "2026-01-01", "2026-12-31")
    for i in range(500):
        service.add_stop("u", trip.trip_id, f"Stop {i}", "2026-06-15",
                         "09:00", "10:00")
    day = date(2026, 6, 15)
    start = time.perf_counter()
    details = service.get_trip_details("u", trip.trip_id)
    stops = details.stops_for_day(day)
    count = details.stop_count_label(day)
    elapsed_ms = (time.perf_counter() - start) * 1000
    assert len(stops) == 500 and count == "500 stops"
    assert elapsed_ms < 100, f"took {elapsed_ms:.1f} ms"


@pytest.mark.tc("TC-N-03")
def test_nf_reliability_failed_edit_leaves_trip_unchanged(seeded):
    """Data integrity. A multi-field edit where one field is invalid must
    change NOTHING (atomic). Criterion: 0 fields modified on failure."""
    svc, tid = seeded["service"], seeded["austin"].trip_id
    before = svc.get_trip_details("alice", tid)
    with pytest.raises(ValidationError):
        svc.update_trip("alice", tid, name="New name", privacy="public")
    assert svc.get_trip_details("alice", tid) == before


@pytest.mark.tc("TC-N-04")
def test_nf_reliability_repeated_add_remove_is_consistent(seeded):
    """Reliability. 200 add/remove cycles. Criterion: stop count returns to
    the original 4 with the original Friday list."""
    svc, tid = seeded["service"], seeded["austin"].trip_id
    original = svc.get_trip_details("alice", tid).stops
    for _ in range(200):
        trip = svc.add_stop("alice", tid, "Temp", "2026-11-22", "10:00", "11:00")
        svc.remove_stop("alice", tid, trip.stops[-1].stop_id)
    assert svc.get_trip_details("alice", tid).stops == original


@pytest.mark.tc("TC-N-05")
def test_nf_usability_error_messages_are_user_safe(seeded):
    """Usability/security. Criterion: every error message is a non-empty
    sentence ending in '.', with no class names or tracebacks."""
    svc = seeded["service"]
    errors = []
    for call in (
        lambda: svc.get_trip_details("alice", 9999),
        lambda: svc.get_trip_details("alice", seeded["bob"].trip_id),
        lambda: svc.update_trip("alice", seeded["austin"].trip_id, name=""),
        lambda: svc.add_stop("alice", seeded["austin"].trip_id, "", "2026-11-21",
                             "09:00", "10:00"),
    ):
        with pytest.raises(tm.TripError) as exc:
            call()
        errors.append(str(exc.value))
    for msg in errors:
        assert msg and msg.endswith(".")
        assert "Traceback" not in msg and "Error" not in msg
