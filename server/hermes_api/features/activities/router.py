from typing import Annotated

from fastapi import APIRouter, Depends, Query

from .models import Activity, ActivityDetail
from .provider import ActivityProvider, get_activity_provider

router = APIRouter(tags=["activities"])
Provider = Annotated[ActivityProvider, Depends(get_activity_provider)]


@router.get("/places/{place_id}/activities")
async def list_for_place(place_id: str, provider: Provider) -> list[Activity]:
    return await provider.list_for_place(place_id)


@router.get("/activities")
async def get_many(
    provider: Provider,
    ids: Annotated[str, Query(description="Comma-separated activity ids")] = "",
) -> list[Activity]:
    return await provider.get_many([i for i in ids.split(",") if i])


@router.get("/activities/{activity_id}")
async def detail(activity_id: str, provider: Provider) -> ActivityDetail:
    return await provider.detail(activity_id)
