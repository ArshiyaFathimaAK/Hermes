from typing import Annotated

from fastapi import APIRouter, Depends

from .models import ItineraryPlan, ItineraryRequest
from .provider import ItineraryProvider, get_itinerary_provider

router = APIRouter(prefix="/itinerary", tags=["itinerary"])
Provider = Annotated[ItineraryProvider, Depends(get_itinerary_provider)]


@router.post("/generate")
async def generate(request: ItineraryRequest, provider: Provider) -> ItineraryPlan:
    return await provider.generate(request)
