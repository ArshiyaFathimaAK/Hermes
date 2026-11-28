from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ...errors import ApiError
from .models import Stay, StayDates
from .provider import StayProvider, get_stay_provider

router = APIRouter(tags=["stays"])
Provider = Annotated[StayProvider, Depends(get_stay_provider)]

# Choose now, so the server says at startup when stays run on sample data (no key).
get_stay_provider()

# Longer stays are refused before asking anyone.
MAX_NIGHTS = 30


def stay_dates(
    check_in: Annotated[date | None, Query(alias="checkIn")] = None,
    check_out: Annotated[date | None, Query(alias="checkOut")] = None,
) -> StayDates | None:
    if check_in is None and check_out is None:
        return None
    if check_in is None or check_out is None:
        raise ApiError("Send both checkIn and checkOut, or neither.")
    dates = StayDates(check_in=check_in, check_out=check_out)
    if not 1 <= dates.nights <= MAX_NIGHTS:
        raise ApiError(f"A stay is 1 to {MAX_NIGHTS} nights.")
    return dates


Dates = Annotated[StayDates | None, Depends(stay_dates)]


# Fields a stay doesn't have are left out, so the app can tell "unknown" from a value.
@router.get("/places/{place_id}/stays", response_model_exclude_none=True)
async def list_for_place(place_id: str, provider: Provider, dates: Dates) -> list[Stay]:
    return await provider.list_for_place(place_id, dates)


@router.get("/stays", response_model_exclude_none=True)
async def get_many(
    provider: Provider,
    dates: Dates,
    ids: Annotated[str, Query(description="Comma-separated stay ids")] = "",
) -> list[Stay]:
    return await provider.get_many([i for i in ids.split(",") if i][:50], dates)
