"""UC-11 View Estimated Trip Cost.

The rule lives here; prices come from the activity and stay providers, so live prices
arrive here on their own once those go live.
"""

from typing import Annotated, Protocol

from fastapi import Depends

from ..activities.provider import ActivityProvider, get_activity_provider
from ..stays.models import StayDates
from ..stays.provider import StayProvider, get_stay_provider
from .models import CostEstimate, CostRequest


class CostProvider(Protocol):
    async def estimate(self, request: CostRequest) -> CostEstimate: ...


class SimpleCostProvider:
    """Every priced activity once, plus every chosen stay for every night."""

    def __init__(self, activities: ActivityProvider, stays: StayProvider):
        self.activities = activities
        self.stays = stays

    async def estimate(self, request: CostRequest) -> CostEstimate:
        activities = await self.activities.get_many(request.activity_ids)
        dates = (
            StayDates(check_in=request.check_in, check_out=request.check_out)
            if request.check_in and request.check_out and request.check_out > request.check_in
            else None
        )
        stays = await self.stays.get_many(request.stay_ids, dates)
        priced = [a for a in activities if a.price_amount is not None]
        activity_total = sum(a.price_amount or 0 for a in priced)
        # A stay without a price (no dates, or no room then) adds nothing rather than a guess.
        lodging = sum(s.nightly for s in stays if s.nightly is not None) * max(request.nights, 0)
        return CostEstimate(
            lodging=lodging,
            activities=activity_total,
            total=lodging + activity_total,
            unpriced=len(activities) - len(priced),
        )


def get_cost_provider(
    activities: Annotated[ActivityProvider, Depends(get_activity_provider)],
    stays: Annotated[StayProvider, Depends(get_stay_provider)],
) -> CostProvider:
    return SimpleCostProvider(activities, stays)
