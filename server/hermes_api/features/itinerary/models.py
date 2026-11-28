"""Generate AI Itinerary. Matches hermes/src/services/itinerary/contract.ts, and TripItem in
hermes/src/domain/trip.ts.

The app sends what the plan needs, not the whole trip: trips are stored in Supabase.
"""

from typing import Literal

from ...models import ApiModel

DaySlot = Literal["morning", "afternoon", "evening"]
DAY_SLOTS: tuple[DaySlot, ...] = ("morning", "afternoon", "evening")


class TripSchedule(ApiModel):
    # 0 = first day of the trip.
    day: int
    slot: DaySlot


class TripItem(ApiModel):
    activity_id: str
    place_id: str
    # Missing until it is put on a day.
    schedule: TripSchedule | None = None


class ItineraryRequest(ApiModel):
    # The trip's places, in the trip's order.
    place_ids: list[str] = []
    # Days in the trip, both ends included: a trip from the 1st to the 3rd has 3.
    day_count: int = 0
    # Things already in the trip. Ones with a schedule stay where they are.
    items: list[TripItem] = []
    # Also suggest other things to do at the trip's places.
    add_suggestions: bool = True


class PlanEntry(ApiModel):
    activity_id: str
    place_id: str
    schedule: TripSchedule
    # True for something that is not in the trip yet.
    suggested: bool


class ItineraryPlan(ApiModel):
    # "ai" when the AI made the plan, "rules" when the simple rules did (no key, or the AI failed).
    source: Literal["ai", "rules"]
    # Only things that change: saved things put on a day, and suggestions. In the order to add them.
    entries: list[PlanEntry]
