"""The planning rules.

Used on their own when there is no OpenAI key or the AI fails, and to check and complete what the AI
sends back, so every plan follows them:

- Things that already have a day stay where they are.
- Every saved thing without a day gets one.
- The days are split between the trip's places, in order: a 4-day trip to Lisbon then Kyoto gives
  Lisbon days 1-2 and Kyoto days 3-4.
- A saved thing goes in an empty slot on the least busy of its place's days, in the slot that suits
  it: tours and sights in the morning, food in the evening.
- Suggestions go only in empty slots, on days with fewer than 2 things: one per day in turn, the
  best rated first.

The app's mock follows the same rules (hermes/src/services/itinerary/plan-rules.ts). Change both.
"""

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field

from ...errors import ApiError
from ..activities.models import Activity
from .models import DAY_SLOTS, DaySlot, ItineraryRequest, PlanEntry, TripItem, TripSchedule

MAX_DAYS = 30
MAX_PLACES = 10
MAX_ITEMS = 200
# Suggestions go only on days with fewer things than this.
SUGGEST_UNTIL = 2

SLOT_PREFERENCE: dict[str, tuple[DaySlot, ...]] = {
    "tours": ("morning", "afternoon", "evening"),
    "sights": ("morning", "afternoon", "evening"),
    "food": ("evening", "afternoon", "morning"),
}


def check_request(request: ItineraryRequest) -> None:
    """Messages are shown to people."""
    if not request.place_ids:
        raise ApiError("Add a place to the trip first.")
    if len(request.place_ids) > MAX_PLACES:
        raise ApiError(f"Plans can be made for up to {MAX_PLACES} places at a time.")
    if request.day_count < 1:
        raise ApiError("Pick dates for the trip first.")
    if request.day_count > MAX_DAYS:
        raise ApiError(f"Plans can be made for trips of up to {MAX_DAYS} days.")
    if len(request.items) > MAX_ITEMS:
        raise ApiError("That trip has too many things to plan at once.")


@dataclass
class Catalog:
    """The things to do that a plan may use."""

    # Each of the trip's places, with its things to do in the provider's order.
    by_place: dict[str, list[Activity]]
    # Every known thing to do by id, saved ones included.
    by_id: dict[str, Activity]


@dataclass
class Board:
    """How many things are in each slot of each day so far."""

    day_count: int
    counts: dict[tuple[int, str], int] = field(default_factory=lambda: defaultdict(int))

    def load(self, day: int) -> int:
        return sum(self.counts[(day, slot)] for slot in DAY_SLOTS)

    def is_empty(self, day: int, slot: str) -> bool:
        return self.counts[(day, slot)] == 0

    def add(self, day: int, slot: str) -> None:
        self.counts[(day, slot)] += 1


def place_days(place_ids: list[str], day_count: int) -> dict[str, list[int]]:
    """Splits the days between the places, in order. With more places than days, places share."""
    places = list(dict.fromkeys(place_ids))
    days: dict[str, list[int]] = {}
    for index, place_id in enumerate(places):
        start = index * day_count // len(places)
        end = (index + 1) * day_count // len(places)
        days[place_id] = list(range(start, end)) or [min(start, day_count - 1)]
    return days


def day_places(place_ids: list[str], day_count: int) -> list[str]:
    """The place for each day: the first one that has it."""
    owners: list[str | None] = [None] * day_count
    for place_id, days in place_days(place_ids, day_count).items():
        for day in days:
            owners[day] = owners[day] or place_id
    return [owner or place_ids[0] for owner in owners]


def is_placed(item: TripItem, day_count: int) -> bool:
    return item.schedule is not None and 0 <= item.schedule.day < day_count


def starting_board(request: ItineraryRequest) -> Board:
    board = Board(request.day_count)
    for item in request.items:
        if item.schedule is not None and is_placed(item, request.day_count):
            board.add(item.schedule.day, item.schedule.slot)
    return board


def preference(activity: Activity) -> tuple[DaySlot, ...]:
    return SLOT_PREFERENCE.get(activity.category, DAY_SLOTS)


def best_spot(board: Board, days: list[int], activity: Activity) -> TripSchedule:
    """An empty slot on the least busy day, then the earliest day, then the slot that suits it."""
    slots = preference(activity)
    day, slot = min(
        ((day, slot) for day in days for slot in slots),
        key=lambda spot: (
            not board.is_empty(*spot),
            board.load(spot[0]),
            spot[0],
            slots.index(spot[1]),
        ),
    )
    return TripSchedule(day=day, slot=slot)


def plan_saved(
    request: ItineraryRequest,
    catalog: Catalog,
    board: Board,
    skip: Iterable[str] = (),
) -> list[PlanEntry]:
    """Gives each saved thing without a day a spot. Unknown ones are left as they are."""
    days_for = place_days(request.place_ids, request.day_count)
    every_day = list(range(request.day_count))
    seen = set(skip)
    entries = []
    for item in request.items:
        activity = catalog.by_id.get(item.activity_id)
        if activity is None or item.activity_id in seen or is_placed(item, request.day_count):
            continue
        seen.add(item.activity_id)
        schedule = best_spot(board, days_for.get(item.place_id, every_day), activity)
        board.add(schedule.day, schedule.slot)
        entries.append(
            PlanEntry(
                activity_id=item.activity_id,
                place_id=item.place_id,
                schedule=schedule,
                suggested=False,
            )
        )
    return entries


def suggest(
    request: ItineraryRequest, catalog: Catalog, board: Board, used: set[str]
) -> list[PlanEntry]:
    """Fills empty slots with the best rated things not in the trip, one day at a time."""
    if not request.add_suggestions:
        return []
    owners = day_places(request.place_ids, request.day_count)
    entries = []
    added = True
    while added:
        added = False
        for day in range(request.day_count):
            if board.load(day) >= SUGGEST_UNTIL:
                continue
            options = [
                (activity, index, slot)
                for index, activity in enumerate(catalog.by_place.get(owners[day], []))
                if activity.id not in used
                for slot in DAY_SLOTS
                if board.is_empty(day, slot)
            ]
            if not options:
                continue
            activity, _, slot = min(
                options,
                key=lambda option: (
                    preference(option[0]).index(option[2]),
                    -(option[0].rating or 0),
                    option[1],
                    DAY_SLOTS.index(option[2]),
                ),
            )
            board.add(day, slot)
            used.add(activity.id)
            entries.append(
                PlanEntry(
                    activity_id=activity.id,
                    place_id=owners[day],
                    schedule=TripSchedule(day=day, slot=slot),
                    suggested=True,
                )
            )
            added = True
    return entries


def plan_with_rules(request: ItineraryRequest, catalog: Catalog) -> list[PlanEntry]:
    board = starting_board(request)
    saved = plan_saved(request, catalog, board)
    used = {item.activity_id for item in request.items}
    return saved + suggest(request, catalog, board, used)


@dataclass(frozen=True)
class Proposal:
    """One line of the AI's plan, before it is checked."""

    activity_id: str
    day: int
    slot: str


def clean_ai_plan(
    request: ItineraryRequest, catalog: Catalog, proposals: Iterable[Proposal]
) -> tuple[list[PlanEntry], int]:
    """Keeps what follows the rules and drops the rest: ids that weren't offered, days outside the
    trip, things that already have a day, and suggestions that aren't wanted or don't fit. Then
    places any saved thing the AI missed. Returns the plan and how many of the AI's lines it kept.
    """
    day_count = request.day_count
    board = starting_board(request)
    in_trip = {item.activity_id for item in request.items}
    waiting = {
        item.activity_id: item
        for item in request.items
        if not is_placed(item, day_count) and item.activity_id in catalog.by_id
    }
    offered = {
        activity.id: place_id
        for place_id, activities in catalog.by_place.items()
        for activity in activities
    }
    kept: list[PlanEntry] = []
    used: set[str] = set()
    for proposal in proposals:
        if proposal.activity_id in used or proposal.slot not in DAY_SLOTS:
            continue
        if not 0 <= proposal.day < day_count:
            continue
        if proposal.activity_id in waiting:
            place_id, suggested = waiting[proposal.activity_id].place_id, False
        elif (
            request.add_suggestions
            and proposal.activity_id in offered
            and proposal.activity_id not in in_trip
            and board.is_empty(proposal.day, proposal.slot)
            and board.load(proposal.day) < SUGGEST_UNTIL
        ):
            place_id, suggested = offered[proposal.activity_id], True
        else:
            continue
        board.add(proposal.day, proposal.slot)
        used.add(proposal.activity_id)
        kept.append(
            PlanEntry(
                activity_id=proposal.activity_id,
                place_id=place_id,
                schedule=TripSchedule(day=proposal.day, slot=proposal.slot),  # type: ignore[arg-type]
                suggested=suggested,
            )
        )
    return kept + plan_saved(request, catalog, board, skip=used), len(kept)
