from typing import Annotated

from fastapi import APIRouter, Depends

from .models import CostEstimate, CostRequest
from .provider import CostProvider, get_cost_provider

router = APIRouter(prefix="/costs", tags=["costs"])
Provider = Annotated[CostProvider, Depends(get_cost_provider)]


@router.post("/estimate")
async def estimate(request: CostRequest, provider: Provider) -> CostEstimate:
    return await provider.estimate(request)
