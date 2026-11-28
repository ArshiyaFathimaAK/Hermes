"""Generate AI Itinerary.

With OPENAI_API_KEY set in .env, the AI plans the days (live.py). Without it, or when the AI fails,
the simple rules in rules.py do, so teammates and graders without a key can still run everything.
Things to do come from the activity provider, so live ones arrive here once that goes live.
"""

import asyncio
from typing import Annotated, Protocol

from fastapi import Depends

from ...config import get_settings
from ...errors import NotFound
from ..activities.models import Activity
from ..activities.provider import ActivityProvider, get_activity_provider
from .models import ItineraryPlan, ItineraryRequest
from .rules import Catalog, check_request, plan_with_rules


class ItineraryProvider(Protocol):
    async def generate(self, request: ItineraryRequest) -> ItineraryPlan:
        """Raises ApiError when the trip can't be planned, such as a trip with no dates."""
        ...


async def load_catalog(activities: ActivityProvider, request: ItineraryRequest) -> Catalog:
    """The things to do at the trip's places, plus any saved thing that isn't listed there."""

    async def at_place(place_id: str) -> list[Activity]:
        try:
            return await activities.list_for_place(place_id)
        except NotFound:
            return []

    places = list(dict.fromkeys(request.place_ids))
    lists = await asyncio.gather(*(at_place(place_id) for place_id in places))
    by_place = dict(zip(places, lists, strict=True))
    by_id = {activity.id: activity for found in lists for activity in found}
    missing = [item.activity_id for item in request.items if item.activity_id not in by_id]
    if missing:
        for activity in await activities.get_many(missing):
            by_id.setdefault(activity.id, activity)
    return Catalog(by_place=by_place, by_id=by_id)


class RuleItineraryProvider:
    def __init__(self, activities: ActivityProvider):
        self.activities = activities

    async def generate(self, request: ItineraryRequest) -> ItineraryPlan:
        check_request(request)
        catalog = await load_catalog(self.activities, request)
        return ItineraryPlan(source="rules", entries=plan_with_rules(request, catalog))


def get_itinerary_provider(
    activities: Annotated[ActivityProvider, Depends(get_activity_provider)],
) -> ItineraryProvider:
    settings = get_settings()
    if settings.openai_api_key:
        from .live import OpenAIItineraryProvider

        return OpenAIItineraryProvider(activities, settings)
    return RuleItineraryProvider(activities)
