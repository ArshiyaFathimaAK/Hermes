"""
trip_manager.py
===============
Purpose : Business logic behind the Hermes "Saved Trips" screen (UC-09) and
          the "Edit trip" screen (UC-10).
Module  : Trip management (model + service + in-memory repository).
Author  : <Your Name>   (AI-assisted; reviewed and adapted by the author)

Use cases covered
-----------------
UC-09  View Saved Trips -> TripService.view_saved_trips(), get_trip_details()
                           plus the display helpers on Trip / Stop that
                           produce the text shown on screen (time frame,
                           day tabs, "3 stops", "Est. $28", ...).
UC-10  Manage Trip      -> TripService.update_trip()  (name, destination,
                           start/end date, privacy), delete_trip(), and
                           add_stop() / remove_stop() (reached from the
                           "Edit itinerary" button).
"""
from __future__ import annotations

import itertools
from dataclasses import dataclass, field, replace
from datetime import date, time, timedelta
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# User-facing messages (tests assert on these exact strings)
# ---------------------------------------------------------------------------
MSG_NOT_FOUND = "Trip not found."
MSG_ACCESS_DENIED = "You do not have permission to access this trip."
MSG_NAME_REQUIRED = "Trip name is required."
MSG_DEST_REQUIRED = "Destination is required."
MSG_BAD_DATE = "Dates must be in YYYY-MM-DD format."
MSG_BAD_TIME = "Times must be in HH:MM format."
MSG_DATE_ORDER = "End date cannot be before start date."
MSG_BAD_PRIVACY = "Trip privacy must be 'private' or 'link'."
MSG_UNKNOWN_FIELD = "Unknown field: {field}"
MSG_NO_TRIPS = "You have no saved trips."
MSG_STOP_TITLE = "Stop title is required."
MSG_STOP_OUTSIDE = "Stop date must fall within the trip dates."
MSG_STOP_TIME_ORDER = "End time must be after start time."
MSG_STOP_CATEGORY = "Category must be one of: Destination, Activity, Lodging."
MSG_STOP_COST = "Estimated cost cannot be negative."
MSG_STOP_NIGHTS = "Lodging stays must be at least 1 night."
MSG_STOP_NOT_FOUND = "Stop not found."
MSG_DATES_CONFLICT = "Existing stops fall outside the new trip dates."
MSG_DELETED = "Trip deleted."

VALID_PRIVACY = ("private", "link")          # "Private" / "Share by link"
VALID_CATEGORIES = ("Destination", "Activity", "Lodging")
EDITABLE_FIELDS = ("name", "destination", "start_date", "end_date", "privacy")


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class TripError(Exception):
    """Base class; str(error) is always safe to show to the end user."""


class TripNotFoundError(TripError):
    pass


class AccessDeniedError(TripError):
    pass


class ValidationError(TripError):
    pass


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
def _fmt_date(d: date) -> str:
    return f"{d:%b} {d.day}, {d.year}"          # "Nov 20, 2026"


@dataclass(frozen=True)
class Stop:
    """One itinerary stop, e.g. 'Lunch on South Congress'."""
    stop_id: int
    title: str
    day: date
    start_time: time
    end_time: time
    category: str = "Activity"
    est_cost: float = 0.0
    nights: int = 0                             # only used for Lodging

    @property
    def time_range_label(self) -> str:
        return f"{self.start_time:%H:%M}–{self.end_time:%H:%M}"   # 09:00–10:30

    @property
    def duration_label(self) -> str:
        if self.category == "Lodging":
            return f"{self.nights} night" + ("" if self.nights == 1 else "s")
        start = self.start_time.hour * 60 + self.start_time.minute
        end = self.end_time.hour * 60 + self.end_time.minute
        hours = (end - start) / 60
        return "1 hour" if hours == 1 else f"{hours:g} hours"

    @property
    def cost_label(self) -> str:
        if self.est_cost == 0:
            return "Free"
        amount = (f"{self.est_cost:.0f}" if float(self.est_cost).is_integer()
                  else f"{self.est_cost:.2f}")
        return f"Est. ${amount}"

    @property
    def detail_label(self) -> str:
        """Second line of a stop card, e.g. 'Activity · 1 hour · Est. $28'."""
        return f"{self.category} · {self.duration_label} · {self.cost_label}"


@dataclass(frozen=True)
class Trip:
    trip_id: int
    owner_id: str
    name: str
    destination: str
    start_date: date
    end_date: date
    privacy: str = "private"
    stops: tuple = field(default_factory=tuple)   # tuple of Stop

    # -- text shown on the Saved Trips card --------------------------------
    @property
    def time_frame_label(self) -> str:
        return f"{_fmt_date(self.start_date)} to {_fmt_date(self.end_date)}"

    # -- day tabs ("Fri 20", "Sat 21", ...) --------------------------------
    @property
    def days(self) -> List[date]:
        count = (self.end_date - self.start_date).days + 1
        return [self.start_date + timedelta(days=n) for n in range(count)]

    def day_tabs(self) -> List[str]:
        return [f"{d:%a} {d.day}" for d in self.days]

    def day_heading(self, day: date) -> str:
        return f"{day:%A}, {day:%B} {day.day}"       # "Friday, November 20"

    def stops_for_day(self, day: date) -> List[Stop]:
        todays = [s for s in self.stops if s.day == day]
        return sorted(todays, key=lambda s: (s.start_time, s.stop_id))

    def stop_count_label(self, day: date) -> str:
        n = len(self.stops_for_day(day))
        return f"{n} stop" + ("" if n == 1 else "s")


@dataclass
class ViewResult:
    trips: List[Trip]
    message: str = ""


# ---------------------------------------------------------------------------
# Repository (in-memory; swap for a DB-backed class later)
# ---------------------------------------------------------------------------
class InMemoryTripRepository:
    def __init__(self) -> None:
        self._trips: Dict[int, Trip] = {}
        self._ids = itertools.count(1)
        self._stop_ids = itertools.count(1)

    def next_trip_id(self) -> int:
        return next(self._ids)

    def next_stop_id(self) -> int:
        return next(self._stop_ids)

    def put(self, trip: Trip) -> None:
        self._trips[trip.trip_id] = trip

    def get(self, trip_id: int) -> Optional[Trip]:
        return self._trips.get(trip_id)

    def delete(self, trip_id: int) -> None:
        self._trips.pop(trip_id, None)

    def all_for_owner(self, owner_id: str) -> List[Trip]:
        return [t for t in self._trips.values() if t.owner_id == owner_id]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _parse_date(value) -> date:
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValidationError(MSG_BAD_DATE) from None


def _parse_time(value) -> time:
    if isinstance(value, time):
        return value
    try:
        return time.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValidationError(MSG_BAD_TIME) from None


def _clean_text(value) -> str:
    return value.strip() if isinstance(value, str) else ""


def _validate_trip_fields(name, destination, start, end, privacy) -> None:
    if not name:
        raise ValidationError(MSG_NAME_REQUIRED)
    if not destination:
        raise ValidationError(MSG_DEST_REQUIRED)
    if end < start:
        raise ValidationError(MSG_DATE_ORDER)
    if privacy not in VALID_PRIVACY:
        raise ValidationError(MSG_BAD_PRIVACY)


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
class TripService:
    def __init__(self, repo: Optional[InMemoryTripRepository] = None) -> None:
        self.repo = repo or InMemoryTripRepository()

    # -- internal ----------------------------------------------------------
    def _owned_trip(self, owner_id: str, trip_id: int) -> Trip:
        trip = self.repo.get(trip_id)
        if trip is None:
            raise TripNotFoundError(MSG_NOT_FOUND)
        if trip.owner_id != owner_id:
            raise AccessDeniedError(MSG_ACCESS_DENIED)
        return trip

    # -- create (used to seed saved trips) --------------------------------
    def save_trip(self, owner_id: str, name: str, destination: str,
                  start_date, end_date, privacy: str = "private") -> Trip:
        name, destination = _clean_text(name), _clean_text(destination)
        start, end = _parse_date(start_date), _parse_date(end_date)
        _validate_trip_fields(name, destination, start, end, privacy)
        trip = Trip(self.repo.next_trip_id(), owner_id, name, destination,
                    start, end, privacy)
        self.repo.put(trip)
        return trip

    # -- UC-09 View Saved Trips -------------------------------------------
    def view_saved_trips(self, owner_id: str) -> ViewResult:
        """Saved Trips screen: the user's own trips, soonest first."""
        trips = sorted(self.repo.all_for_owner(owner_id),
                       key=lambda t: (t.start_date, t.trip_id))
        return ViewResult(trips, "" if trips else MSG_NO_TRIPS)

    def get_trip_details(self, owner_id: str, trip_id: int) -> Trip:
        """Expanded trip card: day tabs plus each day's stops."""
        return self._owned_trip(owner_id, trip_id)

    # -- UC-10 Manage Trip: edit / delete ---------------------------------
    def update_trip(self, owner_id: str, trip_id: int, **changes) -> Trip:
        """Edit-trip form: name, destination, start/end date, privacy."""
        trip = self._owned_trip(owner_id, trip_id)
        for key in changes:
            if key not in EDITABLE_FIELDS:
                raise ValidationError(MSG_UNKNOWN_FIELD.format(field=key))

        # Build the candidate first so a failed update never half-applies.
        values = {
            "name": _clean_text(changes.get("name", trip.name)),
            "destination": _clean_text(changes.get("destination", trip.destination)),
            "start_date": _parse_date(changes.get("start_date", trip.start_date)),
            "end_date": _parse_date(changes.get("end_date", trip.end_date)),
            "privacy": changes.get("privacy", trip.privacy),
        }
        _validate_trip_fields(values["name"], values["destination"],
                              values["start_date"], values["end_date"],
                              values["privacy"])
        if any(not (values["start_date"] <= s.day <= values["end_date"])
               for s in trip.stops):
            raise ValidationError(MSG_DATES_CONFLICT)

        updated = replace(trip, **values)
        self.repo.put(updated)
        return updated

    def delete_trip(self, owner_id: str, trip_id: int) -> str:
        """'Delete Trip' button."""
        self._owned_trip(owner_id, trip_id)
        self.repo.delete(trip_id)
        return MSG_DELETED

    # -- UC-10 Manage Trip: itinerary ("Edit itinerary" button) -----------
    def add_stop(self, owner_id: str, trip_id: int, title: str, day,
                 start_time, end_time, category: str = "Activity",
                 est_cost: float = 0.0, nights: int = 0) -> Trip:
        trip = self._owned_trip(owner_id, trip_id)
        title = _clean_text(title)
        if not title:
            raise ValidationError(MSG_STOP_TITLE)
        day = _parse_date(day)
        if not (trip.start_date <= day <= trip.end_date):
            raise ValidationError(MSG_STOP_OUTSIDE)
        start, end = _parse_time(start_time), _parse_time(end_time)
        if end <= start:
            raise ValidationError(MSG_STOP_TIME_ORDER)
        if category not in VALID_CATEGORIES:
            raise ValidationError(MSG_STOP_CATEGORY)
        if (not isinstance(est_cost, (int, float)) or isinstance(est_cost, bool)
                or est_cost < 0):
            raise ValidationError(MSG_STOP_COST)
        if category == "Lodging" and nights < 1:
            raise ValidationError(MSG_STOP_NIGHTS)

        stop = Stop(self.repo.next_stop_id(), title, day, start, end,
                    category, float(est_cost), nights if category == "Lodging" else 0)
        updated = replace(trip, stops=trip.stops + (stop,))
        self.repo.put(updated)
        return updated

    def remove_stop(self, owner_id: str, trip_id: int, stop_id: int) -> Trip:
        trip = self._owned_trip(owner_id, trip_id)
        remaining = tuple(s for s in trip.stops if s.stop_id != stop_id)
        if len(remaining) == len(trip.stops):
            raise ValidationError(MSG_STOP_NOT_FOUND)
        updated = replace(trip, stops=remaining)
        self.repo.put(updated)
        return updated
