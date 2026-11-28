"""Matches CostEstimate in hermes/src/services/costs/contract.ts.

The app sends only what the estimate needs, not the whole trip: trips are stored in Supabase.
"""

from datetime import date

from ...models import ApiModel


class CostRequest(ApiModel):
    activity_ids: list[str] = []
    stay_ids: list[str] = []
    nights: int = 0
    # The trip's dates, when it has them. Live stay prices depend on them.
    check_in: date | None = None
    check_out: date | None = None


class CostEstimate(ApiModel):
    lodging: float
    activities: float
    total: float
    unpriced: int
