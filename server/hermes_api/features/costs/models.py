"""Matches CostEstimate in hermes/src/services/costs/contract.ts.

The app sends only what the estimate needs, not the whole trip: trips are stored in Supabase.
"""

from ...models import ApiModel


class CostRequest(ApiModel):
    activity_ids: list[str] = []
    stay_ids: list[str] = []
    nights: int = 0


class CostEstimate(ApiModel):
    lodging: float
    activities: float
    total: float
    unpriced: int
