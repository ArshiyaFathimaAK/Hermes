from typing import Annotated

from fastapi import APIRouter, Depends, Query

from .models import Stay
from .provider import StayProvider, get_stay_provider

router = APIRouter(tags=["stays"])
Provider = Annotated[StayProvider, Depends(get_stay_provider)]


@router.get("/places/{place_id}/stays")
async def list_for_place(place_id: str, provider: Provider) -> list[Stay]:
    return await provider.list_for_place(place_id)


@router.get("/stays")
async def get_many(
    provider: Provider,
    ids: Annotated[str, Query(description="Comma-separated stay ids")] = "",
) -> list[Stay]:
    return await provider.get_many([i for i in ids.split(",") if i])
