from typing import Annotated

from fastapi import APIRouter, Depends, Query

from .models import Place
from .provider import PlaceProvider, get_place_provider

router = APIRouter(prefix="/places", tags=["places"])
Provider = Annotated[PlaceProvider, Depends(get_place_provider)]


@router.get("/search")
async def search(provider: Provider, q: Annotated[str, Query(max_length=100)] = "") -> list[Place]:
    return await provider.search(q)


@router.get("/{place_id}")
async def get_place(place_id: str, provider: Provider) -> Place:
    return await provider.get(place_id)
